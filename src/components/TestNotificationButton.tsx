import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, Loader2 } from 'lucide-react';

/**
 * Componente de teste para criar notificações e validar Realtime
 * Remove este componente em produção
 */
export function TestNotificationButton() {
  const { cliente } = useAuth();
  const [creating, setCreating] = useState(false);

  const createTestNotification = async () => {
    if (!cliente?.phone) {
      toast.error('Usuário não autenticado');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          phone: cliente.phone,
          tipo: 'atualizacao',
          titulo: 'Teste de Notificação Realtime',
          mensagem: `Notificação de teste criada em ${new Date().toLocaleTimeString('pt-BR')}`,
          lida: false,
          data: { test: true, timestamp: Date.now() },
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Notificação de teste criada:', data);
      toast.success('Notificação de teste criada!', {
        description: 'Verifique se o toast do Realtime apareceu',
      });
    } catch (error) {
      console.error('❌ Erro ao criar notificação de teste:', error);
      toast.error('Erro ao criar notificação de teste', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setCreating(false);
    }
  };

  if (!cliente?.phone) {
    return null;
  }

  return (
    <Button
      onClick={createTestNotification}
      disabled={creating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {creating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Criando...
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Testar Notificação Realtime
        </>
      )}
    </Button>
  );
}
