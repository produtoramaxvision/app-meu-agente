// Exemplo de como usar o EvolutionContactsList no Agente SDR

import { EvolutionContactsList } from '@/components/sdr/EvolutionContactsList';
import { EvolutionContact } from '@/types/sdr';

export function AgenteCRMTab() {
  const handleContactClick = (contact: EvolutionContact) => {
    console.log('Contato clicado:', contact);
    // TODO: Abrir modal com detalhes do contato ou iniciar chat
  };

  return (
    <div className="space-y-6">
      <EvolutionContactsList
        instanceId="uuid-da-instancia-no-supabase"  // UUID para cache local
        instanceName="nome-da-instancia-evolution"  // Nome na Evolution API
        evolutionApiUrl="https://sua-evolution-api.com"
        evolutionApiKey="sua-api-key"
        cacheTtlMinutes={60} // 1 hora (padrão) - balance entre freshness e API load
        onContactClick={handleContactClick}
      />
    </div>
  );
}

// =============================================================================
// CONFIGURAÇÕES RECOMENDADAS DE TTL POR CASO DE USO
// =============================================================================

/**
 * TTL 60 minutos / 1 hora (PADRÃO RECOMENDADO):
 * - Ideal para: CRM geral, vendas, atendimento
 * - Delay máximo: 60 minutos
 * - API calls/hora: 1-2
 * - Impacto: Excelente balance entre freshness e carga na API
 * - Auto-refresh: Sim (ao expirar + no login)
 * - Refresh manual: Botão disponível
 * 
 * Uso:
 * <EvolutionContactsList cacheTtlMinutes={60} />
 * 
 * IMPORTANTE: Se usuário ficar 24h ausente, o cache expira e ao retornar
 * o sistema automaticamente busca dados frescos da Evolution API.
 */

/**
 * TTL 30 minutos (VENDAS MAIS ÁGEIS):
 * - Ideal para: Vendas ativas, leads quentes, atendimento rápido
 * - Delay máximo: 30 minutos
 * - API calls/hora: 2
 * - Impacto: Dados mais frescos, leve aumento nas chamadas API
 * 
 * Uso:
 * <EvolutionContactsList cacheTtlMinutes={30} />
 */

/**
 * TTL 120 minutos / 2 horas (ANALYTICS):
 * - Ideal para: Dashboards, relatórios, análises
 * - Delay máximo: 2 horas
 * - API calls/hora: 0.5
 * - Impacto: Máxima eficiência, dados podem estar mais desatualizados
 * 
 * Uso:
 * <EvolutionContactsList cacheTtlMinutes={120} />
 */

// =============================================================================
// RECURSOS AVANÇADOS DO HOOK
// =============================================================================

import { useEvolutionContacts } from '@/hooks/useEvolutionContacts';

export function ExemploAvancado() {
  const {
    contacts,
    loading,
    refreshing,
    cacheValid,
    lastSyncedAt,
    secondsSinceSync,
    refresh,
    invalidateCache,
    updateContact,
  } = useEvolutionContacts({
    instanceId: 'uuid',
    evolutionApiUrl: 'https://...',
    evolutionApiKey: 'key',
    cacheTtlMinutes: 60, // 1 hora (padrão)
    autoRefresh: true, // Auto-refresh quando cache expirar (é o padrão)
    refreshOnMount: true, // Refresh ao montar componente (ex: login) (é o padrão)
    onlyContacts: false, // true = apenas contatos (sem grupos)
  });

  // Exemplo 1: Refresh manual (botão)
  const handleRefreshClick = () => {
    refresh(true); // force=true ignora cache e busca da API
  };

  // Exemplo 2: Invalidar cache ao enviar mensagem
  const handleSendMessage = async (contactId: string) => {
    // ... enviar mensagem ...
    
    // Invalida cache para forçar atualização
    await invalidateCache();
  };

  // Exemplo 3: Atualizar dados CRM do contato
  const handleMarkAsFavorite = async (contactId: string) => {
    await updateContact(contactId, {
      crm_favorite: true,
      crm_tags: ['vip', 'cliente-premium'],
      crm_lead_score: 100,
    });
  };

  // Exemplo 4: Atualizar status do lead
  const handleUpdateLeadStatus = async (contactId: string, status: 'ganho') => {
    await updateContact(contactId, {
      crm_lead_status: status,
      crm_last_interaction_at: new Date().toISOString(),
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span>Cache válido: {cacheValid ? '✅' : '❌'}</span>
        <span>Última sync: {formatTime(lastSyncedAt)}</span>
        <span>Há {secondsSinceSync}s</span>
        
        <button onClick={handleRefreshClick} disabled={refreshing}>
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <ul>
        {contacts.map((contact) => (
          <li key={contact.id}>
            {contact.push_name} - {contact.remote_jid}
            {contact.crm_favorite && ' ⭐'}
            {contact.crm_lead_status && ` [${contact.crm_lead_status}]`}
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// ESTRATÉGIAS PARA REDUZIR AINDA MAIS O DELAY
// =============================================================================

/**
 * ESTRATÉGIA 1: Invalidar cache ao enviar mensagem
 * 
 * Quando você envia uma mensagem, o contato pode ter atualizado nome/foto.
 * Invalide o cache para forçar atualização na próxima visualização.
 */
const handleSendMessage = async (contactJid: string) => {
  // Envia mensagem
  await evolutionAPI.sendMessage(contactJid, 'Olá!');
  
  // Invalida cache para forçar refresh
  await invalidateCache();
};

/**
 * ESTRATÉGIA 2: Webhook em tempo real (OPCIONAL)
 * 
 * Configure webhook na Evolution para receber eventos CONTACTS_UPSERT.
 * Crie uma Edge Function no Supabase para processar webhooks.
 */
// supabase/functions/evolution-webhook/index.ts
// (já mostrado anteriormente na explicação de webhooks)

/**
 * ESTRATÉGIA 3: Cache por contato individual
 * 
 * Ao invés de invalidar TODOS os contatos, invalide apenas o que mudou.
 */
const invalidateSpecificContact = async (remoteJid: string) => {
  await supabase
    .from('evolution_contacts_cache')
    .update({ last_synced_at: new Date(0).toISOString() }) // Força expiração
    .eq('remote_jid', remoteJid);
};

/**
 * ESTRATÉGIA 4: Prefetch ao abrir modal de mensagem
 * 
 * Antes de mostrar os contatos, já busca em background.
 */
const prefetchContacts = async () => {
  refresh(false); // Respeita cache se válido
};

// No componente:
useEffect(() => {
  if (modalOpen) {
    prefetchContacts();
  }
}, [modalOpen]);

/**
 * ESTRATÉGIA 5: Combinar cache curto + webhook
 * 
 * Use TTL de 2min COMO FALLBACK, mas atualize via webhook quando disponível.
 * Assim você tem: real-time (webhook) + fallback confiável (polling).
 */
