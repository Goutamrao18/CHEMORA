import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import './glass.css';

// Stale-deploy recovery: detect new bundle chunk hashes and cleanly reload once
function showUpdateToast() {
  try {
    const existing = document.getElementById('chemora-update-toast');
    if (existing) return;
    const toast = document.createElement('div');
    toast.id = 'chemora-update-toast';
    toast.className =
      'fixed bottom-5 right-5 z-[99999] px-4 py-2.5 rounded-xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none transition-all duration-300';
    toast.textContent = 'Updating to the latest version...';
    document.body.appendChild(toast);
  } catch {}
}

function handleStaleDeployReload() {
  const RELOAD_KEY = 'chemora_stale_reload';
  const hasReloaded = sessionStorage.getItem(RELOAD_KEY);
  if (!hasReloaded) {
    sessionStorage.setItem(RELOAD_KEY, '1');
    showUpdateToast();
    setTimeout(() => {
      window.location.reload();
    }, 350);
  }
}

// 1. Listen for Vite's preloadError event
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  handleStaleDeployReload();
});

// 2. Global error listener for failed dynamic module chunk imports
window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed')
  ) {
    handleStaleDeployReload();
  }
});

// Reset reload guard on clean app load
window.addEventListener('load', () => {
  setTimeout(() => {
    sessionStorage.removeItem('chemora_stale_reload');
  }, 4000);
});

// Register service worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary tabName="CHEMORA Platform">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
