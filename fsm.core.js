// fsm.js - Finite State Machine para Alicia IA v7.2.0

export const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking'
};

const VALID_TRANSITIONS = {
  [STATES.IDLE]: [STATES.LISTENING],
  [STATES.LISTENING]: [STATES.PROCESSING, STATES.IDLE],
  [STATES.PROCESSING]: [STATES.SPEAKING, STATES.IDLE],
  [STATES.SPEAKING]: [STATES.IDLE]
};

class FSM {
  constructor() {
    this.currentState = STATES.IDLE;
    this.isPaused = false;
    this.previousState = null;
  }

  async init() {
    console.log('[FSM] Inicializada en estado:', this.currentState);
    this._dispatchStateEvent(null, this.currentState);
    return Promise.resolve();
  }

  getState() {
    return this.currentState;
  }

  async transitionTo(newState) {
    if (this.isPaused && newState !== STATES.IDLE) {
      console.warn('[FSM] Sistema pausado, solo se permite transición a IDLE');
      return false;
    }

    if (newState === this.currentState) {
      console.warn(`[FSM] Ya en estado: ${newState}`);
      return false;
    }

    if (!this._isValidTransition(this.currentState, newState)) {
      console.error(`[FSM] Transición inválida: ${this.currentState} → ${newState}`);
      return false;
    }

    console.log(`[FSM] Transición: ${this.currentState} → ${newState}`);
    const previousState = this.currentState;
    this.currentState = newState;
    this._dispatchStateEvent(previousState, newState);
    return true;
  }

  _isValidTransition(fromState, toState) {
    return VALID_TRANSITIONS[fromState]?.includes(toState) || false;
  }

  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.previousState = this.currentState;
      console.log(`[FSM] Pausada en estado: ${this.currentState}`);
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      console.log(`[FSM] Reanudada en estado: ${this.currentState}`);
    }
  }

  _dispatchStateEvent(from, to) {
    document.dispatchEvent(new CustomEvent('fsm-state-change', {
      detail: { from, to, timestamp: new Date().toISOString() }
    }));
    document.dispatchEvent(new CustomEvent(`fsm-state-${to}`, {
      detail: { from, to, timestamp: new Date().toISOString() }
    }));
  }
}

const fsm = new FSM();
export default fsm;
