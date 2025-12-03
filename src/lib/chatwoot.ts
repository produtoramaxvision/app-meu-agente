/**
 * Chatwoot API Service
 * 
 * Serviço para integração com a API do Chatwoot v4.8
 * Implementa o fluxo: Buscar/Criar Contact → Buscar/Criar Conversation → Enviar Message
 */

import type {
  ChatwootConfig,
  ChatwootContact,
  ChatwootConversation,
  CreateContactPayload,
  CreateConversationPayload,
  CreateMessagePayload,
  SearchContactsResponse,
  ContactConversationsResponse,
  CreateContactResponse,
  CreateConversationResponse,
  CreateMessageResponse,
} from '@/types/chatwoot';

// Configuração do Chatwoot via variáveis de ambiente
const CHATWOOT_CONFIG: ChatwootConfig = {
  baseUrl: import.meta.env.VITE_CHATWOOT_BASE_URL || '',
  apiAccessToken: import.meta.env.VITE_CHATWOOT_API_TOKEN || '',
  accountId: parseInt(import.meta.env.VITE_CHATWOOT_ACCOUNT_ID || '0'),
  inboxId: parseInt(import.meta.env.VITE_CHATWOOT_INBOX_ID || '0'),
};

/**
 * Verifica se o Chatwoot está configurado
 */
export function isChatwootConfigured(): boolean {
  return !!(
    CHATWOOT_CONFIG.baseUrl &&
    CHATWOOT_CONFIG.apiAccessToken &&
    CHATWOOT_CONFIG.accountId &&
    CHATWOOT_CONFIG.inboxId
  );
}

/**
 * Faz uma requisição para a API do Chatwoot
 */
async function chatwootFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${CHATWOOT_CONFIG.baseUrl}/api/v1/accounts/${CHATWOOT_CONFIG.accountId}${endpoint}`;
  
  console.log('🔗 Chatwoot API:', options.method || 'GET', url);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': CHATWOOT_CONFIG.apiAccessToken,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Chatwoot API Error:', response.status, errorText);
    throw new Error(`Chatwoot API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Chatwoot Response:', data);
  return data;
}

/**
 * Busca um contato pelo número de telefone
 */
