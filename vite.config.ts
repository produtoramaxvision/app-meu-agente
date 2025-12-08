import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";
  
  // Configuração dinâmica baseada no ambiente
  // Headers base para CORS (sempre aplicados)
  const baseHeaders = {
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Cross-Origin-Opener-Policy': 'unsafe-none',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  };

  // Headers de segurança adicionais apenas para produção
  // NOTA: X-Frame-Options: DENY bloqueia iframes, incluindo o Simple Browser do VS Code
  const securityHeaders = isProduction ? {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  } : {
    // Em desenvolvimento, permitir iframe (necessário para VS Code Simple Browser)
    'X-Content-Type-Options': 'nosniff',
  };

  const serverConfig = {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    cors: true,
    headers: {
      ...baseHeaders,
      ...securityHeaders,
    }
  };

  // Configuração específica para desenvolvimento
  if (isDevelopment) {
    serverConfig.hmr = {
      host: "localhost",
      port: 8080,
      clientPort: process.env.VITE_HMR_CLIENT_PORT ? parseInt(process.env.VITE_HMR_CLIENT_PORT) : undefined
    };
    serverConfig.allowedHosts = ["localhost", "127.0.0.1", "app.meuagente.api.br"];
  }

  // Configuração específica para produção
  if (isProduction) {
    serverConfig.hmr = {
      host: "app.meuagente.api.br",
      port: 8080
    };
    serverConfig.allowedHosts = ["app.meuagente.api.br"];
  }

  return {
    server: serverConfig,
    plugins: [
      react(), 
      isDevelopment && componentTagger(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png', 'meuagente_logo.webp'],
        manifest: {
          name: 'Meu Agente - Sua agência de Inteligência Artificial de Bolso',
          short_name: 'Meu Agente',
          description: 'Meu Agente - Sua agência de Inteligência Artificial de Bolso',
          theme_color: '#000000',
          background_color: '#0d0d0d',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 horas
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                }
              }
            }
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//]
        },
        devOptions: {
          enabled: false, // Desabilitado em dev para não interferir
          type: 'module'
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Configurações de build otimizadas
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: isDevelopment,
      // ✅ OTIMIZAÇÃO: Aumentar limite para reduzir warnings desnecessários
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // ✅ OTIMIZAÇÃO: Adicionar inlineDynamicImports para false (já é default)
          // e configurar nomes de chunks para melhor cache
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: {
            // React core (react + react-dom + react-router)
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // Supabase
            'supabase': ['@supabase/supabase-js'],
            
            // TanStack Query (separado para melhor cache)
            'tanstack': ['@tanstack/react-query', '@tanstack/react-query-persist-client'],
            
            // UI Components (Radix UI + Shadcn)
            'ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-popover',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-label',
              '@radix-ui/react-switch',
              '@radix-ui/react-slot'
            ],
            
            // Charts (apenas quando Reports for carregado)
            'charts': ['recharts'],
            
            // Date utilities (usado em várias páginas)
            'date-utils': ['date-fns', 'date-fns-tz'],
            
            // Icons (usado em toda aplicação)
            'icons': ['lucide-react']
          }
        }
      }
    },
    // Configuração de preview para produção
    preview: {
      host: "0.0.0.0",
      port: 8080,
      cors: true,
      headers: {
        // Headers de Segurança HTTP para produção
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '0',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      }
    }
  };
});