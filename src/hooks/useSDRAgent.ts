import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { 
  EvolutionInstance, 
  SDRAgentConfig, 
  AgenteConfigJSON,
  ConnectionStatus,
} from '@/types/sdr';

// =============================================================================
// Hook: useSDRAgent
// Gerencia múltiplas conexões WhatsApp via Evolution API e configuração do agente SDR
// Atualizado: 2025-12-13 - Suporte a múltiplas instâncias
// =============================================================================

const SELECTED_INSTANCE_KEY = 'sdr_selected_instance_id';

export function useSDRAgent() {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  const phone = cliente?.phone || '';
  const planId = cliente?.plan_id || 'free';
  
  // Estado para instância selecionada (persistido no localStorage)
  const [selectedInstanceId, setSelectedInstanceIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SELECTED_INSTANCE_KEY);
    }
    return null;
  });
  
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [autoRefreshedInstanceId, setAutoRefreshedInstanceId] = useState<string | null>(null);

  const [lastPolledInstanceId, setLastPolledInstanceId] = useState<string | null>(null);

  // Estados por-instância para loading (evita que todos os cards mostrem loading ao mesmo tempo)
  const [refreshingInstanceId, setRefreshingInstanceId] = useState<string | null>(null);
  const [disconnectingInstanceId, setDisconnectingInstanceId] = useState<string | null>(null);
  const [deletingInstanceId, setDeletingInstanceId] = useState<string | null>(null);
  const [updatingNameInstanceId, setUpdatingNameInstanceId] = useState<string | null>(null);

  // Persistir seleção no localStorage
  const setSelectedInstanceId = useCallback((instanceId: string | null) => {
    setSelectedInstanceIdState(instanceId);
    if (instanceId) {
      localStorage.setItem(SELECTED_INSTANCE_KEY, instanceId);
    } else {
      localStorage.removeItem(SELECTED_INSTANCE_KEY);
    }
  }, []);

  // =====================================================
  // Query: Buscar TODAS as instâncias Evolution do usuário
  // =====================================================
  const { 
    data: instances = [], 
    isLoading: isLoadingInstances,
    refetch: refetchInstances,
  } = useQuery({
    queryKey: ['evolution-instances', phone],
    queryFn: async (): Promise<EvolutionInstance[]> => {
      if (!phone) return [];

      const { data, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching evolution instances:', error);
        throw error;
      }

      return (data || []) as unknown as EvolutionInstance[];
    },
    enabled: !!phone,
    staleTime: 1000 * 5,
    refetchOnWindowFocus: true,
  });

  // Instância selecionada atual
  const selectedInstance = useMemo(() => {
    if (!instances.length) return null;
    
    // Se há um ID selecionado válido, usar
    if (selectedInstanceId) {
      const found = instances.find(i => i.id === selectedInstanceId);
      if (found) return found;
    }
    
    // Fallback: primeira instância
    return instances[0];
  }, [instances, selectedInstanceId]);

  const hasAnyConnectingInstance = useMemo(() => {
    return instances.some((i) => i.connection_status === 'connecting');
  }, [instances]);

  // Auto-selecionar primeira instância se não há seleção
  useEffect(() => {
    if (instances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(instances[0].id);
    }
    // Se a instância selecionada foi deletada, selecionar a primeira
    if (selectedInstanceId && instances.length > 0 && !instances.find(i => i.id === selectedInstanceId)) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, selectedInstanceId, setSelectedInstanceId]);

  // =====================================================
  // Query: Buscar limite de instâncias do plano
  // =====================================================
  const { data: maxInstances = 0 } = useQuery({
    queryKey: ['max-instances', phone],
    queryFn: async (): Promise<number> => {
      if (!phone) return 0;

      const { data, error } = await supabase.rpc('get_max_instances_for_user', {
        p_phone: phone,
      });

      if (error) {
        console.error('Error fetching max instances:', error);
        // Fallback baseado no plano local
        if (planId === 'business') return 2;
        if (planId === 'premium') return 5;
        return 0;
      }

      return data || 0;
    },
    enabled: !!phone,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // =====================================================
  // Query: Buscar configuração SDR da instância selecionada
  // =====================================================
  const { 
    data: config, 
    isLoading: isLoadingConfig,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['sdr-config', phone, selectedInstance?.id],
    queryFn: async (): Promise<SDRAgentConfig | null> => {
      if (!phone || !selectedInstance?.id) return null;

      const { data, error } = await supabase
        .from('sdr_agent_config')
        .select('*')
        .eq('phone', phone)
        .eq('instance_id', selectedInstance.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching SDR config:', error);
        throw error;
      }

      return data as unknown as SDRAgentConfig | null;
    },
    enabled: !!phone && !!selectedInstance?.id,
    staleTime: 1000 * 60,
  });

  // =====================================================
  // Mutation: Criar nova instância Evolution
  // =====================================================
  const createInstanceMutation = useMutation({
    mutationFn: async (displayName?: string) => {
      const { data, error } = await supabase.functions.invoke('create-evolution-instance', {
        body: { display_name: displayName },
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
      queryClient.invalidateQueries({ queryKey: ['evolution-instances', phone] });
      // Selecionar a nova instância automaticamente
      if (data.instance?.id) {
        setSelectedInstanceId(data.instance.id);
      }
      setPollingEnabled(true);
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
    mutationFn: async (instanceId?: string) => {
      const targetId = instanceId || selectedInstance?.id;
      
      const { data, error } = await supabase.functions.invoke('connect-evolution-instance', {
        body: { instance_id: targetId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to refresh connection');
      }

      if (!data.success) {
        if (data.needsCreate) {
          return { needsCreate: true };
        }
        throw new Error(data.error || 'Failed to refresh connection');
      }

      return data;
    },
    onMutate: async (instanceId?: string) => {
      const targetId = instanceId || selectedInstance?.id || null;
      setRefreshingInstanceId(targetId);
    },
    onSuccess: (data) => {
      if (data.needsCreate) {
        console.log('Instance needs to be created, auto-creating...');
        queryClient.invalidateQueries({ queryKey: ['evolution-instances', phone] });
        createInstanceMutation.mutate(undefined);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['evolution-instances', phone] });
      
      if (data.instance?.connection_status === 'connected') {
        toast.success('WhatsApp conectado com sucesso!');
        configureWebhookMutation.mutate(data.instance.id);
      }
    },
    onError: (error: Error) => {
      if (error.message === 'NO_INSTANCE') {
        console.log('No instance found, auto-creating...');
        queryClient.invalidateQueries({ queryKey: ['evolution-instances', phone] });
        createInstanceMutation.mutate(undefined);
        return;
      }
      toast.error(`Erro ao verificar conexão: ${error.message}`);
    },
    onSettled: (_data, _error, instanceId) => {
      const targetId = instanceId || selectedInstance?.id || null;
      setRefreshingInstanceId((prev) => (prev === targetId ? null : prev));
    },
  });

  // =====================================================
  // Função estável para refresh (evita deps instáveis)
  // =====================================================
  const handleRefreshConnection = useCallback((instanceId?: string) => {
    refreshConnectionMutation.mutate(instanceId);
  }, [refreshConnectionMutation]);

  // =====================================================
  // Polling Ativo
  // =====================================================
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (pollingEnabled && !refreshConnectionMutation.isPending) {
      intervalId = setInterval(() => {
        const connecting = instances.filter((i) => i.connection_status === 'connecting');
        if (!connecting.length) return;

        // Round-robin simples para não ficar preso em uma só instância
        let next = connecting[0];
        if (lastPolledInstanceId) {
          const idx = connecting.findIndex((i) => i.id === lastPolledInstanceId);
          if (idx >= 0) {
            next = connecting[(idx + 1) % connecting.length];
          }
        }

        // Evita disparar para a mesma instância que já está em loading
        if (refreshingInstanceId && refreshingInstanceId === next.id) return;

        console.log('Polling connection status for:', next.id);
        setLastPolledInstanceId(next.id);
        handleRefreshConnection(next.id);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingEnabled, refreshConnectionMutation.isPending, instances, lastPolledInstanceId, refreshingInstanceId, handleRefreshConnection]);

  // =====================================================
  // Mutation: Configurar Webhook
  // =====================================================
  const configureWebhookMutation = useMutation({
    mutationFn: async (instanceId?: string) => {
      const { data, error } = await supabase.functions.invoke('configure-evolution-webhook', {
        body: { instance_id: instanceId || selectedInstance?.id },
      });

      if (error) {
        throw new Error(error.message || 'Failed to configure webhook');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to configure webhook');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Conexão configurada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao configurar conexão: ${error.message}`);
    },
  });

  // =====================================================
  // Mutation: Desconectar instância
  // =====================================================
  const disconnectInstanceMutation = useMutation({
    mutationFn: async (instanceId?: string) => {
      const { data, error } = await supabase.functions.invoke('disconnect-evolution-instance', {
        body: { instance_id: instanceId || selectedInstance?.id },
      });

      if (error) {
        throw new Error(error.message || 'Failed to disconnect instance');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to disconnect instance');
      }

      return data;
    },
    onMutate: async (instanceId?: string) => {
      const targetId = instanceId || selectedInstance?.id || null;
      setDisconnectingInstanceId(targetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances', phone] });
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone] });
      toast.success('WhatsApp desconectado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desconectar: ${error.message}`);
    },
    onSettled: (_data, _error, instanceId) => {
      const targetId = instanceId || selectedInstance?.id || null;
      setDisconnectingInstanceId((prev) => (prev === targetId ? null : prev));
    },
  });

  // =====================================================
  // Mutation: Deletar instância completamente
  // =====================================================
  const deleteInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const { data, error } = await supabase.functions.invoke('disconnect-evolution-instance', {
        body: { instance_id: instanceId, delete: true },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete instance');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete instance');
      }

      return { instanceId };
    },
    onMutate: async (instanceId: string) => {
      setDeletingInstanceId(instanceId);
    },
    onSuccess: ({ instanceId }) => {
      // Se deletou a instância selecionada, selecionar outra
      if (selectedInstanceId === instanceId) {
        const remaining = instances.filter(i => i.id !== instanceId);
        setSelectedInstanceId(remaining[0]?.id || null);
      }
      queryClient.invalidateQueries({ queryKey: ['evolution-instances', phone] });
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone] });
      toast.success('Instância removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover instância: ${error.message}`);
    },
    onSettled: () => {
      setDeletingInstanceId(null);
    },
  });

  // =====================================================
  // Mutation: Atualizar display_name
  // =====================================================
  const updateDisplayNameMutation = useMutation({
    mutationFn: async ({ instanceId, displayName }: { instanceId: string; displayName: string }) => {
      const { data, error } = await supabase.rpc('update_instance_display_name', {
        p_instance_id: instanceId,
        p_display_name: displayName,
      });

      if (error) throw error;
      return { instanceId, displayName };
    },
    onMutate: async ({ instanceId }: { instanceId: string; displayName: string }) => {
      setUpdatingNameInstanceId(instanceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances', phone] });
      toast.success('Nome atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar nome: ${error.message}`);
    },
    onSettled: () => {
      setUpdatingNameInstanceId(null);
    },
  });

  // =====================================================
  // Mutation: Salvar configuração SDR
  // =====================================================
  const saveConfigMutation = useMutation({
    mutationFn: async (configJson: AgenteConfigJSON) => {
      if (!selectedInstance?.id) {
        throw new Error('Nenhuma instância selecionada');
      }

      const { data: existingConfig } = await supabase
        .from('sdr_agent_config')
        .select('id')
        .eq('phone', phone)
        .eq('instance_id', selectedInstance.id)
        .maybeSingle();

      if (existingConfig) {
        const { error } = await supabase
          .from('sdr_agent_config')
          .update({
            config_json: configJson as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('phone', phone)
          .eq('instance_id', selectedInstance.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sdr_agent_config')
          .insert({
            phone,
            instance_id: selectedInstance.id,
            config_json: configJson as unknown as Json,
            is_active: true,
          });

        if (error) throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone, selectedInstance?.id] });
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
    mutationFn: async ({ section, data }: { section: string; data: Record<string, unknown> }) => {
      const { data: result, error } = await supabase.rpc('update_sdr_config_section', {
        p_phone: phone,
        p_section: section,
        p_data: data as unknown as Json,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone, selectedInstance?.id] });
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
      const { data: result, error } = await supabase.rpc('update_sdr_ia_config', {
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
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone, selectedInstance?.id] });
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
      const { data, error } = await supabase.functions.invoke('configure-evolution-webhook', {
        body: { 
          instance_id: selectedInstance?.id,
          enabled: isActive,
        },
      });

      if (error) {
        throw new Error(error.message || 'Falha ao atualizar notificações');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao atualizar notificações');
      }

      const effectiveStatus = typeof data.enabled === 'boolean' ? data.enabled : isActive;
      return { success: true, isActive: effectiveStatus };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['sdr-config', phone, selectedInstance?.id], (prev: SDRAgentConfig | null) => {
        if (!prev) return prev;
        return { ...prev, is_active: data.isActive } as SDRAgentConfig;
      });
      queryClient.invalidateQueries({ queryKey: ['sdr-config', phone, selectedInstance?.id] });
      toast.success(
        data.isActive
          ? 'Agente ativado e notificações habilitadas!'
          : 'Agente pausado e notificações desativadas'
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar notificações: ${error.message}`);
    },
  });

  // =====================================================
  // Realtime: Escutar atualizações de TODAS as instâncias
  // =====================================================
  useEffect(() => {
    if (!phone) return;

    const channel = supabase
      .channel(`evolution-instances-${phone}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evolution_instances',
          filter: `phone=eq.${phone}`,
        },
        (payload) => {
          console.log('Instance change:', payload);
          queryClient.invalidateQueries({ queryKey: ['evolution-instances', phone] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [phone, queryClient]);

  // =====================================================
  // Efeito: Iniciar polling quando houver QUALQUER instância connecting
  // =====================================================
  useEffect(() => {
    if (hasAnyConnectingInstance) {
      setPollingEnabled(true);
    } else {
      setPollingEnabled(false);
      setAutoRefreshedInstanceId(null);
    }
  }, [hasAnyConnectingInstance]);

  // =====================================================
  // Efeito: Auto-refresh quando instância não está conectada
  // =====================================================
  useEffect(() => {
    if (!phone || !selectedInstance) return;
    if (selectedInstance.connection_status === 'connected') return;
    if (refreshConnectionMutation.isPending) return;
    if (autoRefreshedInstanceId === selectedInstance.id) return;

    setAutoRefreshedInstanceId(selectedInstance.id);
    handleRefreshConnection(selectedInstance.id);
  }, [phone, selectedInstance, refreshConnectionMutation.isPending, autoRefreshedInstanceId, handleRefreshConnection]);

  // =====================================================
  // Helpers
  // =====================================================
  const createInstance = useCallback((displayName?: string) => {
    createInstanceMutation.mutate(displayName);
  }, [createInstanceMutation]);

  const refreshConnection = useCallback((instanceId?: string) => {
    refreshConnectionMutation.mutate(instanceId);
  }, [refreshConnectionMutation]);

  const saveConfig = useCallback((configJson: AgenteConfigJSON) => {
    saveConfigMutation.mutate(configJson);
  }, [saveConfigMutation]);

  const updateSection = useCallback((section: string, data: Record<string, unknown>) => {
    updateConfigSectionMutation.mutate({ section, data });
  }, [updateConfigSectionMutation]);

  const updateIAConfig = useCallback((iaConfig: Parameters<typeof updateIAConfigMutation.mutate>[0]) => {
    updateIAConfigMutation.mutate(iaConfig);
  }, [updateIAConfigMutation]);

  const toggleActive = useCallback((isActive: boolean) => {
    toggleActiveMutation.mutate(isActive);
  }, [toggleActiveMutation]);

  const configureWebhook = useCallback((instanceId?: string) => {
    configureWebhookMutation.mutate(instanceId);
  }, [configureWebhookMutation]);

  const disconnectInstance = useCallback((instanceId?: string) => {
    disconnectInstanceMutation.mutate(instanceId);
  }, [disconnectInstanceMutation]);

  const deleteInstance = useCallback((instanceId: string) => {
    deleteInstanceMutation.mutate(instanceId);
  }, [deleteInstanceMutation]);

  const updateDisplayName = useCallback((instanceId: string, displayName: string) => {
    updateDisplayNameMutation.mutate({ instanceId, displayName });
  }, [updateDisplayNameMutation]);

  const selectInstance = useCallback((instanceId: string) => {
    setSelectedInstanceId(instanceId);
  }, [setSelectedInstanceId]);

  // Verificar se pode criar mais instâncias
  const canCreateInstance = instances.length < maxInstances;

  // =====================================================
  // Return
  // =====================================================
  return {
    // === Multi-instance ===
    instances,
    selectedInstance,
    selectedInstanceId,
    selectInstance,
    maxInstances,
    canCreateInstance,
    instanceCount: instances.length,
    
    // === Backward compatibility (usa instância selecionada) ===
    instance: selectedInstance,
    config,
    configJson: config?.config_json || null,
    
    // === Loading states ===
    isLoading: isLoadingInstances || isLoadingConfig,
    isLoadingInstance: isLoadingInstances,
    isLoadingInstances,
    isLoadingConfig,
    isCreating: createInstanceMutation.isPending,
    isRefreshing: refreshConnectionMutation.isPending,
    isDisconnecting: disconnectInstanceMutation.isPending,
    isDeleting: deleteInstanceMutation.isPending,
    isSaving: saveConfigMutation.isPending,
    isUpdatingName: updateDisplayNameMutation.isPending,

    // === Loading per-instance ===
    refreshingInstanceId,
    disconnectingInstanceId,
    deletingInstanceId,
    updatingNameInstanceId,
    
    // === Status (da instância selecionada) ===
    connectionStatus: (selectedInstance?.connection_status || 'disconnected') as ConnectionStatus,
    isConnected: selectedInstance?.connection_status === 'connected',
    isConnecting: selectedInstance?.connection_status === 'connecting',
    hasInstance: instances.length > 0,
    isAgentActive: config?.is_active ?? false,
    
    // === QR Code (da instância selecionada) ===
    qrCode: selectedInstance?.qr_code || null,
    pairingCode: selectedInstance?.pairing_code || null,
    
    // === Actions ===
    createInstance,
    refreshConnection,
    refetchInstance: refetchInstances,
    refetchInstances,
    refetchConfig,
    saveConfig,
    updateSection,
    updateIAConfig,
    toggleActive,
    configureWebhook,
    disconnectInstance,
    deleteInstance,
    updateDisplayName,
    
    // === Polling control ===
    pollingEnabled,
    setPollingEnabled,
  };
}
