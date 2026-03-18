import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for "TypeError: Cannot set property fetch of #<Window> which has only a getter"
// This happens when libraries like node-fetch or formdata-polyfill try to overwrite window.fetch
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  try {
    (window as any).fetch = originalFetch;
  } catch (e) {
    // window.fetch is read-only (getter only). 
    // We create a global proxy to intercept and ignore assignments to 'fetch'.
    const globalProxy = new Proxy(window, {
      get(target, prop) {
        const value = (target as any)[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, prop, value) {
        if (prop === 'fetch') return true; // Ignore assignment to fetch
        (target as any)[prop] = value;
        return true;
      }
    });
    (window as any).global = globalProxy;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
