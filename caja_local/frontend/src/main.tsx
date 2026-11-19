import './polyfills';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startAutoBackup, autoRecoverIfEmpty } from './store/backup'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Recupera datos desde el último respaldo si la base está vacía, y activa respaldo automático
autoRecoverIfEmpty().then(restored => { if (restored) window.location.reload(); }).finally(() => startAutoBackup());
