/**
 * Chatwoot Integration Types
 * 
 * Tipos para integração com a API do Chatwoot v4.8
 */

export interface ChatwootConfig {
  baseUrl: string;
  apiAccessToken: string;
  accountId: number;
  inboxId: number; // Inbox do tipo API para mensagens do app web
}

export interface ChatwootContact {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  thumbnail?: string;
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
  contact_inboxes?: ChatwootContactInbox[];
}

export interface ChatwootContactInbox {
  source_id: string;
  inbox: {
    id: number;
    name: string;
    channel_type: string;
  };
}

export interface ChatwootConversation {
  id: number;
  inbox_id: number;
  status: 'open' | 'resolved' | 'pending';
  contact_last_seen_at?: number;
  agent_last_seen_at?: number;
  messages?: ChatwootMessage[];
  meta?: {
    sender: ChatwootContact;
  };
}

export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: 0 | 1 | 2; // 0 = incoming, 1 = outgoing, 2 = activity
  conversation_id: number;
  created_at: number;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  sender_type?: 'contact' | 'agent' | 'agent_bot';
}

export interface CreateContactPayload {
  inbox_id: number;
  name: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  avatar_url?: string;
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
}

export interface CreateConversationPayload {
  source_id: string;
  inbox_id: number;
  contact_id: number;
  status?: 'open' | 'resolved' | 'pending';
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
  message?: {
    content: string;
  };
}

export interface CreateMessagePayload {
  content: string;
  message_type: 'incoming' | 'outgoing';
  private?: boolean;
  content_type?: 'text' | 'input_email' | 'cards' | 'input_select' | 'form' | 'article';
  content_attributes?: Record<string, unknown>;
}

export interface SearchContactsResponse {
  meta: {
    count: number;
    current_page: string;
  };
  payload: ChatwootContact[];
}

export interface ContactConversationsResponse {
  payload: ChatwootConversation[];
}

export interface CreateContactResponse {
  payload: ChatwootContact[];
  id: number;
}

export interface CreateConversationResponse {
  id: number;
  account_id: number;
  inbox_id: number;
}

export interface CreateMessageResponse {
  id: number;
  content: string;
  message_type: number;
  conversation_id: number;
  created_at: number;
}
