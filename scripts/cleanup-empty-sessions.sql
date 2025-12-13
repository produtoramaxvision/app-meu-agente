-- =================================================================
-- SCRIPT PARA LIMPAR CONVERSAS VAZIAS (SEM MENSAGENS)
-- =================================================================
-- Execute este script no Supabase SQL Editor para remover
-- todas as conversas que não possuem nenhuma mensagem.
-- 
-- Para usar:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script
-- =================================================================

-- Ver quantas conversas vazias existem antes de deletar
SELECT 
  s.id,
  s.phone,
  s.title,
  s.created_at,
  COUNT(m.id) as message_count
FROM chat_ia_sessions s
LEFT JOIN chat_ia_messages m ON m.session_id = s.id
GROUP BY s.id, s.phone, s.title, s.created_at
HAVING COUNT(m.id) = 0
ORDER BY s.created_at DESC;

-- Após confirmar, descomente as linhas abaixo para deletar
-- CUIDADO: Esta ação é irreversível!

/*
DELETE FROM chat_ia_sessions
WHERE id IN (
  SELECT s.id
  FROM chat_ia_sessions s
  LEFT JOIN chat_ia_messages m ON m.session_id = s.id
  GROUP BY s.id
  HAVING COUNT(m.id) = 0
);
*/

-- Para deletar apenas de um usuário específico:
/*
DELETE FROM chat_ia_sessions
WHERE phone = '5511949746110'  -- Substituir pelo telefone desejado
AND id IN (
  SELECT s.id
  FROM chat_ia_sessions s
  LEFT JOIN chat_ia_messages m ON m.session_id = s.id
  WHERE s.phone = '5511949746110'
  GROUP BY s.id
  HAVING COUNT(m.id) = 0
);
*/
