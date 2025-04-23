import { wrap, proxy, Remote } from 'comlink';
import { Workbox } from 'workbox-window';

/**
 * @typedef {'idle'|'listening'|'processing'|'speaking'|'error'} AliciaState
 * @typedef {{ 
 *   from: AliciaState, 
 *   to: AliciaState, 
 *   event: string, 
 *   timestamp: number 
 * }} StateTransition
 * @typedef {{
 *   state: AliciaState,
 *   transitions: StateTransition[],
 *   retries: number
 * }} FSMContext
 */

interface WorkerHandlers {
  onStateChange: (state: AliciaState) => void;
  onError: (error: Error) => void;
}

export class AliciaStateManager {
  private static instance: AliciaStateManager;
  private currentState: AliciaState = 'idle';
  private transitions: StateTransition[] = [];
  private retryCount = 0;
  private workers = {
    stt: null as Remote<WorkerHandlers> | null,
    tts: null as Remote<WorkerHandlers> | null
  };
  private workbox: Workbox | null = null;

  private validTransitions: Record<AliciaState, AliciaState[]> = {
    idle: ['listening'],
    listening: ['processing', 'idle', 'error'],
    processing: ['speaking', 'idle', 'error'],
    speaking: ['idle', 'error'],
    error: ['idle', 'listening']
  };

  private constructor() {
    this.setupServiceWorker();
  }

  public static getInstance(): AliciaStateManager {
    if (!AliciaStateManager.instance) {
      AliciaStateManager.instance = new AliciaStateManager();
    }
    return AliciaStateManager.instance;
  }

  private async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      this.workbox = new Workbox('/sw.js');
      await this.workbox.register();
    }
  }

  public async connectWorker<T extends Worker>(
    type: 'stt' | 'tts',
    worker: T
  ): Promise<void> {
    const workerProxy = wrap<WorkerHandlers>(worker);
    this.workers[type] = workerProxy;
    
    await workerProxy.onStateChange(proxy((state: AliciaState) => {
      this.transition(state, { source: `${type}-worker` });
    });

    await workerProxy.onError(proxy((error: Error) => {
      this.handleError(error, { source: type });
    });
  }

  public async transition(
    newState: AliciaState,
    context: Record<string, unknown> = {}
  ): Promise<boolean> {
    if (!this.isValidTransition(newState)) {
      this.dispatchEvent('transition-error', { 
        from: this.currentState,
        to: newState,
        context
      });
      return false;
    }

    const transition: StateTransition = {
      from: this.currentState,
      to: newState,
      event: context.event?.toString() || 'manual',
      timestamp: Date.now()
    };

    this.transitions = [...this.transitions.slice(-9), transition];
    this.currentState = newState;

    this.dispatchEvent('statechange', { 
      detail: transition,
      context
    });

    this.handleStateEntry(transition, context);
    return true;
  }

  private handleStateEntry(
    transition: StateTransition,
    context: Record<string, unknown>
  ) {
    switch (transition.to) {
      case 'error':
        this.handleErrorState(context);
        break;
      case 'processing':
        this.setProcessingTimeout();
        break;
      case 'listening':
        this.setSpeechTimeout();
        break;
    }
  }

  private handleErrorState(context: Record<string, unknown>) {
    const maxRetries = 3;
    const backoff = Math.min(1000 * 2 ** this.retryCount, 30000);
    
    if (this.retryCount < maxRetries) {
      setTimeout(() => {
        this.retryCount++;
        this.transition(context.recoverTo || 'idle', {
          ...context,
          isRetry: true
        });
      }, backoff);
    } else {
      this.retryCount = 0;
      this.transition('idle', { ...context, final: true });
    }
  }

  private isValidTransition(newState: AliciaState): boolean {
    return this.validTransitions[this.currentState].includes(newState);
  }

  private dispatchEvent(
    type: string,
    data: CustomEventInit
  ): void {
    const event = new CustomEvent(`alicia:${type}`, {
      bubbles: true,
      cancelable: false,
      detail: {
        ...data.detail,
        timestamp: Date.now(),
        context: data.context
      }
    });

    document.dispatchEvent(event);
    this.workers.stt?.onStateChange?.(this.currentState);
    this.workers.tts?.onStateChange?.(this.currentState);
  }

  // Mobile optimization timeouts
  private setProcessingTimeout() {
    setTimeout(() => {
      if (this.currentState === 'processing') {
        this.transition('error', { timeout: true });
      }
    }, 8000);
  }

  private setSpeechTimeout() {
    setTimeout(() => {
      if (this.currentState === 'listening') {
        this.transition('idle', { noSpeech: true });
      }
    }, 10000);
  }

  public get state(): AliciaState {
    return this.currentState;
  }

  public get history(): StateTransition[] {
    return this.transitions;
  }
}

export const stateManager = AliciaStateManager.getInstance();
