// =============================================================================
// TIPOS PARA EVOLUTION API
// =============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface EvolutionInstance {
  id: string;
  phone: string;
  instance_name: string;
  instance_token: string | null;
  connection_status: ConnectionStatus;
  whatsapp_number: string | null;
  qr_code: string | null;
  pairing_code: string | null;
  last_qr_update: string | null;
  created_at: string;
  updated_at: string;
  connected_at: string | null;
  display_name: string | null; // Nome amigável da instância (ex: "WhatsApp 1")
}

// =============================================================================
// TIPOS PARA CONTATOS (EVOLUTION API - PERSISTENTE)
// =============================================================================

export type LeadStatus = 'novo' | 'contatado' | 'qualificado' | 'proposta' | 'negociando' | 'ganho' | 'perdido';
export type SyncSource = 'manual' | 'auto' | 'webhook';

export interface EvolutionContact {
  id: string;
  instance_id: string;
  phone: string;
  
  // Dados do contato (source: Evolution API)
  remote_jid: string;
  push_name: string | null;
  profile_pic_url: string | null;
  is_group: boolean;
  is_saved: boolean;
  
  // Metadata de sincronização
  synced_at: string; // Renomeado de last_synced_at
  sync_source: SyncSource;
  
  // Dados extras do CRM
  crm_notes: string | null;
  crm_tags: string[] | null;
  crm_favorite: boolean;
  crm_last_interaction_at: string | null;
  crm_lead_status: LeadStatus | null;
  crm_lead_score: number;
  
  created_at: string;
  updated_at: string;
}

export interface EvolutionContactAPIResponse {
  remoteJid: string;
  pushName?: string;
  profilePicUrl?: string;
  id?: string;
}

export interface EvolutionContactsCache {
  contacts: EvolutionContact[];
  lastSyncedAt: Date | null;
  cacheValid: boolean;
  secondsSinceSync: number | null;
}

// =============================================================================
// TIPOS PARA CONFIGURAÇÕES DA EVOLUTION API
// =============================================================================

/** Configurações de comportamento da instância Evolution */
export interface EvolutionSettings {
  rejectCall: boolean;        // Rejeitar chamadas de voz/vídeo automaticamente
  msgCall: string;            // Mensagem a enviar ao rejeitar chamada
  groupsIgnore: boolean;      // Ignorar mensagens de grupos
  alwaysOnline: boolean;      // Manter status sempre online
  readMessages: boolean;      // Marcar mensagens como lidas automaticamente
  readStatus: boolean;        // Ler status de contatos
}

/** Configurações de webhook da Evolution */
export interface EvolutionWebhookConfig {
  enabled: boolean;
  webhookByEvents: boolean;
  webhookBase64: boolean;
  events: string[];
}

/** Payload para atualização de configurações */
export interface UpdateEvolutionSettingsPayload {
  settings?: Partial<EvolutionSettings>;
  webhook?: Partial<EvolutionWebhookConfig>;
}

// =============================================================================
// JSON SCHEMA PARA N8N - CONFIGURAÇÃO DO AGENTE SDR
// =============================================================================

/** Modelo de apresentação do agente */
export interface ModeloApresentacao {
  id: string;
  texto: string;
  ativo: boolean;
}

/** Técnica de contorno de objeções */
export interface TecnicaObjecao {
  id: string;
  tecnica: string;
  exemplo?: string;
}

/** Configuração de IA */
export interface IAConfig {
  model: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo';
  temperature: number;     // 0.0 - 2.0
  top_p: number;           // 0.0 - 1.0
  frequency_penalty: number; // -2.0 - 2.0
  presence_penalty: number;  // -2.0 - 2.0
  max_tokens: number;        // 50 - 4000
}

/** Schema JSON completo para N8N */
export interface AgenteConfigJSON {
  identidade: {
    nome_agente: string;
    nome_empresa: string;
    descricao_empresa: string;
    missao: string;
  };
  apresentacao: {
    modelos: ModeloApresentacao[];
  };
  qualificacao: {
    requisitos: string[];
  };
  mensagens: {
    fallback: string;
  };
  ia_config: IAConfig;
  objecoes: {
    tecnicas: TecnicaObjecao[];
  };
  limitacoes: string[];
}

/** Metadados da configuração */
export interface ConfigMetadata {
  versao: string;
  atualizado_em: string;
  ativo: boolean;
}

// =============================================================================
// TIPOS PARA BANCO DE DADOS (SUPABASE)
// =============================================================================

export interface SDRAgentConfig {
  id: string;
  phone: string;
  instance_id: string | null;
  
  // JSON com toda configuração do agente
  config_json: AgenteConfigJSON;
  
