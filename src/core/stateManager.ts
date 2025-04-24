// src/core/stateManager.ts
import { wrap, proxy, Remote } from 'comlink';
import { Workbox } from 'workbox-window';

export type AliciaState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
export interface StateTransition {
  from: AliciaState;
  to: AliciaState;
  event: string;
  timestamp: number;
}

type Context = Record<string, any>;
interface WorkerHandlers {
  onStateChange: (s: AliciaState) => void;
  onError: (e: Error) => void;
}

export class AliciaStateManager {
  private static instance: AliciaStateManager;
  private currentState: AliciaState = 'idle';
  private history: StateTransition[] = [];
  private retries = 0;
  private workbox: Workbox | null = null;
  private workers: Record<'stt' | 'tts', Remote<WorkerHandlers> | null> = { stt: null, tts: null };

  private transitions: Record<AliciaState, AliciaState[]> = {
    idle: ['listening'],
    listening: ['processing', 'idle', 'error'],
    processing: ['speaking', 'idle', 'error'],
    speaking: ['idle', 'error'],
    error: ['idle', 'listening'],
  };

  private constructor() {
    this.initServiceWorker();
  }

  public static getInstance() {
    return this.instance || (this.instance = new AliciaStateManager());
  }

  private async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      this.workbox = new Workbox('/sw.js');
      await this.workbox.register();
    }
  }

  public async connectWorker(type: 'stt' | 'tts', worker: Worker) {
    const proxyWorker = wrap<WorkerHandlers>(worker);
    this.workers[type] = proxyWorker;
    const handlers = {
      onStateChange: (s: AliciaState) => this.transition(s, { source: `${type}-worker` }),
      onError: (e: Error) => this.transition('error', { source: type, error: e }),
    };
    for (const [event, fn] of Object.entries(handlers) as Array<[keyof WorkerHandlers, Function]>) {
      await (proxyWorker as any)[event]?.(proxy(fn as any));
    }
  }

  public async transition(to: AliciaState, ctx: Context = {}): Promise<boolean> {
    if (!this.transitions[this.currentState].includes(to)) {
      this.emit('transition-error', { from: this.currentState, to, context: ctx });
      return false;
    }
    const transition: StateTransition = {
      from: this.currentState,
      to,
      event: ctx.event?.toString() || 'manual',
      timestamp: Date.now(),
    };
    this.history = [...this.history.slice(-9), transition];
    this.currentState = to;
    this.emit('statechange', transition);
    this.handleEntry(transition, ctx);
    return true;
  }

  private handleEntry(transition: StateTransition, ctx: Context) {
    switch (transition.to) {
      case 'listening':
        this.setTimeout('listening', 10000, 'idle', { ...ctx, noSpeech: true });
        break;
      case 'processing':
        this.setTimeout('processing', 8000, 'error', { ...ctx, timeout: true });
        break;
      case 'error':
        this.retry(ctx);
        break;
    }
  }

  private setTimeout(
    state: AliciaState,
    ms: number,
    onExpire: AliciaState,
    ctx: Context
  ) {
    setTimeout(() => {
      if (this.currentState === state) {
        this.transition(onExpire, ctx);
      }
    }, ms);
  }

  private retry(ctx: Context) {
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

  private emit(eventType: string, payload: object) {
    document.dispatchEvent(
      new CustomEvent(`alicia:${eventType}`, {
        bubbles: true,
        detail: { ...payload, timestamp: Date.now() },
      })
    );
    Object.values(this.workers).forEach(w => w?.onStateChange?.(this.currentState));
  }

  public get state() {
    return this.currentState;
  }

  public get historyLog() {
    return [...this.history];
  }
}

export const stateManager = AliciaStateManager.getInstance();
