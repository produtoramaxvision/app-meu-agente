import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EvolutionInstance } from '@/types/sdr';
import { useAuth } from '@/contexts/AuthContext';

export function useEvolutionInstances() {
  const { cliente } = useAuth();
  const phone = cliente?.phone || '';

  return useQuery({
    queryKey: ['evolution-instances', phone],
    queryFn: async (): Promise<EvolutionInstance[]> => {
      if (!phone) return [];

      const { data, error } = await supabase
        .from('evolution_instances')
        .select('id, instance_name, display_name, connection_status')
        .eq('phone', phone);

      if (error) {
        console.error('Error fetching evolution instances:', error);
        throw error;
      }

      return (data || []) as unknown as EvolutionInstance[];
    },
    enabled: !!phone,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

