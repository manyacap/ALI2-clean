import { wrap, proxy, Remote } from 'comlink';
import { Workbox } from 'workbox-window';
import { TIMEOUTS } from '../config/constants';

export type AliciaState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface StateTransition {
  from: AliciaState;
  to: AliciaState;
  event: string;
  timestamp: number;
}

interface WorkerHandlers {
  onStateChange: (state: AliciaState) => void;
  onError: (error: Error) => void;
}

interface Context {
  recoverTo?: AliciaState;
  event?: string;
  [key: string]: unknown;
}

export class AliciaStateManager {
  private static instance: AliciaStateManager;
  private currentState: AliciaState = 'idle';
  private history: StateTransition[] = [];
  private retries = 0;
  private workbox: Workbox | null = null;
  private workers: Record<'stt' | 'tts', Remote<WorkerHandlers> | null> = {
    stt: null,
    tts: null,
  };

  private readonly validTransitions: Record<AliciaState, AliciaState[]> = {
    idle: ['listening'],
    listening: ['processing', 'idle', 'error'],
    processing: ['speaking', 'idle', 'error'],
    speaking: ['idle', 'error'],
    error: ['idle', 'listening'],
  };

  private constructor() {
    this.initServiceWorker();
  }

  public static getInstance(): AliciaStateManager {
    return this.instance || (this.instance = new AliciaStateManager());
  }

  private async initServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      this.workbox = new Workbox('/sw.js');
      await this.workbox.register();
    }
  }

  public async connectWorker(type: 'stt' | 'tts', worker: Worker): Promise<void> {
    const proxyWorker = wrap<WorkerHandlers>(worker);
    this.workers[type] = proxyWorker;

    const handlers = {
      onStateChange: (s: AliciaState) => this.transition(s, { source: `${type}-worker` }),
      onError: (e: Error) => this.transition('error', { source: type, error: e }),
    };

    for (const [eventName, handler] of Object.entries(handlers) as [keyof typeof handlers, Function][]) {
      await (proxyWorker as any)[eventName]?.(proxy(handler));
    }
  }

  public async transition(to: AliciaState, ctx: Context = {}): Promise<boolean> {
    if (!this.validTransitions[this.currentState].includes(to)) {
      this.emit('transition-error', { from: this.currentState, to, context: ctx });
      return false;
    }

    const t: StateTransition = {
      from: this.currentState,
      to,
      event: ctx.event || 'manual',
      timestamp: Date.now(),
    };

    // Mantener solamente las últimas HISTORY_LIMIT transiciones
    this.history = [...this.history.slice(-TIMEOUTS.HISTORY_LIMIT + 1), t];
    this.currentState = to;

    this.emit('statechange', { detail: t, context: ctx });
    this.handleEntry(t, ctx);

    return true;
  }

  private handleEntry(t: StateTransition, ctx: Context): void {
    if (t.to === 'listening') {
      this.schedule('listening', TIMEOUTS.STT_LISTENING_MS, 'idle', { ...ctx, noSpeech: true });
    }
    if (t.to === 'processing') {
      this.schedule('processing', TIMEOUTS.STT_PROCESSING_MS, 'error', { ...ctx, timeout: true });
    }
    if (t.to === 'error') {
      this.retry(ctx);
    }
  }

  private schedule(state: AliciaState, delayMs: number, onExpire: AliciaState, ctx: Context): void {
    setTimeout(() => {
      if (this.currentState === state) this.transition(onExpire, ctx);
    }, delayMs);
  }

  private retry(ctx: Context): void {
    const { RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS, MAX_RETRIES } = TIMEOUTS;
    const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** this.retries, RETRY_MAX_DELAY_MS);

    if (this.retries < MAX_RETRIES) {
      this.retries++;
      setTimeout(() => {
        this.transition(ctx.recoverTo || 'idle', { ...ctx, isRetry: true });
      }, delay);
    } else {
      this.retries = 0;
      this.transition('idle', { ...ctx, final: true });
    }
  }

  private emit(type: string, payload: object): void {
    document.dispatchEvent(
      new CustomEvent(`alicia:${type}`, {
        bubbles: true,
        detail: { ...payload, timestamp: Date.now() },
      })
    );

    Object.values(this.workers).forEach(w => w?.onStateChange(this.currentState));
  }

  public get state(): AliciaState {
    return this.currentState;
  }

  public get historyLog(): StateTransition[] {
    return [...this.history];
  }
}

export const stateManager = AliciaStateManager.getInstance();

