/**
 * PWA Service Worker Registration Component
 * 
 * Este componente registra o service worker para PWA usando vite-plugin-pwa.
 * Funciona apenas em produção (desenvolvimento tem devOptions.enabled: false).
 * 
 * Características:
 * - Registro automático do service worker
 * - Atualizações automáticas (autoUpdate)
 * - Notificações silenciosas (não interfere na UX)
 */

import { useEffect } from 'react';
// @ts-expect-error - virtual module from vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWARegister() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registrado:', r);
    },
    onRegisterError(error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    },
    onNeedRefresh() {
      // Auto-update está habilitado, então isso não deve aparecer
      // Mas mantemos o código caso mude para promptForUpdate
      console.log('🔄 Nova versão disponível');
    },
    onOfflineReady() {
      console.log('✅ App pronto para trabalhar offline');
    },
  });

  // Limpar estados quando necessário
  useEffect(() => {
    if (offlineReady) {
      // Pode mostrar uma notificação discreta se quiser
      // Por enquanto, apenas log
    }
    if (needRefresh) {
      // Com autoUpdate, isso não deve acontecer
      // Mas se acontecer, podemos atualizar automaticamente
      updateServiceWorker(true);
    }
  }, [offlineReady, needRefresh, updateServiceWorker]);

  // Este componente não renderiza nada visual
  // Ele apenas registra o service worker em background
  return null;
}


