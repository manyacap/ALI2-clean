export default function initSTT(onResult, onError) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SR();
  recognition.lang = 'es-ES';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (e) =>
    onResult(e.results[0][0].transcript);
  recognition.onerror = (e) => onError(e.error);
  return recognition;
}