  // Metadados
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TIPOS PARA FORMS (Separados por Tab)
// =============================================================================

/** Tab: Identidade do Agente */
export interface FormIdentidade {
  nome_agente: string;
  nome_empresa: string;
  descricao_empresa: string;
  missao: string;
}

/** Tab: Apresentação */
export interface FormApresentacao {
  modelos: ModeloApresentacao[];
}

/** Tab: Qualificação de Leads */
export interface FormQualificacao {
  requisitos: string[];
}

/** Tab: Mensagens */
export interface FormMensagens {
  fallback: string;
}

/** Tab: Configurações de IA (SLIDERS) */
export interface FormIAConfig {
  model: IAConfig['model'];
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
}

/** Tab: Objeções */
export interface FormObjecoes {
  tecnicas: TecnicaObjecao[];
}

/** Tab: Limitações */
export interface FormLimitacoes {
  limitacoes: string[];
}

// =============================================================================
// TIPOS PARA PLAYGROUND
// =============================================================================

export interface PlaygroundMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reacao?: string; // Emoji de reação
}

export interface PlaygroundSession {
  messages: PlaygroundMessage[];
  isLoading: boolean;
  leadsColetados: Record<string, string>; // Dados coletados do lead
}

// =============================================================================
// CONSTANTES
// =============================================================================

export const AI_MODELS = [
  { value: 'gpt-4o-mini' as const, label: 'GPT-4o Mini (Recomendado)', description: 'Rápido e econômico' },
  { value: 'gpt-4o' as const, label: 'GPT-4o (Mais Avançado)', description: 'Melhor qualidade' },
  { value: 'gpt-3.5-turbo' as const, label: 'GPT-3.5 Turbo', description: 'Mais rápido' },
] as const;

export const SLIDER_CONFIGS = {
  temperature: {
    min: 0,
    max: 2,
    step: 0.1,
    default: 0.7,
    label: 'Temperatura',
    description: '0 = Determinístico, 2 = Muito criativo',
  },
  top_p: {
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.9,
    label: 'Top P (Nucleus Sampling)',
    description: 'Controla diversidade de tokens',
  },
  frequency_penalty: {
    min: -2,
    max: 2,
    step: 0.1,
    default: 0,
    label: 'Penalidade de Frequência',
    description: 'Negativo repete palavras, Positivo diversifica',
  },
  presence_penalty: {
    min: -2,
    max: 2,
    step: 0.1,
    default: 0,
    label: 'Penalidade de Presença',
    description: 'Controla introdução de novos tópicos',
  },
  max_tokens: {
    min: 50,
    max: 4000,
    step: 50,
    default: 500,
    label: 'Máximo de Tokens',
    description: 'Limite de tokens na resposta',
  },
} as const;

export const DEFAULT_IA_CONFIG: IAConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  top_p: 0.9,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 500,
};

export const DEFAULT_CONFIG_JSON: AgenteConfigJSON = {
  identidade: {
    nome_agente: 'Assistente SDR',
    nome_empresa: '',
    descricao_empresa: '',
    missao: 'Criar conexão humana e genuína, coletar informações essenciais e agendar reuniões',
  },
  apresentacao: {
    modelos: [
      {
        id: '1',
        texto: 'Oi, tudo bem? Me chamo {nome_agente} da equipe {nome_empresa}.',
        ativo: true,
      },
    ],
  },
  qualificacao: {
    requisitos: [
      'Endereço, data e horário da gravação',
      'O que a empresa faz',
      'Redes sociais / site + uso do material',
      'Objetivo principal do vídeo',
      'Referências visuais',
    ],
  },
  mensagens: {
    fallback: 'Desculpe, não entendi sua mensagem. Pode reformular?',
  },
  ia_config: DEFAULT_IA_CONFIG,
  objecoes: {
    tecnicas: [],
  },
  limitacoes: [
    'Não responda perguntas fora do escopo',
    'Não mostre dados de outros clientes',
    'Nunca recomende concorrentes',
  ],
};

// =============================================================================
// STATUS BADGES
// =============================================================================

export const CONNECTION_STATUS_CONFIG: Record<ConnectionStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  disconnected: {
    label: 'Desconectado',
    color: 'text-red-500 bg-red-50 border-red-200',
    icon: '🔴',
  },
  connecting: {
    label: 'Conectando...',
    color: 'text-yellow-500 bg-yellow-50 border-yellow-200',
    icon: '🟡',
  },
  connected: {
    label: 'Conectado',
    color: 'text-green-500 bg-green-50 border-green-200',
    icon: '🟢',
  },
  error: {
    label: 'Erro',
    color: 'text-red-500 bg-red-50 border-red-200',
    icon: '❌',
  },
};
