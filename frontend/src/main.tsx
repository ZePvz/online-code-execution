import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpcClient, queryClient } from "./utils/client";
import { trpc } from './utils/trpc.ts';

createRoot(document.getElementById('root')!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <StrictMode>
        <App />
      </StrictMode>
    </QueryClientProvider>
  </trpc.Provider>
)
