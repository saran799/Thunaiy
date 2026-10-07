import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/cousine/400.css';
import '@fontsource/cousine/700.css';
import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-tamil/400.css';
import '@fontsource/noto-sans-telugu/400.css';
import '@fontsource/noto-sans-kannada/400.css';
import './styles/index.css';
import App from './App';
import AppProviders from './app/AppProviders';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
