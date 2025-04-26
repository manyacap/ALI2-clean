declare interface SpeechRecognition {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    start(): void;
    stop(): void;
  }
  declare interface SpeechRecognitionEvent { resultIndex: number; results: any; }
  declare interface SpeechRecognitionErrorEvent { error: string; }
  declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };
  declare var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };