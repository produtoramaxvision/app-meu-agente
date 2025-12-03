import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook para monitorar mudanças em tempo real nos registros financeiros
 * usando Supabase Realtime.
 * 
 * Monitora eventos INSERT, UPDATE e DELETE na tabela financeiro_registros para:
 * - Sincronizar novos registros criados via WhatsApp/n8n
 * - Alertar quando uma conta vence
 * - Sincronizar dados entre múltiplas abas/dispositivos
 * - Invalidar queries do React Query automaticamente
 * 
 * @param userPhone - Telefone do usuário para filtrar os registros
 */
export const useRealtimeFinancialAlerts = (userPhone: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userPhone) {
      console.log('⚠️ useRealtimeFinancialAlerts: userPhone não fornecido');
      return;
    }

    console.log('💰 useRealtimeFinancialAlerts: Iniciando para:', userPhone);

    /**
     * Helper para invalidar todas as queries relacionadas a dados financeiros
     * IMPORTANTE: As queryKeys devem corresponder exatamente às usadas nos hooks:
     * - useFinancialRecords: ['financial-records-all', phone]
     * - useAlertsData: ['alerts']
     * - etc.
     */
    const invalidateFinancialQueries = () => {
      // Query principal do useFinancialRecords (hook consolidado)
      queryClient.invalidateQueries({ queryKey: ['financial-records-all', userPhone] });
      // Outras queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['financial-records'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-bills'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data', userPhone] });
    };

    // Configurar canal de Realtime para alertas financeiros
    // ✅ Escutar INSERT e UPDATE com filtro por phone
    const channel: RealtimeChannel = supabase
      .channel(`financial-alerts:${userPhone}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // INSERT com filtro
          schema: 'public',
          table: 'financeiro_registros',
          filter: `phone=eq.${userPhone}`
        },
        (payload) => {
          console.log('💰 INSERT financeiro detectado:', payload);
          
          const newRecord = payload.new as { 
            id: number;
            status: string;
            descricao: string;
            valor: number;
            tipo: 'entrada' | 'saida';
            categoria: string;
          };

          // Invalidar queries para atualizar UI automaticamente
          invalidateFinancialQueries();

          // Notificar quando um novo registro é criado (via WhatsApp/n8n)
          if (newRecord) {
            console.log('✅ Novo registro financeiro criado:', newRecord);
            const tipoLabel = newRecord.tipo === 'entrada' ? 'Receita' : 'Despesa';
            toast.success(`${tipoLabel} Registrada!`, {
              description: `${newRecord.descricao || newRecord.categoria} - R$ ${Number(newRecord.valor).toFixed(2)}`,
              duration: 5000
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // UPDATE com filtro
          schema: 'public',
          table: 'financeiro_registros',
          filter: `phone=eq.${userPhone}`
        },
        (payload) => {
          console.log('💰 UPDATE financeiro detectado:', payload);
          
          const newRecord = payload.new as { 
            id: number;
            status: string;
            descricao: string;
            valor: number;
            tipo: 'entrada' | 'saida';
            categoria: string;
          };
          const oldRecord = payload.old as { status?: string; id?: number };

          // Invalidar queries para atualizar UI automaticamente
          invalidateFinancialQueries();
          
          // Alertas específicos para eventos UPDATE
          if (oldRecord && newRecord) {
            // Alerta crítico: Conta venceu
            if (oldRecord.status !== 'vencido' && newRecord.status === 'vencido') {
              console.log('🚨 ALERTA: Conta vencida!', newRecord);
              
              toast.error('Conta Vencida!', {
                description: `${newRecord.descricao} - R$ ${Number(newRecord.valor).toFixed(2)}`,
                duration: 10000,
                action: {
                  label: 'Ver Detalhes',
                  onClick: () => {
                    window.location.href = '/contas';
                  }
                }
              });
            }
            
            // Alerta positivo: Conta foi paga
            if (oldRecord.status === 'pendente' && newRecord.status === 'pago') {
              console.log('✅ Conta paga:', newRecord);
              
              if (newRecord.tipo === 'saida') {
                toast.success('Pagamento Registrado!', {
                  description: `${newRecord.descricao} - R$ ${Number(newRecord.valor).toFixed(2)}`,
                  duration: 5000
                });
              }
            }
            
            // Alerta informativo: Conta recebida
            if (oldRecord.status === 'pendente' && newRecord.status === 'recebido') {
              console.log('💵 Receita recebida:', newRecord);
              
              toast.success('Receita Recebida!', {
                description: `${newRecord.descricao} - R$ ${Number(newRecord.valor).toFixed(2)}`,
                duration: 5000
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE', // ✅ DELETE SEM FILTRO (limitação do Supabase Realtime)
          schema: 'public',
          table: 'financeiro_registros'
          // NOTA: Não é possível filtrar DELETE events no Supabase Realtime
        },
        (payload) => {
          console.log('🗑️ DELETE financeiro detectado:', payload);
          
          const oldRecord = payload.old as { id?: number; phone?: string };
          
          // Verificar se o registro deletado pertence ao usuário atual
          // NOTA: Em DELETE, o old record pode ter apenas o ID se replica identity não for FULL
          if (oldRecord?.phone === userPhone || !oldRecord?.phone) {
            console.log('🗑️ Registro financeiro deletado (usuário atual):', oldRecord);
            // Invalidar queries para atualizar UI automaticamente
            invalidateFinancialQueries();
            
            toast.info('Registro Removido', {
              description: 'Um registro financeiro foi excluído',
              duration: 3000
            });
          }
        }
      )
      .on('system', {}, (status) => {
        console.log('📡 Status Realtime (Financial):', status);
      })
      .subscribe((status) => {
        console.log('🔌 Canal de alertas financeiros:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao canal de alertas financeiros em tempo real');
        } else if (status === 'CHANNEL_ERROR') {
          // ❌ NÃO mostrar toast de erro ao usuário (pode ser erro transitório)
          // Apenas logar para debug
          console.error('❌ Erro no canal de alertas financeiros (não crítico)');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏰ Timeout no canal de alertas financeiros');
        } else if (status === 'CLOSED') {
          console.log('🔒 Canal de alertas financeiros fechado');
        }
      });

    // Cleanup ao desmontar
    return () => {
      console.log('🔌 Desconectando canal de alertas financeiros');
      supabase.removeChannel(channel);
    };
  }, [userPhone, queryClient]);
};

