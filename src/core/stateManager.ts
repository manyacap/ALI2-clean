// src/core/stateManager.ts
import { wrap, proxy, Remote } from 'comlink';
import { Workbox } from 'workbox-window';

export type AliciaState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
export interface StateTransition { from: AliciaState; to: AliciaState; event: string; timestamp: number; }

type Context = Record<string, any>;
interface WorkerHandlers { onStateChange: (s: AliciaState) => void; onError: (e: Error) => void; }

export class AliciaStateManager {
  private static _instance: AliciaStateManager;
  private currentState: AliciaState = 'idle';
  private history: StateTransition[] = [];
  private retries = 0;
  private workbox: Workbox | null = null;
  private workers: Record<'stt'|'tts', Remote<WorkerHandlers> | null> = { stt:null, tts:null };

  private valid: Record<AliciaState, AliciaState[]> = {
    idle: ['listening'], listening: ['processing','idle','error'], processing: ['speaking','idle','error'], speaking: ['idle','error'], error: ['idle','listening']
  };

  private constructor() { this.initSW(); }
  public static getInstance() { return this._instance || (this._instance = new AliciaStateManager()); }

  private async initSW() {
    if ('serviceWorker' in navigator) {
      this.workbox = new Workbox('/sw.js'); await this.workbox.register();
    }
  }

  public async connectWorker(type:'stt'|'tts', worker: Worker) {
    const pw = wrap<WorkerHandlers>(worker);
    this.workers[type] = pw;
    const map = { onStateChange: (s:AliciaState)=>this.transition(s,{source:`${type}-worker`}), onError:(e:Error)=>this.transition('error',{source:type,error:e}) };
    for (const [evt, fn] of Object.entries(map) as Array<[keyof typeof map,Function]>) {
      await (pw as any)[evt]?.(proxy(fn as any));
    }
  }

  public async transition(to:AliciaState, ctx:Context={}) {
    if (!this.valid[this.currentState].includes(to)) {
      this.emit('transition-error',{from:this.currentState,to,ctx}); return false;
    }
    const t:StateTransition={from:this.currentState,to,event:ctx.event?.toString()||'manual',timestamp:Date.now()};
    this.history=[...this.history.slice(-9),t]; this.currentState=to;
    this.emit('statechange',t);
    this.handleEntry(t,ctx); return true;
  }

  private handleEntry(t:StateTransition, ctx:Context){
    if(t.to==='listening') this.schedule('listening',10000,'idle',{...ctx,noSpeech:true});
    if(t.to==='processing') this.schedule('processing',8000,'error',{...ctx,timeout:true});
    if(t.to==='error') this.retry(ctx);
  }

  private schedule(state:AliciaState,ms:number,onExpire:AliciaState,ctx:Context){ setTimeout(()=>{ if(this.currentState===state) this.transition(onExpire,ctx);}, ms); }
  private retry(ctx:Context){ const max=3,delay=Math.min(1000*2**this.retries,30000);
    if(this.retries<max){ setTimeout(()=>{this.retries++;this.transition(ctx.recoverTo||'idle',{...ctx,isRetry:true});},delay);} else {this.retries=0;this.transition('idle',{...ctx,final:true});}}

  private emit(type:string, detail:object){
    document.dispatchEvent(new CustomEvent(`alicia:${type}`,{bubbles:true,detail:{...detail,timestamp:Date.now()}}));
    Object.values(this.workers).forEach(w=>w?.onStateChange?.(this.currentState));
  }

  public get state(){return this.currentState;}  public get historyLog(){return[...this.history];}
}
export const stateManager = AliciaStateManager.getInstance();

