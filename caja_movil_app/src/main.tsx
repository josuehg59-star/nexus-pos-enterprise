import './polyfills';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startAutoBackup, autoRecoverIfEmpty } from './store/backup'

// Recupera el catálogo desde el Servidor Maestro si la base en el celular está vacía, y activa sincronización continua en vivo
autoRecoverIfEmpty().then(restored => { 
  if (restored) {
    console.log('Catálogo maestro recuperado exitosamente.');
  }
}).finally(() => {
  startAutoBackup();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
