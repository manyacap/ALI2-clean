// src/ui.ts
// Stub de interfaz de usuario para inicializar y manejar eventos

type Role = 'user' | 'ai';

const UI = {
  // Inicializa la UI con tu controlador FSM
  init: (fsm: any): void => {
    console.log('UI initialized with FSM', fsm);
  },

  // Añade una burbuja de chat (usuario o IA)
  addBubble: (role: Role, text: string): void => {
    console.log(`[${role}] ${text}`);
    // Aquí iría la lógica de mostrar en HTML
  },

  // Muestra un mensaje de error en pantalla
  showError: (msg: string): void => {
    console.error('UI Error:', msg);
    // Lógica de mostrar notificación de error
  },

  // Evento para cuando se pulsa el botón de Micrófono
  onMicButton: (callback: () => void): void => {
    const btn = document.getElementById('mic-btn');
    if (btn) btn.addEventListener('click', callback);
  },

  // Evento para cuando se pulsa el botón de Parar
  onStopButton: (callback: () => void): void => {
    const btn = document.getElementById('stop-btn');
    if (btn) btn.addEventListener('click', callback);
  }
};

export default UI;
