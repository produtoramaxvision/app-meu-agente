/**
 * Chat Types - Agente de Scrape Interface
 * 
 * Tipos para a interface conversacional com o Agente de Scrape via webhook n8n.
 * Persistência via Supabase nas tabelas chat_ia_sessions e chat_ia_messages.
 */

import type { Tables, TablesInsert } from '@/integrations/supabase/types';

// =====================================================
// Tipos base do banco de dados
// =====================================================

export type DbChatSession = Tables<'chat_ia_sessions'>;
export type DbChatMessage = Tables<'chat_ia_messages'>;
export type DbChatSessionInsert = TablesInsert<'chat_ia_sessions'>;
export type DbChatMessageInsert = TablesInsert<'chat_ia_messages'>;

// =====================================================
// Tipos da aplicação
// =====================================================

export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  sessionId?: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  status: MessageStatus;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  phone: string;
  title: string | null;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// Funções de conversão DB <-> App
// =====================================================

export function dbMessageToApp(dbMsg: DbChatMessage): ChatMessage {
  return {
    id: dbMsg.id,
    sessionId: dbMsg.session_id,
    content: dbMsg.content,
    role: dbMsg.role as MessageRole,
    timestamp: new Date(dbMsg.created_at || Date.now()),
    status: dbMsg.status as MessageStatus,
    metadata: dbMsg.metadata as Record<string, unknown> | undefined,
  };
}

export function dbSessionToApp(dbSession: DbChatSession, messages: ChatMessage[] = []): ChatSession {
  return {
    id: dbSession.id,
    phone: dbSession.phone,
    title: dbSession.title,
    messages,
    createdAt: new Date(dbSession.created_at || Date.now()),
    updatedAt: new Date(dbSession.updated_at || Date.now()),
  };
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
