// src/main.js

// 1) Importa todo lo primero
import "./components/ChatBubble";
// import { Workbox } from 'workbox-window';   // <-- comentado temporalmente
import { stateManager } from "./core/stateManager";

// 2) (Comentado para evitar el error MIME)
// if ('serviceWorker' in navigator) {
//   const wb = new Workbox('/sw.js');
//   wb.register();
// }

// 3) Añade el chat-bubble al body
const bubble = document.createElement("chat-bubble");
document.body.appendChild(bubble);

// 4) Inicia el estado inicial
stateManager.transition("idle");
