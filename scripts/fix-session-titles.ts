/**
 * Script para corrigir títulos de sessões antigas
 * 
 * Este script busca todas as sessões sem título e gera um título
 * baseado na primeira mensagem do usuário.
 * 
 * Uso:
 * npx tsx scripts/fix-session-titles.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (use service role key para permissões admin)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixSessionTitles() {
  try {
    console.log('🔍 Buscando sessões sem título...');
    
    // Buscar todas as sessões sem título
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_ia_sessions')
      .select('id')
      .is('title', null)
      .order('created_at', { ascending: true });

    if (sessionsError) {
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      console.log('✅ Todas as sessões já possuem título!');
      return;
    }

    console.log(`📊 Encontradas ${sessions.length} sessões sem título`);

    let updated = 0;
    let skipped = 0;

    for (const session of sessions) {
      // Buscar a primeira mensagem do usuário nesta sessão
      const { data: messages, error: messagesError } = await supabase
        .from('chat_ia_messages')
        .select('content')
        .eq('session_id', session.id)
        .eq('role', 'user')
        .order('created_at', { ascending: true })
        .limit(1);

      if (messagesError) {
        console.error(`❌ Erro ao buscar mensagens da sessão ${session.id}:`, messagesError);
        skipped++;
        continue;
      }

      if (!messages || messages.length === 0) {
        console.log(`⏭️  Sessão ${session.id} não tem mensagens, pulando...`);
        skipped++;
        continue;
      }

      const firstMessage = messages[0].content;
      const title = firstMessage.trim().slice(0, 50) + (firstMessage.length > 50 ? '...' : '');

      // Atualizar o título da sessão
      const { error: updateError } = await supabase
        .from('chat_ia_sessions')
        .update({ title })
        .eq('id', session.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar sessão ${session.id}:`, updateError);
        skipped++;
        continue;
      }

      console.log(`✅ Sessão ${session.id} atualizada: "${title}"`);
      updated++;
    }

    console.log('\n📊 Resumo:');
    console.log(`  ✅ Atualizadas: ${updated}`);
    console.log(`  ⏭️  Puladas: ${skipped}`);
    console.log(`  📝 Total processadas: ${sessions.length}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar script
fixSessionTitles()
  .then(() => {
    console.log('\n🎉 Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
