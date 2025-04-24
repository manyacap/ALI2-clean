import { wrap, proxy, Remote } from 'comlink';
import { Workbox } from 'workbox-window';

// Definición de estados y transiciones
export type AliciaState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
export interface StateTransition {
  from: AliciaState;
  to: AliciaState;
  event: string;
  timestamp: number;
}

type Context = Record<string, any>;

interface WorkerHandlers {
  onStateChange: (state: AliciaState) => void;
  onError: (error: Error) => void;
}

export class AliciaStateManager {
  private static _instance: AliciaStateManager;

  private state: AliciaState = 'idle';
  private history: StateTransition[] = [];
  private retries = 0;
  private workbox: Workbox | null = null;
  private workers: Record<'stt' | 'tts', Remote<WorkerHandlers> | null> = { stt: null, tts: null };

  private validTransitions: Record<AliciaState, AliciaState[]> = {
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
    return this._instance || (this._instance = new AliciaStateManager());
  }

  // Registra el Service Worker si está disponible
  private async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      this.workbox = new Workbox('/sw.js');
      await this.workbox.register();
    }
  }

  // Conecta un worker (STT o TTS) y sus handlers
  public async connectWorker(type: 'stt' | 'tts', worker: Worker): Promise<void> {
    const proxyWorker = wrap<WorkerHandlers>(worker);
    this.workers[type] = proxyWorker;

    // Iterable de handlers con su evento correspondiente
    const handlers = {
      onStateChange: (s: AliciaState) => this.transition(s, { source: `${type}-worker` }),
      onError: (e: Error) => this.transition('error', { source: type, error: e }),
    };

    for (const [evt, handler] of Object.entries(handlers) as Array<['onStateChange' | 'onError', Function]>) {
      await (proxyWorker as any)[evt]?.(proxy(handler as any));
    }
  }

  // Realiza una transición, validando y registrando
  public async transition(to: AliciaState, context: Context = {}): Promise<boolean> {
    if (!this.validTransitions[this.state].includes(to)) {
      return this.emit('transition-error', { from: this.state, to, context });
    }

    const t: StateTransition = {
      from: this.state,
      to,
      event: context.event?.toString() || 'manual',
      timestamp: Date.now(),
    };

    this.history = [...this.history.slice(-9), t];
    this.state = to;
    this.emit('statechange', { detail: t, context });
    this.onStateEntry(t, context);
    return true;
  }

  // Manejo de entradas de estado: timeouts y reintentos
  private onStateEntry(t: StateTransition, ctx: Context) {
    switch (t.to) {
      case 'listening':
        this.setTimeout('listening', 10000, 'idle', { ...ctx, noSpeech: true });
        break;
      case 'processing':
        this.setTimeout('processing', 8000, 'error', { ...ctx, timeout: true });
        break;
      case 'error':
        this.handleErrorState(ctx);
        break;
    }
  }

  // Timeout genérico para estados
  private setTimeout(
    state: AliciaState,
    ms: number,
    onExpire: AliciaState,
    ctx: Context
  ) {
    setTimeout(() => {
      if (this.state === state) this.transition(onExpire, ctx);
    }, ms);
  }

  // Lógica de backoff y reintentos en error
  private handleErrorState(ctx: Context) {
    const maxRetries = 3;
    const delay = Math.min(1000 * 2 ** this.retries, 30000);

    if (this.retries < maxRetries) {
      setTimeout(() => {
        this.retries++;
        this.transition(ctx.recoverTo || 'idle', { ...ctx, isRetry: true });
      }, delay);
    } else {
      this.retries = 0;
      this.transition('idle', { ...ctx, final: true });
    }
  }

  // Emite eventos al DOM y notifica a los workers
  private emit(type: string, data: CustomEventInit) {
    document.dispatchEvent(new CustomEvent(`alicia:${type}`, {
      bubbles: true,
      detail: data.detail || data,
    }));

    // Notify workers estado actual
    Object.values(this.workers).forEach((w) => w?.onStateChange?.(this.state));
    return false;
  }

  // Getters de estado e historial
  public get current(): AliciaState {
    return this.state;
  }
  public get transitionsHistory(): StateTransition[] {
    return [...this.history];
  }
}

// Exportamos instancia única
export const stateManager = AliciaStateManager.getInstance();
