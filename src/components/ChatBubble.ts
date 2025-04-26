// src/components/ChatBubble.ts

// 1) Definimos el tipo de rol
type Role = 'user' | 'assistant';

// 2) Interfaz para las props
interface ChatBubbleProps {
  role: Role;
  message: string;
}

// 3) Componente funcional
export default function ChatBubble({ role, message }: ChatBubbleProps) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = message;
  return bubble;
}
