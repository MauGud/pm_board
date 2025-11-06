import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suprimir errores de extensiones del navegador que no afectan la funcionalidad
// Este debe ejecutarse ANTES de que React se monte para capturar todos los errores
const suppressBrowserExtensionErrors = (event) => {
  try {
    const errorMessage = event.reason?.message || 
                        event.reason?.toString() || 
                        event.message || 
                        String(event.reason || event.error || event || '');
    
    const errorString = errorMessage.toLowerCase();
    
    if (
      errorString.includes('message channel closed') ||
      errorString.includes('listener indicated an asynchronous response') ||
      errorString.includes('asynchronous response by returning true') ||
      errorString.includes('channel closed before a response')
    ) {
      // Este error viene de extensiones del navegador, no de nuestro código
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.log('[Suprimido] Error de extensión del navegador:', errorMessage);
      return true;
    }
  } catch (e) {
    // Si algo falla al procesar el error, ignorarlo
  }
  return false;
};

// Capturar promesas rechazadas sin manejar
window.addEventListener('unhandledrejection', suppressBrowserExtensionErrors, true);

// Capturar errores síncronos
window.addEventListener('error', suppressBrowserExtensionErrors, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)