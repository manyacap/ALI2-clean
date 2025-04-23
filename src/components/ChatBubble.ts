import { stateManager } from '../core/stateManager';

export class ChatBubble extends HTMLElement {
  private shadow: ShadowRoot;
  private lottiePlayer!: HTMLElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
    this.setupListeners();
  }

  private render(): void {
    this.shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          --size: 60px;
          --color-primary: #2563eb;
          --color-error: #dc2626;
        }
        
        .bubble {
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          transition: transform 0.2s;
          display: grid;
          place-items: center;
        }
        
        .bubble:active {
          transform: scale(0.95);
        }
        
        .bubble.error {
          background: var(--color-error);
        }
      </style>
      
      <div class="bubble">
        <slot name="icon"></slot>
      </div>
    `;
  }

  private setupListeners(): void {
    this.addEventListener('click', this.handleToggle);
    
    document.addEventListener('alicia:statechange', (event) => {
      const { detail } = event as CustomEvent<{ to: string }>;
      this.updateState(detail.to);
    });
  }

  private updateState(state: string): void {
    const bubble = this.shadow.querySelector('.bubble')!;
    bubble.classList.toggle('error', state === 'error');
    
    if (state === 'processing') {
      this.startLoader();
    } else {
      this.stopLoader();
    }
  }

  private startLoader(): void {
    if (!this.lottiePlayer) {
      this.lottiePlayer = document.createElement('lottie-player');
      this.lottiePlayer.setAttribute('src', '/animations/loading.json');
      this.lottiePlayer.setAttribute('speed', '1.5');
      this.shadow.appendChild(this.lottiePlayer);
    }
    this.lottiePlayer.play();
  }

  private stopLoader(): void {
    this.lottiePlayer?.stop();
  }

  private handleToggle(): void {
    const newState = stateManager.state === 'listening' ? 'idle' : 'listening';
    stateManager.transition(newState, { source: 'bubble-click' });
  }
}

customElements.define('chat-bubble', ChatBubble);
