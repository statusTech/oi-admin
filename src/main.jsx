import React from 'react';
import ReactDOM from 'react-dom/client';
import moment from 'moment';
import 'moment/locale/pt-br';

import './index.css';
import Router from './router';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

moment.locale('pt-br');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={200}>
      <Router />
      <Toaster />
    </TooltipProvider>
  </React.StrictMode>
);
