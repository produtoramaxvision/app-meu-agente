# 📋 Plano de Implantação — Cupom Influencer (30% off) com Comissão Pós-Arrependimento

## 🎯 Objetivo
Permitir que um influenciador divulgue um cupom de 30% de desconto. Pagar comissão somente sobre assinaturas que permanecerem ativas após o período de arrependimento de 7 dias (CDC).

## 🧭 Escopo
- Criar cupom e promotion code dedicados ao influenciador.
- Rastrear uso via metadata no Stripe (checkout/subscription) e armazenar no banco.
- Calcular comissão apenas para faturas pagas e não reembolsadas após 7 dias.
- Evitar contagem de tentativas que foram reembolsadas ou canceladas no período de arrependimento.

## 🔧 Configuração no Stripe
1) Criar cupom 30% (primeira fatura ou recorrente):
- Apenas 1ª fatura: `duration=once`
- Recorrente: `duration=forever` (ou `repeating` se quiser limitar meses)
```
stripe coupons create ^
  --id=influencer30 ^
  --percent-off=30 ^
  --duration=once ^
  --max-redemptions=1000
```

2) Criar promotion code exclusivo para o influenciador:
```
stripe promotion_codes create ^
  --coupon=influencer30 ^
  --code=INFLUENCER30 ^
  --max-redemptions=1000
```

## 🧩 Integração (Checkout / Assinatura)
- No checkout (ou criação de assinatura), aplicar `promotion_code=INFLUENCER30`.
- Incluir metadata:
  - `influencer_code=INFLUENCER30`
  - `source=influencer`
  - `plan_id=<basic|business|premium>`
  - `refund_period_start=<ISO>` (já existente no fluxo de arrependimento)
- Manter o período de arrependimento de 7 dias (já implementado via `refund_period_ends_at` no backend/banco).

## 🔔 Webhooks recomendados
- `checkout.session.completed`
  - Persistir no banco: `customer_id`, `subscription_id`, `promotion_code`, `amount_total`, `refund_period_ends_at = now + 7d`.
- `invoice.payment_succeeded`
  - Gravar fatura paga. Se `now > refund_period_ends_at` e `refunded = false`, marcar fatura como comissionável.
- `charge.refunded` / `invoice.payment_failed`
  - Marcar registro como não comissionável (ou zerar valor comissionável).

## 🗃️ Modelo de dados sugerido (tabela local)
- `influencer_commissions` (ou similar):
  - `id`
  - `customer_id`
  - `subscription_id`
  - `invoice_id`
  - `promotion_code`
  - `amount_paid` (após desconto)
  - `discount_amount` (opcional, para auditoria)
  - `refund_period_ends_at`
  - `is_refunded` (bool)
  - `is_commissionable` (bool)
  - `processed_at` (quando virou comissionável)

## 🧮 Cálculo de comissão (exemplo)
- Base: `amount_paid` de invoices com `is_commissionable = true` e `is_refunded = false`.
- Comissão: `commission_value = amount_paid * commission_rate` (ex.: 20%).
- Se o cupom for `duration=once`, a comissão incide só na 1ª fatura. Se `forever`, repetir por faturas subsequentes (cada uma checa 7 dias pós-pagamento antes de contar).

## ⏱️ Job diário (pós 7 dias)
- Selecionar registros com `now > refund_period_ends_at`, `is_refunded = false`, `is_commissionable = false`.
- Marcar `is_commissionable = true` e registrar `processed_at`.
- Gerar somatório para pagamento do influenciador.

## ✅ Testes mínimos (modo teste)
- Checkout com `INFLUENCER30`, pagar com cartão teste.
- Verificar no banco: `refund_period_ends_at` preenchido e metadata armazenada.
- Simular reembolso (`charge.refunded`) e checar que `is_commissionable` fica falso/zerado.
- Simular passagem de 7 dias: job deve marcar `is_commissionable = true`.
- Verificar somatório de comissão com fatura paga e não reembolsada.

## 📊 Observabilidade
- Logs das funções: `stripe-webhook`, `create-checkout-session`.
- Dash Stripe: cupons/promotion codes (campo `times_redeemed`).
- Relatórios customizados: invoices filtrados por `promotion_code`.

## 🛡️ Pontos de atenção
- Não contar faturas reembolsadas ou canceladas dentro dos 7 dias.
- Se usar `duration=forever`, comissão poderá ser recorrente; se não quiser, prefira `duration=once`.
- Limitar `max_redemptions` do promotion code para controlar campanhas. 

