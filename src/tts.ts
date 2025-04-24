// src/tts.ts
export async function speak(text: string): Promise<void> {
  return new Promise(resolve => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.onend = () => resolve();
    speechSynthesis.speak(utterance);
  });
}
