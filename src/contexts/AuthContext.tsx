import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Cliente {
  phone: string;
  name: string;
  email?: string;
  cpf?: string;
  avatar_url?: string;
  subscription_active: boolean;
  is_active: boolean;
  plan_id?: string;
  billing_provider?: string | null;
  external_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  last_seen_at?: string | null;
  refund_period_ends_at?: string | null; // ✅ Período de garantia de 7 dias grátis
  created_at?: string;
  updated_at?: string;
  auth_user_id?: string; // Novo campo para integração
}

interface AuthContextValue {
  cliente: Cliente | null;
  loading: boolean;
  isLoggingOut: boolean; // Novo estado para loading do logout
  user: User | null; // Usuário Supabase Auth
  session: Session | null; // Sessão Supabase Auth
  login: (phone: string, password: string) => Promise<void>;
  signup: (data: { phone: string; name: string; email: string; cpf: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (avatarUrl: string | null) => void;
  updateCliente: (updatedData: Partial<Cliente>) => void;
  checkPhoneExists: (phone: string) => Promise<{ phoneExists: boolean; hasAuthId: boolean }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const FAILED_ATTEMPTS_KEY = 'login_failed_attempts';
const BLOCKED_UNTIL_KEY = 'login_blocked_until';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Função helper para converter telefone para email sintético
const phoneToEmail = (phone: string): string => `${phone}@meuagente.api.br`;

// Função helper para extrair telefone do email sintético
const emailToPhone = (email: string): string => email.replace('@meuagente.api.br', '');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Estado para loading do logout
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  // Initialize Supabase Auth session and listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Aguardar um pouco para garantir que o localStorage foi carregado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            // Carregar dados do cliente de forma assíncrona
            loadClienteFromAuth(initialSession.user).catch(err => {
              console.error('Error loading cliente:', err);
            });
          } else {
            // Se não há sessão, garantir que o estado está limpo
            setCliente(null);
            setUser(null);
            setSession(null);
          }
          
          // ✅ CORREÇÃO: Definir loading como false apenas após processar a sessão
          // Isso evita que o ProtectedRoute redirecione antes da sessão estar pronta
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id);
      
