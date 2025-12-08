// =============================================================================
// Edge Function: disconnect-evolution-instance
// Desconecta e deleta uma instância Evolution API
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obter variáveis de ambiente
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API credentials not configured')
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Obter usuário autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Buscar telefone do usuário
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('phone')
      .eq('auth_user_id', user.id)
      .single()

    if (clienteError || !cliente) {
      throw new Error('Cliente not found')
    }

    // Buscar instância do usuário
    const { data: instance, error: instanceError } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('phone', cliente.phone)
      .single()

    if (instanceError || !instance) {
      throw new Error('No instance found for this user')
    }

    console.log('Disconnecting and deleting instance:', instance.instance_name)

    // Deletar instância na Evolution API
    const deleteResponse = await fetch(
      `${evolutionApiUrl}/instance/delete/${instance.instance_name}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': evolutionApiKey,
        },
      }
    )

    // Se não for 200 ou 404 (já deletada), logar erro mas continuar
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const errorText = await deleteResponse.text()
      console.error('Failed to delete instance from Evolution API:', errorText)
      // Continua para limpar registro local mesmo se falhar na API
    } else {
      console.log('✅ Instance deleted from Evolution API')
    }

    // Deletar registro do banco local
    const { error: deleteDbError } = await supabase
      .from('evolution_instances')
      .delete()
      .eq('id', instance.id)

    if (deleteDbError) {
      console.error('Failed to delete instance from database:', deleteDbError)
      throw new Error('Failed to delete instance from database')
    }

    // Deletar configuração SDR associada
    const { error: deleteConfigError } = await supabase
      .from('sdr_agent_config')
      .delete()
      .eq('instance_id', instance.id)

    if (deleteConfigError && deleteConfigError.code !== '23503') { // Ignore foreign key errors
      console.error('Failed to delete SDR config:', deleteConfigError)
    }

    console.log('✅ Instance disconnected and cleaned up successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instance disconnected successfully',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
