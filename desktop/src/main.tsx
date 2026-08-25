import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/app/pilotErrorBootstrap';
import { App } from './App';

if (typeof window !== 'undefined') {
  localStorage.clear();
  window.location.hash = '#/login';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
