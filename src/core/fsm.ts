// src/core/fsm.ts
export default class FsmController {
  /**
   * Estados posibles de la máquina
   */
  static readonly STATES = {
    IDLE: 'idle',
    PROCESSING: 'processing'
  } as const;

  /**
   * Tiempos en milisegundos para control de timeouts
   */
  static readonly TIMEOUTS = {
    LISTENING: 8000,
    PROCESSING: 10000
  };

  /** Estado interno de la FSM */
  private state: typeof FsmController.STATES[keyof typeof FsmController.STATES];

  constructor() {
    this.state = FsmController.STATES.IDLE;
  }

  /**
   * Stub para invocar IA (reemplazar con tu llamada real a OpenAI)
   * @param text Texto de entrada
   * @returns Respuesta de la IA
   */
  private async processWithAI(text: string): Promise<string> {
    // Ejemplo: aquí harías el fetch o llamada al SDK de OpenAI
    return `IA responde a: "${text}"`;
  }

  /**
   * Maneja eventos y devuelve la respuesta de la IA.
   * Aplica timeout y previene llamadas concurrentes.
   * @param event { type: string; text?: string }
   */
  public async handle(event: { type: string; text?: string }): Promise<string> {
    if (this.state !== FsmController.STATES.IDLE) {
      throw new Error(`FSM ocupada (estado: ${this.state}).`);
    }

    if (event.type === 'user_said') {
      this.state = FsmController.STATES.PROCESSING;
      try {
        const aiPromise = this.processWithAI(event.text || '');
        const timeoutPromise = new Promise<string>(resolve =>
          setTimeout(() => resolve('Error: IA tardó demasiado'), FsmController.TIMEOUTS.PROCESSING)
        );
        const response = await Promise.race([aiPromise, timeoutPromise]);
        return response;
      } finally {
        this.state = FsmController.STATES.IDLE;
      }
    }

    console.warn(`Evento desconocido para FSM: ${event.type}`);
    return '';
  }
}