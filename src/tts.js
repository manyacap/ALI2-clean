// tts.js
export default function initTTS() {
  return {
    async speak(text) {
      return new Promise(resolve => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        // intenta elegir la voz Neural2-C
        const voz = speechSynthesis.getVoices()
          .find(v => v.lang === 'es-ES' && v.name.includes('Neural2-C'));
        if (voz) utter.voice = voz;
        utter.onend = resolve;
        speechSynthesis.speak(utter);
      });
    }
  };
}
