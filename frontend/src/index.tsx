import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css'; // Load global styles like Tailwind or Carbon

// Register your custom Web Component <file-flip>
// import { FileFlip } from './components/FileFlip';
// customElements.define('file-flip', FileFlip);

// Mount React app
const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
