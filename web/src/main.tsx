import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import 'leaflet/dist/leaflet.css';
import './index.css';

import App from './App';
import { FiltersProvider } from './lib/useFilters';
import { registerServiceWorker } from './lib/push';
import { trpc } from './trpc';

// Register the service worker (handles Web Push + PWA install/offline shell).
void registerServiceWorker();

const Root = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/trpc' })],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <FiltersProvider>
            <App />
          </FiltersProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
