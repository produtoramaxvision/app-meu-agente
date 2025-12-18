import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendTextRequest {
  number?: string;
  text?: string;
  instance_id?: string | null;
}

interface EvolutionInstance {
  id: string;
  phone: string;
  instance_name: string;
  instance_token: string | null;
  connection_status: string;
  whatsapp_number: string | null;
  qr_code: string | null;
  pairing_code: string | null;
  last_qr_update: string | null;
  created_at: string;
  updated_at: string;
  connected_at: string | null;
  display_name: string | null;
}

const jsonResponse = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Códigos de país válidos (ITU-T E.164) - 195+ países
 * Formato: código sem o símbolo +
 */
const VALID_COUNTRY_CODES = [
  // América do Norte
  '1', // EUA, Canadá
  // América Latina
  '52', '53', '54', '55', '56', '57', '58', '591', '592', '593', '594', '595', '596', '597', '598',
  // Europa
  '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49',
  '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373',
  '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389',
  '420', '421', '423',
  // Ásia
  '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94',
  '95', '98', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227',
  '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241',
  '242', '243', '244', '245', '246', '248', '249', '250', '251', '252', '253', '254', '255', '256',
  '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291',
  '297', '298', '299', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370',
  '371', '372', '373', '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386',
  '387', '389', '420', '421', '423', '500', '501', '502', '503', '504', '505', '506', '507', '508',
  '509', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '670', '672', '673',
  '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '684', '685', '686', '687',
  '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '870', '878', '880', '886',
  '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974',
  '975', '976', '977', '992', '993', '994', '995', '996', '998',
];

type NormalizedConnectionState = 'connected' | 'connecting' | 'disconnected';

// Normaliza estados variados retornados pela Evolution API para evitar falsos negativos
const normalizeEvolutionState = (raw: unknown): NormalizedConnectionState => {
  const value = typeof raw === 'string' ? raw.toLowerCase().trim() : '';

  if (['open', 'connected', 'online', 'ready'].includes(value)) return 'connected';
  if (['connecting', 'qr', 'qrcode', 'pairing', 'init', 'starting'].includes(value)) return 'connecting';
  if (['close', 'closed', 'disconnected', 'offline', 'logout', 'logoff'].includes(value)) return 'disconnected';

  return 'disconnected';
};

/**
 * Normaliza e valida número de telefone internacional (E.164)
 * @param raw - Número bruto (pode conter +, espaços, parênteses, etc)
 * @returns Número normalizado (somente dígitos) ou null se inválido
 */
