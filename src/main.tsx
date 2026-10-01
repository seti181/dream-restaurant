import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/global.css';
import { unlockAudio } from './ui/sound';

// Browsers only allow sound after a tap; every tap makes sure it's switched on.
document.addEventListener('pointerdown', unlockAudio, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