export async function searchContactByPhone(phone: string): Promise<ChatwootContact | null> {
  try {
    // Normaliza o telefone para busca (remove caracteres especiais)
    const normalizedPhone = phone.replace(/\D/g, '');
    
    const response = await chatwootFetch<SearchContactsResponse>(
      `/contacts/search?q=${encodeURIComponent(normalizedPhone)}`
    );

    if (response.payload && response.payload.length > 0) {
      // Busca exata pelo telefone
      const exactMatch = response.payload.find(contact => {
        const contactPhone = contact.phone_number?.replace(/\D/g, '');
        return contactPhone === normalizedPhone;
      });
      
      return exactMatch || response.payload[0];
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    return null;
  }
}

/**
 * Cria um novo contato no Chatwoot
 */
export async function createContact(
  data: Omit<CreateContactPayload, 'inbox_id'>
): Promise<ChatwootContact | null> {
  try {
    const payload: CreateContactPayload = {
      inbox_id: CHATWOOT_CONFIG.inboxId,
      ...data,
    };

    const response = await chatwootFetch<CreateContactResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // A resposta pode ter o contato em payload[0] ou diretamente
    if (response.payload && response.payload.length > 0) {
      return response.payload[0];
    }

    return null;
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    throw error;
  }
}

/**
 * Busca conversas de um contato
 */
export async function getContactConversations(
  contactId: number
): Promise<ChatwootConversation[]> {
  try {
    const response = await chatwootFetch<ContactConversationsResponse>(
      `/contacts/${contactId}/conversations`
    );

    return response.payload || [];
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return [];
  }
}

/**
 * Encontra uma conversa aberta no inbox específico
 */
export async function findOpenConversation(
  contactId: number
): Promise<ChatwootConversation | null> {
  const conversations = await getContactConversations(contactId);
  
  // Busca conversa aberta ou pending no inbox do app web
  const openConversation = conversations.find(
    conv => 
      conv.inbox_id === CHATWOOT_CONFIG.inboxId && 
      (conv.status === 'open' || conv.status === 'pending')
  );

  return openConversation || null;
}

/**
 * Cria uma nova conversa para um contato
 */
export async function createConversation(
  contactId: number,
  initialMessage?: string
): Promise<ChatwootConversation | null> {
  try {
    // Gera um source_id único para a conversa
    const sourceId = `app_web_${contactId}_${Date.now()}`;

    const payload: CreateConversationPayload = {
      source_id: sourceId,
      inbox_id: CHATWOOT_CONFIG.inboxId,
      contact_id: contactId,
      status: 'open',
      additional_attributes: {
        source: 'app_web',
        created_from: 'meu_agente_chat',
      },
    };

    // Se tiver mensagem inicial, inclui
    if (initialMessage) {
      payload.message = {
        content: initialMessage,
      };
    }

    const response = await chatwootFetch<CreateConversationResponse>('/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      id: response.id,
      inbox_id: response.inbox_id,
      status: 'open',
    };
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
}

/**
 * Envia uma mensagem para uma conversa
 */
export async function sendMessage(
  conversationId: number,
  content: string,
  messageType: 'incoming' | 'outgoing' = 'incoming'
): Promise<CreateMessageResponse | null> {
  try {
    const payload: CreateMessagePayload = {
      content,
      message_type: messageType,
      private: false,
      content_type: 'text',
    };

    const response = await chatwootFetch<CreateMessageResponse>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return response;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

/**
 * Fluxo completo: Busca/Cria contato → Busca/Cria conversa → Envia mensagem
 * 
 * @param cliente - Dados do cliente do app
 * @param message - Mensagem a ser enviada
 * @returns Objeto com IDs do contato, conversa e mensagem
 */
export async function sendMessageToChatwoot(
  cliente: {
    phone: string;
    name: string;
    email?: string;
    avatar_url?: string;
    plan_id?: string;
  },
  message: string
): Promise<{
  contactId: number;
  conversationId: number;
  messageId: number;
} | null> {
  if (!isChatwootConfigured()) {
    console.warn('⚠️ Chatwoot não está configurado');
    return null;
  }

  console.log('📤 Iniciando envio para Chatwoot...');
  console.log('👤 Cliente:', cliente.name, cliente.phone);
  console.log('💬 Mensagem:', message);

  try {
    // 1. Buscar contato pelo telefone
    let contact = await searchContactByPhone(cliente.phone);
    console.log('🔍 Contato encontrado:', contact?.id || 'Não');

    // 2. Se não existir, criar contato
    if (!contact) {
      console.log('➕ Criando novo contato...');
      contact = await createContact({
        name: cliente.name,
        phone_number: cliente.phone,
        email: cliente.email,
        avatar_url: cliente.avatar_url,
        identifier: cliente.phone, // Usa telefone como identificador único
        custom_attributes: {
          plan_id: cliente.plan_id,
          source: 'app_web',
        },
      });

      if (!contact) {
        throw new Error('Falha ao criar contato no Chatwoot');
      }
      console.log('✅ Contato criado:', contact.id);
    }

    // 3. Buscar conversa aberta existente
    let conversation = await findOpenConversation(contact.id);
    console.log('🔍 Conversa aberta encontrada:', conversation?.id || 'Não');

    // 4. Se não tiver conversa aberta, criar nova
    if (!conversation) {
      console.log('➕ Criando nova conversa...');
      conversation = await createConversation(contact.id);

      if (!conversation) {
        throw new Error('Falha ao criar conversa no Chatwoot');
      }
      console.log('✅ Conversa criada:', conversation.id);
    }

    // 5. Enviar mensagem como "incoming" (do cliente)
    console.log('📨 Enviando mensagem...');
    const messageResponse = await sendMessage(conversation.id, message, 'incoming');

    if (!messageResponse) {
      throw new Error('Falha ao enviar mensagem no Chatwoot');
    }
    console.log('✅ Mensagem enviada:', messageResponse.id);

    return {
      contactId: contact.id,
      conversationId: conversation.id,
      messageId: messageResponse.id,
    };
  } catch (error) {
    console.error('❌ Erro no fluxo Chatwoot:', error);
    throw error;
  }
}

/**
 * Obtém a configuração atual do Chatwoot (sem o token)
 */
export function getChatwootConfig() {
  return {
    baseUrl: CHATWOOT_CONFIG.baseUrl,
    accountId: CHATWOOT_CONFIG.accountId,
    inboxId: CHATWOOT_CONFIG.inboxId,
    isConfigured: isChatwootConfigured(),
  };
}
