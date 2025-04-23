class VoiceButton extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
      <button part="button">
        <svg part="icon">...</svg>
      </button>
    `;
    this._handleClick = this._handleClick.bind(this);
  }

  connectedCallback() {
    this.querySelector('button').addEventListener('click', this._handleClick);
  }

  _handleClick() {
    this.dispatchEvent(new CustomEvent('voice-toggle', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('voice-button', VoiceButton);
