/**
 * Chat Types - Agente de Scrape Interface
 * 
 * Tipos para a interface conversacional com o Agente de Scrape via webhook n8n.
 */

export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  status: MessageStatus;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClienteInfo {
  phone: string;
  name: string;
  email?: string;
  cpf?: string;
  avatar_url?: string;
  subscription_active: boolean;
  is_active: boolean;
  plan_id?: string;
  created_at?: string;
}

export interface SendMessagePayload {
  message: string;
  timestamp: string;
  sessionId?: string;
  cliente: ClienteInfo;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: {
    response: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

// Suggested prompts for empty state
export const SUGGESTED_PROMPTS = [
  {
    title: 'Extrair contatos',
    prompt: 'Faça o scrape do site exemplo.com e me envie os contatos comerciais (nome, e-mail e telefone) em CSV.',
    icon: 'Users',
  },
  {
    title: 'Buscar dados públicos',
    prompt: 'Busque no portal de dados abertos o dataset de aluguel residencial de 2024 e me mande um CSV filtrado por bairro.',
    icon: 'Database',
  },
  {
    title: 'Pesquisar tendências',
    prompt: 'Pesquise tendências de "roupas fitness" nos últimos 90 dias e me entregue 5 insights com 3 links confiáveis.',
    icon: 'TrendingUp',
  },
  {
    title: 'Comparar produtos',
    prompt: 'Compare "CRM para clínicas" e "ERP para clínicas" focando em custo-benefício e me mande um resumo objetivo.',
    icon: 'Scale',
  },
] as const;
