/**
 * ui.js - UI Manager para Alicia IA v7.2.0
 */

import fsm, { STATES } from './fsm.js';

class UIManager {
  constructor() {
    this.elements = {
      chatContainer: null,
      bubbleContainer: null,
      mainButton: null,
      avatar: null,
      statusText: null
    };
    this.maxMessages = 20;
    this.messageCount = 0;
  }

  /**
   * Inicializa el UI manager
   */
  async init() {
    try {
      // Cachear elementos DOM
      this.elements.chatContainer = document.getElementById('chat-container');
      this.elements.bubbleContainer = document.getElementById('message-bubbles');
      this.elements.mainButton = document.getElementById('main-button');
      this.elements.avatar = document.getElementById('alicia-avatar');
      this.elements.statusText = document.getElementById('status-text');
      
      // Verificar elementos requeridos
      if (!this.elements.chatContainer || !this.elements.bubbleContainer || !this.elements.mainButton) {
        console.error('[UI] Elementos DOM requeridos no encontrados');
        return false;
      }
      
      // Configurar listeners de estado FSM
      this._setupStateListeners();
      
      // Configurar fallbacks para imágenes
      this._setupImageFallbacks();
      
      console.log('[UI] Inicializado correctamente');
      return true;
    } catch (error) {
      console.error('[UI] Error de inicialización:', error);
      return false;
    }
  }

  /**
   * Configura listeners para cambios de estado FSM
   */
  _setupStateListeners() {
    document.addEventListener('fsm-state-change', (event) => {
      const { to } = event.detail;
      this._updateStateUI(to);
    });
  }

  /**
   * Actualiza UI basado en estado actual
   */
  _updateStateUI(state) {
    // Actualizar botón principal según estado
    if (this.elements.mainButton) {
      // Remover todas las clases de estado
      this.elements.mainButton.classList.remove('state-idle', 'state-listening', 'state-processing', 'state-speaking');
      
      // Añadir clase de estado actual
      this.elements.mainButton.classList.add(`state-${state}`);
      
      // Actualizar texto/icono del botón según estado
      switch (state) {
        case STATES.IDLE:
          this.elements.mainButton.setAttribute('aria-label', 'Iniciar');
          this.elements.mainButton.innerHTML = '<i class="mic-icon">🎤</i>';
          if (this.elements.statusText) this.elements.statusText.textContent = "Lista para ayudar";
          break;
        case STATES.LISTENING:
          this.elements.mainButton.setAttribute('aria-label', 'Escuchando...');
          this.elements.mainButton.innerHTML = '<i class="listening-icon">👂</i>';
          if (this.elements.statusText) this.elements.statusText.textContent = "Escuchando...";
          break;
        case STATES.PROCESSING:
          this.elements.mainButton.setAttribute('aria-label', 'Procesando...');
          this.elements.mainButton.innerHTML = '<i class="processing-icon">⏳</i>';
          if (this.elements.statusText) this.elements.statusText.textContent = "Procesando...";
          break;
        case STATES.SPEAKING:
          this.elements.mainButton.setAttribute('aria-label', 'Hablando...');
          this.elements.mainButton.innerHTML = '<i class="speaking-icon">🔊</i>';
          if (this.elements.statusText) this.elements.statusText.textContent = "Hablando...";
          break;
      }
    }
    
    // Actualizar avatar según estado
    if (this.elements.avatar) {
      this.elements.avatar.dataset.state = state;
    }
    
    // Actualizar clase del body para estilos globales
    document.body.className = `state-${state}`;
  }

  /**
   * Añade una burbuja de mensaje
   */
  addMessageBubble(text, type = 'assistant') {
    if (!text || !this.elements.bubbleContainer) return null;
    
    // Crear contenedor de mensaje
    const messageId = ++this.messageCount;
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${type}`;
    messageContainer.dataset.messageId = messageId;
    
    // Crear burbuja de mensaje
    const messageBubble = document.createElement('div');
    messageBubble.className = `message-bubble ${type}-message`;
    messageBubble.textContent = text;
    
    // Añadir timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Ensamblar y añadir al contenedor
    messageContainer.appendChild(messageBubble);
    messageContainer.appendChild(timestamp);
    this.elements.bubbleContainer.appendChild(messageContainer);
    
    // Limitar número de mensajes
    this._pruneMessages();
    
    // Scroll al final
    this._scrollToBottom();
    
    return messageContainer;
  }

  /**
   * Muestra un mensaje de sistema
   */
  showSystemMessage(text) {
    return this.addMessageBubble(text, 'system');
  }

  /**
   * Muestra mensaje de error
   */
  showError(text) {
    return this.addMessageBubble(text, 'error');
  }

  /**
   * Muestra indicador de escritura
   */
  showTypingIndicator(isVisible) {
    // Remover indicador existente
    const existingIndicator = document.querySelector('.typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    if (!isVisible) return;
    
    // Crear y añadir indicador
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    this.elements.bubbleContainer.appendChild(indicator);
    
    // Scroll para mostrar indicador
    this._scrollToBottom();
  }

  /**
   * Scroll al final del chat
   */
  _scrollToBottom() {
    if (this.elements.chatContainer) {
      this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    }
  }

  /**
   * Elimina mensajes más antiguos si se excede el límite
   */
  _pruneMessages() {
    if (!this.elements.bubbleContainer) return;
    
    const messages = this.elements.bubbleContainer.querySelectorAll('.message-container');
    
    if (messages.length > this.maxMessages) {
      const toRemove = messages.length - this.maxMessages;
      
      for (let i = 0; i < toRemove; i++) {
        messages[i].remove();
      }
    }
  }

  /**
   * Configura fallback para imágenes
   */
  _setupImageFallbacks() {
    // Usar MutationObserver para observar nuevas imágenes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'IMG') {
              this._setupImageFallback(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('img').forEach(img => this._setupImageFallback(img));
            }
          });
        }
      });
    });
    
    // Iniciar observación
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Configurar imágenes existentes
    document.querySelectorAll('img').forEach(img => this._setupImageFallback(img));
  }

  /**
   * Configura fallback para una imagen
   */
  _setupImageFallback(img) {
    // Omitir si ya está configurada
    if (img.dataset.fallbackConfigured) return;
    
    img.dataset.fallbackConfigured = 'true';
    img.dataset.originalSrc = img.src;
    
    img.onerror = function() {
      // Evitar loops
      if (this.src.includes('placeholder.png')) return;
      
      console.log(`[UI] Error en imagen: ${this.src}, usando placeholder`);
      this.src = '/assets/placeholder.png';
    };
  }

  /**
   * Actualiza el menú con ítems de Supabase
   */
  updateMenu(items) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer || !items || items.length === 0) return;
    
    menuContainer.innerHTML = '';
    
    // Crear filtros de categoría
    const categories = [...new Set(items.map(item => item.category))];
    if (categories.length > 0) {
      const filterContainer = document.createElement('div');
      filterContainer.className = 'menu-filters';
      
      // Añadir filtro "Todos"
      const allFilter = document.createElement('button');
      allFilter.className = 'category-filter active';
      allFilter.dataset.category = 'all';
      allFilter.textContent = 'Todos';
      allFilter.addEventListener('click', () => this._filterMenu('all'));
      filterContainer.appendChild(allFilter);
      
      // Añadir filtros de categoría
      categories.forEach(category => {
        const filter = document.createElement('button');
        filter.className = 'category-filter';
        filter.dataset.category = category;
        filter.textContent = category;
        filter.addEventListener('click