const normalizeAndValidateNumber = (raw?: string | null): { 
  valid: boolean; 
  normalized: string | null; 
  error?: string;
  countryCode?: string;
} => {
  if (!raw) {
    return { valid: false, normalized: null, error: 'Número não fornecido' };
  }

  console.log('[normalizeAndValidateNumber] Input:', raw);

  // Remove todos os caracteres não numéricos
  const digits = raw.replace(/\D/g, '');
  console.log('[normalizeAndValidateNumber] Dígitos extraídos:', digits);

  // Validação de comprimento: E.164 permite 10-15 dígitos
  if (digits.length < 10) {
    return { 
      valid: false, 
      normalized: null, 
      error: `Número muito curto (${digits.length} dígitos). Mínimo: 10 dígitos` 
    };
  }

  if (digits.length > 15) {
    return { 
      valid: false, 
      normalized: null, 
      error: `Número muito longo (${digits.length} dígitos). Máximo: 15 dígitos` 
    };
  }

  // Detectar código de país
  let countryCode: string | undefined;
  let foundValidCode = false;

  // Testar códigos de país de 1 a 3 dígitos
  for (let i = 1; i <= 3 && i <= digits.length; i++) {
    const code = digits.substring(0, i);
    if (VALID_COUNTRY_CODES.includes(code)) {
      countryCode = code;
      foundValidCode = true;
      console.log('[normalizeAndValidateNumber] Código de país detectado:', code);
      break;
    }
  }

  if (!foundValidCode) {
    return { 
      valid: false, 
      normalized: null, 
      error: `Código de país inválido. Número deve começar com código de país válido (ex: 55 para Brasil, 1 para EUA)` 
    };
  }

  console.log('[normalizeAndValidateNumber] ✅ Número válido:', digits, '| País:', countryCode);
  return { valid: true, normalized: digits, countryCode };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!evolutionApiUrl || !evolutionApiKey || !supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(500, {
        success: false,
        error: 'Credenciais da Evolution API ou Supabase ausentes.',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(401, { success: false, error: 'Authorization header required.' });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return jsonResponse(401, { success: false, error: 'Invalid or expired token.' });
    }

    const body: SendTextRequest = await req.json().catch(() => ({}));
    const text = body.text?.trim();
    const requestedInstanceId = body.instance_id || null;

    console.log('[send-evolution-text] Request body:', { number: body.number, text: text?.substring(0, 50), instance_id: requestedInstanceId });

    // Validar número com padrão E.164 internacional
    const numberValidation = normalizeAndValidateNumber(body.number);
    
    if (!numberValidation.valid || !numberValidation.normalized) {
      console.error('[send-evolution-text] ❌ Número inválido:', numberValidation.error);
      return jsonResponse(400, { 
        success: false, 
        error: numberValidation.error || 'Número inválido',
        details: {
          input: body.number,
          reason: numberValidation.error,
        }
      });
    }

    const normalizedNumber = numberValidation.normalized;
    console.log('[send-evolution-text] ✅ Número validado:', normalizedNumber, '| País:', numberValidation.countryCode);

    if (!text) {
      return jsonResponse(400, { success: false, error: 'Mensagem não fornecida.' });
    }

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('phone')
      .eq('auth_user_id', user.id)
      .single();

    if (clienteError || !cliente?.phone) {
      return jsonResponse(400, { success: false, error: 'Cliente não encontrado para este usuário.' });
    }

    const baseQuery = supabase
      .from('evolution_instances')
      .select('*')
      .eq('phone', cliente.phone);

    let instance: EvolutionInstance | null = null;

    if (requestedInstanceId) {
      const { data, error } = await baseQuery.eq('id', requestedInstanceId).maybeSingle();
      if (error) {
        console.error('Erro ao buscar instância específica:', error.message);
        return jsonResponse(400, { success: false, error: 'Falha ao localizar a instância selecionada.' });
      }
      instance = data;
    } else {
      const { data, error } = await baseQuery
        .eq('connection_status', 'connected')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (error) {
        console.error('Erro ao buscar instância conectada:', error.message);
        return jsonResponse(400, { success: false, error: 'Falha ao localizar instância conectada.' });
      }
      instance = Array.isArray(data) ? data[0] : null;
    }

    if (!instance) {
      return jsonResponse(404, { success: false, error: 'Nenhuma instância Evolution encontrada.' });
    }

    if (instance.connection_status !== 'connected') {
      return jsonResponse(409, {
        success: false,
        error: 'Instância desconectada. Conecte-se antes de enviar mensagens.',
      });
    }

    // ⚡ VALIDAÇÃO EM TEMPO REAL: Verificar status da instância na Evolution API
    // Esta validação é opcional - se falhar ou o formato for inesperado, tentamos enviar mesmo assim
    // A Evolution API vai recusar se a conexão realmente estiver fechada
    try {
      const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.instance_name}`, {
        method: 'GET',
        headers: {
          apikey: evolutionApiKey,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();

        // Log completo da resposta para debug
        console.log('[send-evolution-text] Resposta connectionState completa:', JSON.stringify(statusData));

        // Alguns provedores retornam estado em campos diferentes e com capitalização variada
        // Formatos conhecidos:
        // - { instance: { state: "open" } }
        // - { state: "open" }
        // - { instance: { status: "connected" } }
        const rawState = statusData?.instance?.state ?? statusData?.state ?? statusData?.instance?.status ?? statusData?.status;

        console.log('[send-evolution-text] Estado em tempo real:', {
          rawState,
          instance: instance.instance_name,
        });

        // Se rawState é undefined, não podemos determinar o status real
        // Nesse caso, confiamos no DB e tentamos enviar
        if (rawState === undefined || rawState === null) {
          console.log('[send-evolution-text] Estado não detectado na resposta, confiando no status do DB e tentando enviar');
        } else {
          const normalizedState = normalizeEvolutionState(rawState);
          console.log('[send-evolution-text] Estado normalizado:', normalizedState);

          // Se desconectada, atualizar DB e retornar erro específico
          if (normalizedState !== 'connected') {
            const nextStatus = normalizedState === 'connecting' ? 'connecting' : 'disconnected';

            // Atualizar status no DB (sem bloquear o erro)
            supabase
              .from('evolution_instances')
              .update({ connection_status: nextStatus })
              .eq('id', instance.id)
              .then(() => console.log(`Instance ${instance.instance_name} marcada como ${nextStatus}`))
              .catch(err => console.error('Erro ao atualizar status:', err));
            
            return jsonResponse(503, {
              success: false,
              error: `A instância "${instance.display_name || instance.instance_name}" está ${nextStatus === 'connecting' ? 'em reconexão' : 'desconectada'} no WhatsApp. Reconecte e tente novamente.`,
              details: `Status atual (Evolution): ${rawState}`,
            });
          }
        }
      } else {
        console.warn('[send-evolution-text] connectionState retornou status não-ok:', statusResponse.status);
      }
    } catch (statusError) {
      console.warn('[send-evolution-text] Falha ao verificar status em tempo real, continuando com tentativa de envio:', statusError);
      // Continuar mesmo se verificação falhar (API pode estar temporariamente indisponível)
    }

    const payload = {
      number: normalizedNumber,
      text,
    };

    console.log('[send-evolution-text] 📤 Enviando para Evolution API:', {
      instance: instance.instance_name,
      number: normalizedNumber,
      textLength: text.length,
    });

    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instance.instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evolutionApiKey,
      },
      body: JSON.stringify(payload),
    });

    console.log('[send-evolution-text] 📥 Resposta da Evolution API:', response.status, response.statusText);

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Evolution sendText failed:', response.status, responseText);
      
      // Parse do erro da Evolution para mensagem mais clara
      let errorMessage = 'Erro ao enviar mensagem pelo WhatsApp';
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message?.includes('Connection Closed')) {
          errorMessage = `A conexão com o WhatsApp foi fechada. Reconecte a instância "${instance.display_name || instance.instance_name}" e tente novamente.`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Se não conseguir parsear, usar mensagem genérica
        if (responseText.includes('Connection Closed')) {
          errorMessage = `A conexão com o WhatsApp foi fechada. Reconecte a instância e tente novamente.`;
        }
      }
      
      return jsonResponse(502, {
        success: false,
        error: errorMessage,
        technical_details: responseText,
      });
    }

    let parsed: unknown = null;
    try {
      parsed = responseText ? JSON.parse(responseText) : null;
    } catch {
      parsed = responseText;
    }

    return jsonResponse(200, { success: true, data: parsed });
  } catch (error) {
    console.error('send-evolution-text error:', error);
    return jsonResponse(500, { success: false, error: 'Erro interno ao enviar mensagem.' });
  }
});
