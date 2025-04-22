/**
 * fsm.js - Finite State Machine para Alicia IA v7.2.0
 */

// Estados definidos
export const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking'
};

// Transiciones válidas
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

  /**
   * Inicializa la máquina de estados
   */
  async init() {
    console.log('[FSM] Inicializada en estado:', this.currentState);
    this._dispatchStateEvent(null, this.currentState);
    return Promise.resolve();
  }

  /**
   * Obtiene el estado actual
   */
  getState() {
    return this.currentState;
  }

  /**
   * Realiza una transición a un nuevo estado
   */
  async transitionTo(newState) {
    if (this.isPaused && newState !== STATES.IDLE) {
      console.warn('[FSM] Sistema pausado, solo se permite transición a IDLE');
      return false;
    }

    // Evitar transición al mismo estado
    if (newState === this.currentState) {
      console.warn(`[FSM] Ya en estado: ${newState}`);
      return false;
    }

    // Validar transición
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

  /**
   * Verifica si una transición es válida
   */
  _isValidTransition(fromState, toState) {
    return VALID_TRANSITIONS[fromState]?.includes(toState) || false;
  }

  /**
   * Pausa la FSM (solo permitirá transiciones a IDLE)
   */
  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.previousState = this.currentState;
      console.log(`[FSM] Pausada en estado: ${this.currentState}`);
    }
  }

  /**
   * Reanuda la FSM
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      console.log(`[FSM] Reanudada en estado: ${this.currentState}`);
    }
  }

  /**
   * Dispatches custom events for state changes
   */
  _dispatchStateEvent(from, to) {
    // Evento general de cambio de estado
    document.dispatchEvent(new CustomEvent('fsm-state-change', {
      detail: { from, to, timestamp: new Date().toISOString() }
    }));
    
    // Evento específico para el nuevo estado
    document.dispatchEvent(new CustomEvent(`fsm-state-${to}`, {
      detail: { from, to, timestamp: new Date().toISOString() }
    }));
  }
}

const fsm = new FSM();
export default fsm;
export { STATES };

