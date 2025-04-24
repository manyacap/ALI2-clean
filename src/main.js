// src/main.js

// Registra tu componente web
import './components/ChatBubble';

// (Opcional) Arranca el service worker
// import { Workbox } from 'workbox-window';
// if ('serviceWorker' in navigator) new Workbox('/sw.js').register();

// Inserta el <chat-bubble> en el body
const bubble = document.createElement('chat-bubble');
document.body.appendChild(bubble);

// (Opcional) inicia el primer estado
import { stateManager } from './core/stateManager';
stateManager.transition('idle');
