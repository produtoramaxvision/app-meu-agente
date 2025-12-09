import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { 
  EvolutionInstance, 
  SDRAgentConfig, 
  AgenteConfigJSON,
  ConnectionStatus,
} from '@/types/sdr';

// =============================================================================
// Hook: useSDRAgent
// Gerencia conexão WhatsApp via Evolution API e configuração do agente SDR
// Nota: Tabelas novas usam 'as any' até regenerar tipos do Supabase
// =============================================================================

export function useSDRAgent() {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  const phone = cliente?.phone || '';
  
  const [pollingEnabled, setPollingEnabled] = useState(false);
  // Evita loop de auto-refresh quando instância está desconectada
  const [autoRefreshedInstanceId, setAutoRefreshedInstanceId] = useState<string | null>(null);

  // =====================================================
  // Query: Buscar instância Evolution
  // =====================================================
  const { 
    data: instance, 
    isLoading: isLoadingInstance,
    refetch: refetchInstance,
  } = useQuery({
    queryKey: ['evolution-instance', phone],
    queryFn: async (): Promise<EvolutionInstance | null> => {
      if (!phone) return null;

      const { data, error } = await supabase
        .from('evolution_instances' as any)
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (error) {
        console.error('Error fetching evolution instance:', error);
        throw error;
      }

      return data as unknown as EvolutionInstance | null;
    },
    enabled: !!phone,
    staleTime: 1000 * 5, // 5 segundos (reduzido de 30s para manter dados mais atualizados)
    refetchOnWindowFocus: true, // Refetch ao focar na janela
    refetchInterval: false, // Desabilitamos o polling padrão do React Query pois ele só lê o banco
  });

  // =====================================================
  // Query: Buscar configuração SDR
  // =====================================================
  const { 
    data: config, 
    isLoading: isLoadingConfig,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['sdr-config', phone],
    queryFn: async (): Promise<SDRAgentConfig | null> => {
      if (!phone) return null;

      const { data, error } = await supabase
        .from('sdr_agent_config' as any)
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (error) {
        console.error('Error fetching SDR config:', error);
        throw error;
      }

      return data as unknown as SDRAgentConfig | null;
    },
    enabled: !!phone,
    staleTime: 1000 * 60, // 1 minuto
  });

  // =====================================================
  // Mutation: Criar instância Evolution
  // =====================================================
  const createInstanceMutation = useMutation({
    mutationFn: async (instanceName?: string) => {
      const { data, error } = await supabase.functions.invoke('create-evolution-instance', {
        body: { instance_name: instanceName },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create instance');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create instance');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instance', phone] });
      setPollingEnabled(true); // Iniciar polling após criar
      toast.success('Instância criada! Escaneie o QR Code para conectar.');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar instância: ${error.message}`);
    },
  });

  // =====================================================
  // Mutation: Buscar status de conexão e QR Code
  // =====================================================
  const refreshConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('connect-evolution-instance');

      if (error) {
        throw new Error(error.message || 'Failed to refresh connection');
      }

      if (!data.success) {
        if (data.needsCreate) {
          // Retornar objeto especial para indicar que precisa criar
          return { needsCreate: true };
        }
        throw new Error(data.error || 'Failed to refresh connection');
      }

      return data;
    },
    onSuccess: (data) => {
      // Se precisa criar nova instância, criar automaticamente
      if (data.needsCreate) {
        console.log('Instance needs to be created, auto-creating...');
        queryClient.invalidateQueries({ queryKey: ['evolution-instance', phone] });
        // Criar nova instância automaticamente
        createInstanceMutation.mutate(undefined);
        return;
      }

      // Atualizar cache imediato com a instância retornada (inclui QR / pairing)
      if (data.instance) {
        queryClient.setQueryData(['evolution-instance', phone], data.instance);
      }
      queryClient.invalidateQueries({ queryKey: ['evolution-instance', phone] });
      
      // Parar polling se conectado
      if (data.instance?.connection_status === 'connected') {
        setPollingEnabled(false);
        toast.success('WhatsApp conectado com sucesso!');
        // Forçar configuração do webhook para garantir rota correta (N8N)
        configureWebhookMutation.mutate();
      }
    },
    onError: (error: Error) => {
      if (error.message === 'NO_INSTANCE') {
        // Criar instância automaticamente quando não existe
        console.log('No instance found, auto-creating...');
        queryClient.invalidateQueries({ queryKey: ['evolution-instance', phone] });
        createInstanceMutation.mutate(undefined);
        return;
      }
      toast.error(`Erro ao verificar conexão: ${error.message}`);
    },
  });

  // =====================================================
  // Polling Ativo: Consultar API enquanto estiver conectando
  // Necessário pois o webhook vai para o N8N e não atualiza o banco local
  // =====================================================
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (pollingEnabled && !refreshConnectionMutation.isPending) {
      intervalId = setInterval(() => {
        console.log('Polling connection status...');
        refreshConnectionMutation.mutate();
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingEnabled, refreshConnectionMutation.isPending]);

  // =====================================================
  // Mutation: Configurar/Reconfigurar Webhook
  // =====================================================
  const configureWebhookMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('configure-evolution-webhook');

      if (error) {
        throw new Error(error.message || 'Failed to configure webhook');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to configure webhook');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Conexão configurada com sucesso!');
      console.log('Webhook configured:', data);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao configurar conexão: ${error.message}`);
    },
  });

  // =====================================================
  // Mutation: Desconectar instância Evolution
  // =====================================================
  const disconnectInstanceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('disconnect-evolution-instance');

      if (error) {
        throw new Error(error.message || 'Failed to disconnect instance');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to disconnect instance');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instance', phone] });
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone] });
      toast.success('WhatsApp desconectado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desconectar: ${error.message}`);
    },
  });

  // =====================================================
  // Mutation: Salvar configuração SDR
  // =====================================================
  const saveConfigMutation = useMutation({
    mutationFn: async (configJson: AgenteConfigJSON) => {
      const { data: existingConfig } = await supabase
        .from('sdr_agent_config' as any)
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (existingConfig) {
        // Update
        const { error } = await supabase
          .from('sdr_agent_config' as any)
          .update({
            config_json: configJson as any,
            updated_at: new Date().toISOString(),
          })
          .eq('phone', phone);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('sdr_agent_config' as any)
          .insert({
            phone,
            instance_id: instance?.id,
            config_json: configJson as any,
            is_active: true,
          });

        if (error) throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    },
  });

  // =====================================================
  // Mutation: Atualizar seção específica da config
  // =====================================================
  const updateConfigSectionMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      const { data: result, error } = await (supabase.rpc as any)('update_sdr_config_section', {
        p_phone: phone,
        p_section: section,
        p_data: data,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone] });
      toast.success('Seção atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // =====================================================
  // Mutation: Atualizar configuração de IA
  // =====================================================
  const updateIAConfigMutation = useMutation({
    mutationFn: async (iaConfig: {
      model: string;
      temperature: number;
      top_p: number;
      frequency_penalty: number;
      presence_penalty: number;
      max_tokens: number;
    }) => {
      const { data: result, error } = await (supabase.rpc as any)('update_sdr_ia_config', {
        p_phone: phone,
        p_model: iaConfig.model,
        p_temperature: iaConfig.temperature,
        p_top_p: iaConfig.top_p,
        p_frequency_penalty: iaConfig.frequency_penalty,
        p_presence_penalty: iaConfig.presence_penalty,
        p_max_tokens: iaConfig.max_tokens,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone] });
      toast.success('Configurações de IA atualizadas!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar IA: ${error.message}`);
    },
  });

  // =====================================================
  // Mutation: Toggle ativo/inativo
  // =====================================================
  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const { error } = await supabase
        .from('sdr_agent_config' as any)
        .update({ is_active: isActive })
        .eq('phone', phone);

      if (error) throw error;
      return { success: true, isActive };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone] });
      toast.success(data.isActive ? 'Agente ativado!' : 'Agente pausado');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Derivados para uso em efeitos abaixo
  const hasInstanceValue = !!instance;
  const isConnectedValue = instance?.connection_status === 'connected';

  // =====================================================
  // Realtime: Escutar atualizações da instância
  // =====================================================
  useEffect(() => {
    if (!phone || !instance?.id) return;

    const channel = supabase
      .channel(`evolution-instance-${instance.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evolution_instances',
          filter: `id=eq.${instance.id}`,
        },
        (payload) => {
          console.log('Instance updated:', payload.new);
          queryClient.setQueryData(['evolution-instance', phone], payload.new);
          
          // Parar polling se conectado
          if ((payload.new as any).connection_status === 'connected') {
            setPollingEnabled(false);
            toast.success('WhatsApp conectado!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [phone, instance?.id, queryClient]);

  // =====================================================
  // Efeito: Iniciar polling quando em estado de connecting
  // =====================================================
  useEffect(() => {
    if (instance?.connection_status === 'connecting') {
      setPollingEnabled(true);
    } else if (instance?.connection_status === 'connected') {
      setPollingEnabled(false);
      // Libera futura auto-verificação caso desconecte novamente
      setAutoRefreshedInstanceId(null);
    }
  }, [instance?.connection_status]);

  // =====================================================
  // Efeito: Ao montar/atualizar, se houver instância e não estiver conectada,
  // dispara uma verificação imediata para sincronizar o status com a Evolution API.
  // Evita rodar em paralelo se a mutation já estiver em progresso.
  // =====================================================
  useEffect(() => {
    if (!phone || !hasInstanceValue) return;
    if (isConnectedValue) return;
    if (refreshConnectionMutation.isPending) return;

    // Evita loop: só auto-dispara uma vez por instância enquanto desconectada
    if (autoRefreshedInstanceId === instance?.id) return;

    setAutoRefreshedInstanceId(instance?.id || null);
    refreshConnectionMutation.mutate();
  }, [phone, hasInstanceValue, isConnectedValue, refreshConnectionMutation.isPending, autoRefreshedInstanceId, instance?.id]);

  // =====================================================
  // Helpers
  // =====================================================
  const createInstance = useCallback((name?: string) => {
    createInstanceMutation.mutate(name);
  }, [createInstanceMutation]);

  const refreshConnection = useCallback(() => {
    refreshConnectionMutation.mutate();
  }, [refreshConnectionMutation]);

  const saveConfig = useCallback((configJson: AgenteConfigJSON) => {
    saveConfigMutation.mutate(configJson);
  }, [saveConfigMutation]);

  const updateSection = useCallback((section: string, data: any) => {
    updateConfigSectionMutation.mutate({ section, data });
  }, [updateConfigSectionMutation]);

  const updateIAConfig = useCallback((iaConfig: Parameters<typeof updateIAConfigMutation.mutate>[0]) => {
    updateIAConfigMutation.mutate(iaConfig);
  }, [updateIAConfigMutation]);

  const toggleActive = useCallback((isActive: boolean) => {
    toggleActiveMutation.mutate(isActive);
  }, [toggleActiveMutation]);

  const configureWebhook = useCallback(() => {
    configureWebhookMutation.mutate();
  }, [configureWebhookMutation]);

  const disconnectInstance = useCallback(() => {
    disconnectInstanceMutation.mutate();
  }, [disconnectInstanceMutation]);

  // =====================================================
  // Return
  // =====================================================
  return {
    // Estado
    instance,
    config,
    configJson: config?.config_json || null,
    
    // Loading states
    isLoading: isLoadingInstance || isLoadingConfig,
    isLoadingInstance,
    isLoadingConfig,
    isCreating: createInstanceMutation.isPending,
    isRefreshing: refreshConnectionMutation.isPending,
    isDisconnecting: disconnectInstanceMutation.isPending,
    isSaving: saveConfigMutation.isPending,
    
    // Status
    connectionStatus: (instance?.connection_status || 'disconnected') as ConnectionStatus,
    isConnected: instance?.connection_status === 'connected',
    isConnecting: instance?.connection_status === 'connecting',
    hasInstance: !!instance,
    isAgentActive: config?.is_active ?? false,
    
    // QR Code
    qrCode: instance?.qr_code || null,
    pairingCode: instance?.pairing_code || null,
    
    // Actions
    createInstance,
    refreshConnection,
    refetchInstance,
    refetchConfig,
    saveConfig,
    updateSection,
    updateIAConfig,
    toggleActive,
    configureWebhook,
    disconnectInstance,
    
    // Polling control
    pollingEnabled,
    setPollingEnabled,
  };
}
