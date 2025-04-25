import { stateManager } from "../core/stateManager.ts";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { position: fixed; bottom: 20px; right: 20px; z-index: 1000; --size: 60px; --color-primary: #2563eb; --color-error: #dc2626; }
    .bubble { width: var(--size); height: var(--size); border-radius: 50%; background: var(--color-primary); cursor: pointer; transition: transform 0.2s; display: grid; place-items: center; }
    .bubble:active { transform: scale(0.95); }
    .bubble.error { background: var(--color-error); }
  </style>
  <div class="bubble"><slot name="icon"></slot></div>
`;

export class ChatBubble extends HTMLElement {
  private shadow = this.attachShadow({ mode: "open" });
  private bubble: HTMLElement;
  private lottiePlayer?: any;

  constructor() {
    super();
    this.shadow.appendChild(template.content.cloneNode(true));
    this.bubble = this.shadow.querySelector(".bubble") as HTMLElement;
    this.setupListeners();
  }

  private setupListeners() {
    this.bubble.addEventListener("click", this.handleToggle);
    document.addEventListener("alicia:statechange", this.handleStateChange);
  }

  private handleStateChange = (evt: Event) => {
    const { to } = (evt as CustomEvent<{ to: string }>).detail;
    this.bubble.classList.toggle("error", to === "error");
    to === "processing" ? this.startLoader() : this.stopLoader();
  };

  private startLoader() {
    if (!this.lottiePlayer) {
      this.lottiePlayer = document.createElement("lottie-player");
      this.lottiePlayer.src = "/animations/loading.json";
      this.lottiePlayer.speed = 1.5;
      this.shadow.appendChild(this.lottiePlayer);
    }
    this.lottiePlayer.play();
  }

  private stopLoader() {
    this.lottiePlayer?.stop();
  }

  private handleToggle = () => {
    const nextState = stateManager.state === "listening" ? "idle" : "listening";
    stateManager.transition(nextState as any, { source: "bubble-click" });
  };
}

customElements.define("chat-bubble", ChatBubble);
