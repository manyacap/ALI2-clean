const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: 80%;
      margin: 8px;
      padding: 12px;
      border-radius: 18px;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } }
  </style>
  <div part="content"><slot></slot></div>
`;

class ChatBubble extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  set type(value) {
    this.setAttribute('type', value);
    this.shadowRoot.host.style.backgroundColor = 
      value === 'user' ? 'var(--user-bubble)' : 'var(--ai-bubble)';
  }
}

customElements.define('chat-bubble', ChatBubble);
