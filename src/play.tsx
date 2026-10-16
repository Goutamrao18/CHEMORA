import React from 'react';
import ReactDOM from 'react-dom/client';
import { VirtualLabView } from './components/VirtualLabView';
import './index.css';

export function PlayStandaloneApp() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020816]">
      {/* Dedicated High-Performance 60FPS 3D Virtual Lab View with Unified Exit Button & Controls */}
      <div className="w-full h-full">
        <VirtualLabView
          isStandalone={true}
          onExit={() => {
            window.location.href = '/#home';
          }}
        />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlayStandaloneApp />
  </React.StrictMode>
);
