export default function initTTS() {
  return {
    speak(text) {
      return new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        u.onend = resolve;
        speechSynthesis.speak(u);
      });
    }
  };
}
