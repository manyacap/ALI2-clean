// src/core/fsm.js  
export class AliciaFSM {
  constructor() {
    this.states = {
      IDLE: 'idle',
      LISTENING: 'listening',
      PROCESSING: 'processing',
      SPEAKING: 'speaking'
    };
    this.currentState = this.states.IDLE;
    
    // Mobile-Optimized Transitions
    this.transitions = {
      idle: ['listening'],
      listening: ['processing', 'idle'],
      processing: ['speaking', 'idle'],
      speaking: ['idle']
    };
  }

  transitionTo(newState) {
    if (this.transitions[this.currentState].includes(newState)) {
      this.currentState = newState;
      this.emitStateChange();
      return true;
    }
    console.error(`Transición inválida: ${this.currentState} → ${newState}`);
    return false;
  }

  emitStateChange() {
    const event = new CustomEvent('alicia-statechange', {
      detail: { state: this.currentState }
    });
    window.dispatchEvent(event);
  }
}
