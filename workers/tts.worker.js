const synth = window.speechSynthesis;

self.onmessage = async (e) => {
  if (e.data.text) {
    const utterance = new SpeechSynthesisUtterance(e.data.text);
    utterance.voice = await getVoice(e.data.lang);
    synth.speak(utterance);
    
    utterance.onend = () => self.postMessage('end');
    utterance.onerror = (err) => self.postMessage({ error: err });
  }
};

async function getVoice(lang = 'es-ES') {
  return new Promise(resolve => {
    const checkVoices = () => {
      const voices = synth.getVoices();
      if (voices.length) {
        const voice = voices.find(v => v.lang === lang) || voices[0];
        resolve(voice);
      } else {
        setTimeout(checkVoices, 100);
      }
    };
    checkVoices();
  });
}
