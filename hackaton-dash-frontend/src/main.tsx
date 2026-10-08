import React from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from './app/providers';
import { AppRouter } from './app/router';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('No existe el elemento root');
createRoot(root).render(
  <React.StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </React.StrictMode>,
);
