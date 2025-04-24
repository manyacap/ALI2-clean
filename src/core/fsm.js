export class AliciaFSM {
  // ... Constructor y estados previos

  setupEventListeners() {
    window.addEventListener("voice-toggle", () => {
      if (this.currentState === this.states.IDLE) {
        this.transitionTo(this.states.LISTENING);
      }
    });

    window.addEventListener("alicia-statechange", (e) => {
      const uiUpdateEvent = new CustomEvent("update-ui", {
        detail: { state: e.detail.state },
      });
      window.dispatchEvent(uiUpdateEvent);
    });
  }
}
