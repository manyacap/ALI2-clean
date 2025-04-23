
export const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking'
};

const VALID = {
  idle: ['listening'],
  listening: ['processing', 'idle'],
  processing: ['speaking', 'idle'],
  speaking: ['idle']
};

class FSM {
  constructor() {
    this.state = STATES.IDLE;
  }
  init() {
    console.debug('[FSM] init:', this.state);
  }
  async transitionTo(next) {
    if (VALID[this.state].includes(next)) {
      this.state = next;
      console.debug('[FSM] to:', next);
      return true;
    }
    return false;
  }
}

export default new FSM();