      // Processar diferentes eventos de autenticação
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            // Carregar dados do cliente de forma assíncrona
            loadClienteFromAuth(session.user).catch(err => {
              console.error('Error loading cliente in listener:', err);
            });
          }
          break;
          
        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          setCliente(null);
          // Limpar dados de sessão
          sessionStorage.removeItem('auth_phone');
          sessionStorage.removeItem('auth_avatar');
          break;
          
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user);
            // Carregar dados do cliente de forma assíncrona
            loadClienteFromAuth(session.user).catch(err => {
              console.error('Error loading cliente in listener:', err);
            });
          }
          break;
          
        default:
          // Para outros eventos, apenas atualizar o estado
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            // Carregar dados do cliente de forma assíncrona
            loadClienteFromAuth(session.user).catch(err => {
              console.error('Error loading cliente in listener:', err);
            });
          } else {
            setCliente(null);
          }
      }
      
      setLoading(false);
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load cliente data from authenticated user
  const loadClienteFromAuth = async (authUser: User) => {
    try {
      // Extract phone from user metadata or email
      const phone = authUser.user_metadata?.phone || emailToPhone(authUser.email || '');
      
      if (!phone) {
        console.error('No phone found for user:', authUser.id);
        return;
      }

      const { data, error } = await supabase
        .from('clientes')
        .select(`
          phone,
          name,
          email,
          cpf,
          avatar_url,
          subscription_active,
          is_active,
          plan_id,
          refund_period_ends_at,
          billing_provider,
          external_subscription_id,
          stripe_customer_id,
          last_seen_at,
          created_at,
          updated_at,
          auth_user_id
        `)
        .eq('auth_user_id', authUser.id)
            .eq('is_active', true)
            .single();

      if (!error && data) {
        // Forçar timestamp na URL do avatar para evitar cache
        let avatarUrl = data.avatar_url;
        if (avatarUrl) {
          const timestamp = new Date().getTime();
          const baseUrl = avatarUrl.split('?t=')[0];
          avatarUrl = `${baseUrl}?t=${timestamp}`;
        }
        
        const clienteData = {
          ...data,
          avatar_url: avatarUrl || undefined
        };
        setCliente(clienteData);
      } else {
        console.error('Error loading cliente:', error);
      }
    } catch (err) {
      console.error('Error loading cliente from auth:', err);
    }
  };

  const checkRateLimit = (): boolean => {
    const blockedUntil = localStorage.getItem(BLOCKED_UNTIL_KEY);
    if (blockedUntil) {
      const until = parseInt(blockedUntil);
      if (Date.now() < until) {
        const remainingMinutes = Math.ceil((until - Date.now()) / 60000);
        toast.error(`Muitas tentativas. Tente novamente em ${remainingMinutes} minuto(s).`);
        return false;
      } else {
        localStorage.removeItem(BLOCKED_UNTIL_KEY);
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      }
    }
    return true;
  };

  const incrementFailedAttempts = (baseMessage?: string) => {
    const attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0') + 1;
    localStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString());

    const remaining = Math.max(MAX_ATTEMPTS - attempts, 0);

    // Mensagem base mais amigável (se fornecida) ou fallback genérico
    const mainMessage = baseMessage || 'Credenciais inválidas.';

    if (attempts >= MAX_ATTEMPTS) {
      const blockedUntil = Date.now() + BLOCK_DURATION_MS;
      localStorage.setItem(BLOCKED_UNTIL_KEY, blockedUntil.toString());

      toast.error(
        `${mainMessage} Muitas tentativas. Sua conta foi bloqueada por 5 minutos.`
      );
    } else {
      toast.error(
        `${mainMessage} Você ainda tem ${remaining} tentativa(s) antes do bloqueio.`
      );
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(BLOCKED_UNTIL_KEY);
  };

  const checkPhoneExists = useCallback(async (phone: string): Promise<{ phoneExists: boolean; hasAuthId: boolean }> => {
    try {
      // Validar formato do telefone
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Formato de telefone inválido');
      }

      // Nova RPC que segue o plano: retorna phone_exists e has_auth_id
      const { data, error } = await supabase.rpc('check_phone_registration', {
        phone_input: phone
      });

      if (error) {
        console.error('Error checking phone registration:', error);
        return { phoneExists: false, hasAuthId: false };
      }

      // check_phone_registration retorna uma linha com:
      // { phone_exists, has_auth_id, name, email } de acordo com types gerados
      const row = Array.isArray(data) ? data[0] : data;

      if (!row) {
        return { phoneExists: false, hasAuthId: false };
      }

      return {
        phoneExists: row.phone_exists === true,
        hasAuthId: row.has_auth_id === true,
      };
    } catch (err) {
      console.error('Error in checkPhoneExists:', err);
      return { phoneExists: false, hasAuthId: false };
    }
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    /**
     * MIGRAÇÃO PARA SUPABASE AUTH - FASE 3
     * Substituindo Edge Functions por Supabase Auth nativo
     * Mantendo interface de telefone para compatibilidade
     * Data: 2025-01-16
     */
    
    if (!checkRateLimit()) {
      throw new Error('Muitas tentativas de login. Tente novamente mais tarde.');
    }

    // Validação rigorosa de entrada
    if (!phone || !password) {
      incrementFailedAttempts('Telefone e senha são obrigatórios.');
      throw new Error('Telefone e senha são obrigatórios');
    }

    // Validar formato do telefone (apenas números, 10-15 dígitos)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      incrementFailedAttempts('Formato de telefone inválido.');
      throw new Error('Formato de telefone inválido');
    }

    // Validar senha (mínimo 8 caracteres)
    if (password.length < 8) {
      incrementFailedAttempts();
      throw new Error('Senha deve ter no mínimo 8 caracteres');
    }

    try {
      // Usar função SQL para buscar email por telefone (bypassa RLS)
      const { data: clienteData, error: clienteError } = await supabase
        .rpc('get_user_email_by_phone', { phone_number: phone });

      let loginEmail: string;
      
      if (clienteData && clienteData.length > 0 && clienteData[0].email && clienteData[0].auth_user_id) {
        // Usuário tem email real e auth_user_id - usar email real
        loginEmail = clienteData[0].email;
      } else {
        // Usuário antigo ou sem email real - usar email sintético
        loginEmail = phoneToEmail(phone);
      }
      
      // Usar Supabase Auth nativo
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        // Mapear erros do Supabase para mensagens amigáveis
        let errorMessage = 'Credenciais inválidas';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Telefone ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
        }
        
        // Log do erro para debugging (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          console.error('Login error:', error);
        }

        // Incrementar tentativas e exibir mensagem única combinada
        incrementFailedAttempts(errorMessage + '.');

        throw new Error(errorMessage);
      }

      if (!data.user) {
        incrementFailedAttempts('Erro na autenticação.');
        throw new Error('Erro na autenticação');
      }

      // Verificar se email foi confirmado
      if (!data.user.email_confirmed_at) {
        throw new Error('Por favor, confirme seu email antes de fazer login');
      }

      // Limpar tentativas falhadas apenas após login bem-sucedido
      clearFailedAttempts();
      
      // O cliente será carregado automaticamente pelo listener onAuthStateChange
      // Não precisamos mais buscar manualmente ou gerenciar sessionStorage
      
      toast.success('Login realizado com sucesso!');
      navigate('/chat');
    } catch (err: unknown) {
      // Log do erro para debugging (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', err);
      }
      
      // Garantir que sempre lance um erro para credenciais inválidas
      const message = err instanceof Error ? err.message : 'Credenciais inválidas';
      throw new Error(message);
    }
  }, [navigate]);

  const signup = useCallback(async ({ phone, name, email, cpf, password }: { phone: string; name: string; email: string; cpf: string; password: string }) => {
    /**
     * MIGRAÇÃO PARA SUPABASE AUTH - FASE 3
     * Substituindo Edge Functions por Supabase Auth nativo
     * Criando usuário e vinculando à tabela clientes
     * Data: 2025-01-16
     */
    
    try {
      // Validações básicas
      if (!phone || !name || !password) {
        throw new Error('Telefone, nome e senha são obrigatórios');
      }

      // Validar formato do telefone
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Formato de telefone inválido');
      }

      // Validar senha
      if (password.length < 8) {
        throw new Error('Senha deve ter no mínimo 8 caracteres');
      }

      // Usar email real fornecido pelo usuário
      const userEmail = email.trim();
      
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error('Formato de email inválido');
      }

      /**
       * URL de redirect pós-confirmação de email
       *
       * Atenção:
       * - Sempre apontamos para o domínio oficial de produção,
       *   independente de onde o frontend está rodando.
       * - Isso garante que todos os links de confirmação enviados
       *   pelo Supabase levem o usuário para o app em produção.
       * - Certifique-se de que esta URL esteja cadastrada em
       *   Auth → URL Configuration → Redirect URLs no painel do Supabase.
       */
      const redirectUrl = 'https://app.meuagente.api.br/auth/login';
      
      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            phone: phone,        // CAMPO PHONE NO USER_METADATA
            name: name,
            cpf: cpf,
            email: userEmail,    // Email real do usuário
          }
        }
      });

      if (error) {
        // Mapear erros do Supabase para mensagens amigáveis e específicas
        let errorMessage = 'Erro ao criar conta. Tente novamente.';
        
        // Verificar códigos de erro específicos primeiro
        const errorCode = error.status || error.message;
        const errorMsgLower = error.message.toLowerCase();
        
        // Log para debugging (sempre, para facilitar diagnóstico)
        console.error('Signup error:', {
          message: error.message,
          status: error.status,
          code: errorCode,
          fullError: error,
        });
        
        // Erros relacionados a senha (verificar PRIMEIRO pois também retornam 422)
        if (
          errorMsgLower.includes('password should contain') ||
          errorMsgLower.includes('password should be at least') ||
          errorMsgLower.includes('password is too short') ||
          errorMsgLower.includes('password_length') ||
          errorMsgLower.includes('weak password') ||
          errorMsgLower.includes('password is too weak') ||
          error.name === 'AuthWeakPasswordError'
        ) {
          errorMessage = 'Senha fraca. Use uma senha com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos (ex: @, #, $).';
        }
        // Erros relacionados a email duplicado
        else if (
          errorMsgLower.includes('user already registered') ||
          errorMsgLower.includes('email already registered') ||
          errorMsgLower.includes('already exists')
        ) {
          errorMessage = 'Este email já está cadastrado. Use outro email ou faça login.';
        }
        // Erro 422 pode ter várias causas - ser mais específico
        else if (errorCode === 422) {
          // Verificar se é problema de constraint de email ou telefone
          if (errorMsgLower.includes('email')) {
            errorMessage = 'Este email já está em uso. Use outro email ou faça login.';
          } else if (errorMsgLower.includes('phone')) {
            errorMessage = 'Este telefone já está cadastrado. Use outro telefone ou faça login.';
          } else if (errorMsgLower.includes('database') || errorMsgLower.includes('constraint')) {
            errorMessage = 'Erro ao processar cadastro. Este email ou telefone pode já estar em uso.';
          } else {
            errorMessage = 'Não foi possível criar a conta. Verifique se os dados estão corretos e tente novamente.';
          }
        }
        // Erros relacionados a email inválido
        else if (
          errorMsgLower.includes('invalid email') ||
          errorMsgLower.includes('email format') ||
          errorCode === 400
        ) {
          errorMessage = 'Email inválido. Verifique o formato do email.';
        }
        // Erros relacionados a rate limiting
        else if (
          errorMsgLower.includes('rate limit') ||
          errorMsgLower.includes('too many requests') ||
          errorMsgLower.includes('email rate limit') ||
          errorCode === 429
        ) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
        }
        // Erros relacionados a signup desabilitado
        else if (
          errorMsgLower.includes('signup disabled') ||
          errorMsgLower.includes('signups are disabled')
        ) {
          errorMessage = 'Cadastros estão temporariamente desabilitados. Tente novamente mais tarde.';
        }
        // Erros relacionados a domínio de email não permitido
        else if (
          errorMsgLower.includes('email domain') ||
          errorMsgLower.includes('email not allowed') ||
          errorMsgLower.includes('domain not allowed')
        ) {
          errorMessage = 'Este domínio de email não é permitido. Use outro email.';
        }
        // Erros relacionados a configuração
        else if (
          errorMsgLower.includes('redirect url') ||
          errorMsgLower.includes('redirect_to')
        ) {
          errorMessage = 'Erro de configuração. Entre em contato com o suporte.';
        }
        // Erro genérico com mais contexto
        else {
          // Log detalhado em desenvolvimento para debugging
          if (process.env.NODE_ENV === 'development') {
            console.error('Signup error details:', {
              message: error.message,
              status: error.status,
              code: errorCode,
            });
          }
          errorMessage = `Erro ao criar conta: ${error.message || 'Tente novamente mais tarde.'}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!data.user) {
        throw new Error('Erro ao criar usuário');
      }

      /**
       * NOVO COMPORTAMENTO (alinhado ao plano):
       * Após criar o usuário no Supabase Auth, chamamos a RPC
       * upsert_cliente_from_auth para vincular (ou criar) o registro
       * na tabela clientes com base no phone.
       *
       * Isso centraliza a lógica crítica de vínculo no banco de dados.
       */
      const authUserId = data.user.id;

      const { error: upsertError } = await supabase.rpc('upsert_cliente_from_auth', {
        p_auth_user_id: authUserId,
        p_cpf: cpf ?? '',
        p_email: userEmail,
        p_name: name,
        p_phone: phone,
      });

      if (upsertError) {
        console.error('Error calling upsert_cliente_from_auth:', upsertError);
        // Importante: não falhar o signup por erro na RPC.
        // O usuário foi criado no Auth e poderá tentar novamente ou ser ajustado via suporte.
      }

      // NÃO FAZER LOGIN AUTOMÁTICO - Requerer confirmação de email
      toast.success('Conta criada! Verifique seu email para confirmar.');
      navigate('/auth/login');
    } catch (err: unknown) {
      console.error('Signup error:', err);
      const message = err instanceof Error ? err.message : 'Erro ao criar conta';
      throw new Error(message);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    /**
     * LOGOUT SEGURO - FASE 4
     * - Verifica se há sessão antes de chamar signOut
     * - Usa scope 'local' para evitar erros desnecessários
     * - Limpa estado e storage mesmo em caso de erro
     * Data: 2025-01-16 (atualizado)
     */
    
    setIsLoggingOut(true);
    
    try {
      // 1. Verificar se há sessão ativa
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // 2. Fazer logout no Supabase primeiro (escopo local)
        const { error } = await supabase.auth.signOut({ scope: 'local' });

        if (error) {
          console.error('Logout error:', error);
          // Se a sessão já não existir, apenas logar e continuar
          if (!error.message?.toLowerCase().includes('auth session missing')) {
            // Outros erros são logados mas não bloqueiam limpeza local
            console.warn('Continuando logout mesmo com erro do Supabase Auth.');
          }
        }
      } else {
        console.warn('⚠️ Nenhuma sessão ativa encontrada ao tentar logout. Limpando estado local mesmo assim.');
      }

      // 3. Limpar estado local e storages depois do signOut
      setCliente(null);
      setUser(null);
      setSession(null);
      
      sessionStorage.removeItem('auth_phone');
      sessionStorage.removeItem('auth_avatar');
      sessionStorage.removeItem('agendaView');
      localStorage.removeItem('login_failed_attempts');
      localStorage.removeItem('login_blocked_until');
      
      // 4. Mostrar feedback e navegar
      toast.info('Sessão encerrada');
      navigate('/auth/login');
      
    } catch (err) {
      console.error('Logout error:', err);
      // Em qualquer erro, garantir limpeza local e navegação
      setCliente(null);
      setUser(null);
      setSession(null);
      sessionStorage.clear();
      localStorage.removeItem('login_failed_attempts');
      localStorage.removeItem('login_blocked_until');
      navigate('/auth/login');
    } finally {
      setIsLoggingOut(false);
    }
  }, [navigate]);

  const updateAvatar = useCallback((avatarUrl: string | null) => {
    if (cliente) {
      setCliente({ ...cliente, avatar_url: avatarUrl });
      if (avatarUrl) {
        sessionStorage.setItem('auth_avatar', avatarUrl);
      } else {
        sessionStorage.removeItem('auth_avatar');
      }
    }
  }, [cliente]);

  const updateCliente = useCallback((updatedData: Partial<Cliente>) => {
    if (cliente) {
      const newClienteData = { ...cliente, ...updatedData };
      // Ensure avatar_url has a timestamp for cache busting
      if (newClienteData.avatar_url) {
        const timestamp = new Date().getTime();
        const baseUrl = newClienteData.avatar_url.split('?t=')[0];
        newClienteData.avatar_url = `${baseUrl}?t=${timestamp}`;
      }
      setCliente(newClienteData);
    }
  }, [cliente]);

  // ✅ FIX: Realtime subscription para manter dados do usuário sempre atualizados
  // Isso resolve problemas de cache onde o webhook atualiza o backend mas o frontend não reflete
  useEffect(() => {
    if (!cliente?.phone) return;

    const channel = supabase
      .channel(`cliente_update:${cliente.phone}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clientes',
          filter: `phone=eq.${cliente.phone}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload.new);
          setCliente((currentCliente) => {
            if (!currentCliente) return null;
            
            const updatedRecord = payload.new as { avatar_url?: string; [key: string]: unknown };
            
            // Preservar lógica de timestamp do avatar
            let avatarUrl = updatedRecord.avatar_url;
            if (avatarUrl && currentCliente.avatar_url) {
               const currentBase = currentCliente.avatar_url.split('?')[0];
               const newBase = avatarUrl.split('?')[0];
               if (currentBase === newBase) {
                   // Manter timestamp existente para evitar reload da imagem se não mudou
                   avatarUrl = currentCliente.avatar_url;
               } else {
                   // Novo avatar = novo timestamp
                   avatarUrl = `${newBase}?t=${new Date().getTime()}`;
               }
            }
            
            return {
              ...currentCliente,
              ...updatedRecord,
              avatar_url: avatarUrl
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliente?.phone]);

  // ✅ OTIMIZAÇÃO: Memoizar value do context (padrão React.dev)
  // Evita re-renders desnecessários dos consumers quando deps não mudam
  const contextValue = useMemo(() => ({
    cliente, 
    loading, 
    isLoggingOut,
    user, 
    session, 
    login, 
    signup, 
    logout, 
    updateAvatar, 
    updateCliente,
    checkPhoneExists
  }), [cliente, loading, isLoggingOut, user, session, login, signup, logout, updateAvatar, updateCliente, checkPhoneExists]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
