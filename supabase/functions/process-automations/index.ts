// Edge Function para processar automações do CRM
// Invocada via cron job ou trigger de evento
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Automation {
  id: string;
  cliente_phone: string;
  name: string;
  is_active: boolean;
  trigger_type: "status_change" | "time_in_status" | "value_threshold" | "no_interaction";
  trigger_config: Record<string, unknown>;
  action_type: "create_task" | "send_notification" | "update_field" | "send_whatsapp";
  action_config: Record<string, unknown>;
  trigger_count: number;
}

interface Lead {
  id: string;
  phone: string;
  remote_jid: string;
  push_name: string | null;
  crm_lead_status: string | null;
  crm_estimated_value: number | null;
  crm_last_interaction_at: string | null;
  updated_at: string;
}

interface ProcessingResult {
  automation_id: string;
  automation_name: string;
  leads_processed: number;
  actions_executed: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for event-triggered automations
    let eventData: { type?: string; lead_id?: string; old_status?: string; new_status?: string } | null = null;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        eventData = body;
      } catch {
        // No body provided - process time-based automations
      }
    }

    const results: ProcessingResult[] = [];

    // Fetch all active automations
    const { data: automations, error: automationsError } = await supabase
      .from("crm_automations")
      .select("*")
      .eq("is_active", true);

    if (automationsError) {
      throw new Error(`Failed to fetch automations: ${automationsError.message}`);
    }

    if (!automations || automations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active automations found", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process each automation
    for (const automation of automations as Automation[]) {
      const result: ProcessingResult = {
        automation_id: automation.id,
        automation_name: automation.name,
        leads_processed: 0,
        actions_executed: 0,
        errors: [],
      };

      try {
        // Fetch leads for this client
        const { data: leads, error: leadsError } = await supabase
          .from("evolution_contacts")
          .select("id, phone, remote_jid, push_name, crm_lead_status, crm_estimated_value, crm_last_interaction_at, updated_at")
          .eq("phone", automation.cliente_phone)
          .eq("is_group", false);

        if (leadsError) {
          result.errors.push(`Failed to fetch leads: ${leadsError.message}`);
          results.push(result);
          continue;
        }

        if (!leads || leads.length === 0) {
          results.push(result);
          continue;
        }

        // Filter leads based on trigger type
        const matchingLeads = filterLeadsByTrigger(
          leads as Lead[],
          automation,
          eventData
        );

        result.leads_processed = matchingLeads.length;

        // Execute actions for matching leads
        for (const lead of matchingLeads) {
          try {
            await executeAction(supabase, automation, lead);
            result.actions_executed++;
          } catch (actionError) {
            result.errors.push(
              `Action failed for lead ${lead.id}: ${actionError instanceof Error ? actionError.message : String(actionError)}`
            );
          }
        }

        // Update automation stats
        if (result.actions_executed > 0) {
          await supabase
            .from("crm_automations")
            .update({
              last_triggered_at: new Date().toISOString(),
              trigger_count: automation.trigger_count + result.actions_executed,
            })
            .eq("id", automation.id);
        }
      } catch (error) {
        result.errors.push(
          `Processing failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      results.push(result);
    }

    const summary = {
      total_automations: automations.length,
      total_leads_processed: results.reduce((acc, r) => acc + r.leads_processed, 0),
      total_actions_executed: results.reduce((acc, r) => acc + r.actions_executed, 0),
      total_errors: results.reduce((acc, r) => acc + r.errors.length, 0),
      results,
    };

    console.log("Automations processed:", JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing automations:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

/**
 * Filtra leads baseado no tipo de trigger da automação
 */
function filterLeadsByTrigger(
  leads: Lead[],
  automation: Automation,
  eventData: { type?: string; lead_id?: string; old_status?: string; new_status?: string } | null
): Lead[] {
  const config = automation.trigger_config;

  switch (automation.trigger_type) {
    case "status_change": {
      // Se temos eventData, verificar se é uma mudança de status válida
      if (eventData?.type === "status_change") {
        const fromStatus = config.from_status as string | undefined;
        const toStatus = config.to_status as string | undefined;

        // Verificar se a mudança corresponde ao trigger
        const fromMatches = !fromStatus || fromStatus === eventData.old_status;
        const toMatches = !toStatus || toStatus === eventData.new_status;

        if (fromMatches && toMatches && eventData.lead_id) {
          return leads.filter((l) => l.id === eventData.lead_id);
        }
      }
      return [];
    }

    case "time_in_status": {
      const targetStatus = config.status as string;
      const days = config.days as number;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return leads.filter((lead) => {
        if (lead.crm_lead_status !== targetStatus) return false;
        const updatedAt = new Date(lead.updated_at);
        return updatedAt < cutoffDate;
      });
    }

    case "value_threshold": {
      const minValue = config.min_value as number | undefined;
      const maxValue = config.max_value as number | undefined;

      return leads.filter((lead) => {
        const value = lead.crm_estimated_value ?? 0;
        if (minValue !== undefined && value < minValue) return false;
        if (maxValue !== undefined && value > maxValue) return false;
        return true;
      });
    }

    case "no_interaction": {
      const days = config.days as number;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return leads.filter((lead) => {
        if (!lead.crm_last_interaction_at) return true; // Nunca interagiu
        const lastInteraction = new Date(lead.crm_last_interaction_at);
        return lastInteraction < cutoffDate;
      });
    }

    default:
      return [];
  }
}

/**
 * Executa a ação da automação para um lead específico
 */
async function executeAction(
  supabase: ReturnType<typeof createClient>,
  automation: Automation,
  lead: Lead
): Promise<void> {
  const config = automation.action_config;
  const leadName = lead.push_name || lead.remote_jid.split("@")[0];

  // Substituir placeholders nos textos
  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/\{\{name\}\}/g, leadName)
      .replace(/\{\{phone\}\}/g, lead.remote_jid.split("@")[0])
      .replace(/\{\{status\}\}/g, lead.crm_lead_status || "novo")
      .replace(/\{\{value\}\}/g, String(lead.crm_estimated_value || 0));
  };

  switch (automation.action_type) {
    case "create_task": {
      const title = replacePlaceholders(config.title as string || "Tarefa automática");
      const description = replacePlaceholders(config.description as string || "");
      const priority = config.priority as string || "medium";
      
      // Calcular due_date baseado em days_offset (se configurado)
      const daysOffset = config.days_offset as number || 0;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset);

      const { error } = await supabase.from("tasks").insert({
        phone: automation.cliente_phone,
        title,
        description,
        priority,
        status: "pending",
        due_date: dueDate.toISOString(),
        lead_remote_jid: lead.remote_jid,
      });

      if (error) throw new Error(`Failed to create task: ${error.message}`);
      break;
    }

    case "send_notification": {
      const message = replacePlaceholders(config.message as string || "Nova notificação");
      const tipo = config.type as string || "info";

      const { error } = await supabase.from("notifications").insert({
        phone: automation.cliente_phone,
        tipo,
        titulo: automation.name,
        mensagem: message,
        lida: false,
        data: {
          automation_id: automation.id,
          lead_id: lead.id,
          lead_name: leadName,
        },
      });

      if (error) throw new Error(`Failed to send notification: ${error.message}`);
      break;
    }

    case "update_field": {
      const fieldKey = config.field_key as string;
      const value = replacePlaceholders(config.value as string || "");

      // Se é um campo CRM nativo
      if (fieldKey.startsWith("crm_")) {
        const { error } = await supabase
          .from("evolution_contacts")
          .update({ [fieldKey]: value })
          .eq("id", lead.id);

        if (error) throw new Error(`Failed to update field: ${error.message}`);
      } else {
        // É um custom field
        const { error } = await supabase.from("custom_fields_values").upsert(
          {
            contact_id: lead.id,
            field_key: fieldKey,
            value: JSON.stringify(value),
          },
          { onConflict: "contact_id,field_key" }
        );

        if (error) throw new Error(`Failed to update custom field: ${error.message}`);
      }
      break;
    }

    case "send_whatsapp": {
      const template = replacePlaceholders(config.template as string || "Olá {{name}}!");
      const instanceId = config.instance_id as string;

      if (!instanceId) {
        throw new Error("Instance ID not configured for WhatsApp action");
      }

      // Buscar token da instância
      const { data: instance, error: instanceError } = await supabase
        .from("evolution_instances")
        .select("instance_name, instance_token")
        .eq("id", instanceId)
        .single();

      if (instanceError || !instance) {
        throw new Error(`Instance not found: ${instanceError?.message || "Unknown"}`);
      }

      // Invocar Edge Function de envio
      const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
      const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

      if (!evolutionApiUrl || !evolutionApiKey) {
        throw new Error("Evolution API not configured");
      }

      const response = await fetch(
        `${evolutionApiUrl}/message/sendText/${instance.instance_name}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey,
          },
          body: JSON.stringify({
            number: lead.remote_jid.replace("@s.whatsapp.net", ""),
            text: template,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send WhatsApp: ${errorText}`);
      }
      break;
    }
  }

  // Registrar atividade no histórico
  await supabase.from("crm_activities").insert({
    contact_id: lead.id,
    phone: automation.cliente_phone,
    activity_type: "note_added",
    title: `Automação executada: ${automation.name}`,
    description: `Ação "${automation.action_type}" executada automaticamente`,
    metadata: {
      automation_id: automation.id,
      action_type: automation.action_type,
    },
  });
}
