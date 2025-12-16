import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from "./App.tsx";
import "./index.css";
import { PWARegister } from "./components/PWARegister";

// Configuração global do React Query para otimização
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados "frescos"
      gcTime: 10 * 60 * 1000, // 10 minutos - garbage collection time (anteriormente cacheTime)
      refetchOnWindowFocus: false, // ❌ CRÍTICO: Evita refetch desnecessário
      refetchOnMount: false, // ❌ CRÍTICO: Usa cache quando possível
      refetchOnReconnect: true, // ✅ Refetch quando reconectar
      retry: (failureCount, error: unknown) => {
        // Não tentar novamente para erros 404 ou 403
        const errorWithStatus = error as { status?: number };
        if (errorWithStatus?.status === 404 || errorWithStatus?.status === 403) return false;
        // Máximo 2 tentativas para outros erros
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
    },
    mutations: {
      retry: 1, // Apenas 1 tentativa para mutations
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <PWARegister />
    <App />
    {/* DevTools apenas em desenvolvimento */}
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
