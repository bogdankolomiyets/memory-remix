import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Твои стили, если нужны
import { StrictMode } from 'react'
const MOUNT_ID = 'memory-remix';

// Функция инициализации
const initPlayer = () => {
  // Если контейнера нет, мы не падаем с ошибкой, а просто логируем это.
  // Это полезно при отладке в Webflow.
  const container = document.getElementById(MOUNT_ID);

  if (!container) {
    console.warn(`[Memory Remix] Container #${MOUNT_ID} not found. Waiting for DOM...`);
    return false;
  }

  if (container) {
    // Очищаем, если там был какой-то мусор от Webflow
    container.innerHTML = '';

    const debugMode = container.getAttribute('data-debug') === 'true';
    const samples = {
      kick: container.getAttribute('data-kick-url'),
      snare: container.getAttribute('data-snare-url'),
      hihat: container.getAttribute('data-hihat-url'),
    };

    ReactDOM.createRoot(container).render(
      <StrictMode>
        <App debugMode={debugMode} samples={samples} />
      </StrictMode>,
    )
    console.log(`[Memory Remix] Widget mounted successfully on #${MOUNT_ID}`);
    return true;
  }
}

// Пытаемся запуститься сразу
const mounted = initPlayer();

// Если сразу найти тег не удалось, ждем пока DOM загрузится
if (!mounted) {
  document.addEventListener('DOMContentLoaded', initPlayer);
}
