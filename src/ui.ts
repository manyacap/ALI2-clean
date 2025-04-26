// src/ui.ts
import ChatBubble from './components/ChatBubble.js';

/**
 * Rol del emisor del mensaje en la UI.
 */
export type Role = 'user' | 'assistant';

/**
 * Módulo de UI para manejar la interacción del chat.
 */
const UI = {
  /**
   * Añade una burbuja de chat al contenedor.
   * @param role - 'user' o 'assistant'
   * @param text - Texto a mostrar
   */
  addBubble: (role: Role, text: string): void => {
    const container = document.getElementById('chat-container');
    if (!container) {
      console.error('UI.addBubble: no se encontró #chat-container');
      return;
    }
    const bubble = ChatBubble({ role, message: text });
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  /**
   * Limpia el contenido del chat.
   */
  clearChat: (): void => {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
  },

  /**
   * Muestra un indicador de loading mientras la IA responde.
   */
  showLoading: (): void => {
    const container = document.getElementById('chat-container');
    if (!container) return;
    const loader = document.createElement('div');
    loader.id = 'chat-loader';
    loader.className = 'chat-loading';
    loader.textContent = 'Alicia está escribiendo...';
    container.appendChild(loader);
    container.scrollTop = container.scrollHeight;
  },

  /**
   * Elimina el indicador de loading.
   */
  hideLoading: (): void => {
    const loader = document.getElementById('chat-loader');
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
  }
};

export default UI;