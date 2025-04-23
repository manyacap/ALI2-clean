// stt.js
export default function initSTT(onResult, onError) {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;
  const rec = new SpeechRecognition();
  rec.lang = 'es-ES';
  rec.interimResults = false;
  rec.continuous = false;

  rec.onresult = e => onResult(e.results[0][0].transcript);
  rec.onerror  = e => onError(e.error);
  rec.onend    = () => {
    // opcional: podrías reiniciar aquí si lo necesitas
  };

  return rec;
}
