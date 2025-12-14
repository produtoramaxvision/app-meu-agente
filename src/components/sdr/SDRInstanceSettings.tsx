// =============================================================================
// SDR Instance Settings Component
// Configurações avançadas da instância Evolution API com toggles modernos
// =============================================================================

import { useState, useEffect } from 'react'
import { 
  Settings2, 
  PhoneOff, 
  Users, 
  Wifi, 
  Eye, 
  MessageSquare,
  History,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { EvolutionSettings } from '@/types/sdr'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface SDRInstanceSettingsProps {
  instanceId: string
  instanceName: string
  isConnected: boolean
  className?: string
}

interface SettingItemProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  badge?: 'recommended' | 'optional'
}

function SettingItem({ 
  icon, 
  label, 
  description, 
  checked, 
  onCheckedChange, 
  disabled,
  badge
}: SettingItemProps) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
      "bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/30",
      "hover:from-slate-100/70 dark:hover:from-slate-800/50",
      "border border-transparent hover:border-slate-200 dark:hover:border-slate-700",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <div className="flex items-start gap-3 flex-1">
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          checked 
            ? "bg-primary/10 text-primary" 
            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
        )}>
          {icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Label 
              className={cn(
                "font-medium text-sm cursor-pointer",
                disabled && "cursor-not-allowed"
              )}
            >
              {label}
            </Label>
            {badge === 'recommended' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                Recomendado
              </span>
            )}
            {badge === 'optional' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                Opcional
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="ml-4 data-[state=checked]:bg-primary"
      />
    </div>
  )
}

export function SDRInstanceSettings({ 
  instanceId,
  instanceName, 
  isConnected,
  className 
}: SDRInstanceSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Estado das configurações
  const [settings, setSettings] = useState<EvolutionSettings>({
    rejectCall: true,
    msgCall: 'Não aceitamos chamadas. Por favor, envie uma mensagem de texto.',
    groupsIgnore: true,
    alwaysOnline: false,
    readMessages: true,
    readStatus: false,
    syncFullHistory: false,
  })
  
  // Estado inicial para comparação
  const [initialSettings, setInitialSettings] = useState<EvolutionSettings | null>(null)

  // Detectar mudanças
  useEffect(() => {
    if (initialSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(initialSettings)
      setHasChanges(changed)
    }
  }, [settings, initialSettings])

  // Carregar settings atuais da Evolution por instância
  useEffect(() => {
    if (!isConnected) return
    if (!instanceId || !instanceName) return

    let cancelled = false
    setIsLoading(true)
    setHasChanges(false)

    ;(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        if (!token) throw new Error('Não autenticado')

        const { data, error } = await supabase.functions.invoke('get-evolution-settings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            instance_id: instanceId,
          },
        })

        if (error) throw new Error(error.message)
        if (!data?.success) throw new Error(data?.error || 'Falha ao carregar configurações')

        const next = data.settings as EvolutionSettings
        if (!cancelled && next) {
          setSettings(next)
          setInitialSettings(next)
          setHasChanges(false)
        }
      } catch (err) {
        console.error('Error loading settings:', err)
        if (!cancelled) {
          toast.error('Erro ao carregar configurações', {
            description: err instanceof Error ? err.message : 'Não foi possível carregar as configurações da instância.',
          })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [instanceId, instanceName, isConnected])

  // Handler genérico para updates
  const handleSettingChange = (key: keyof EvolutionSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Salvar configurações
  const handleSave = async () => {
    if (!instanceId || !instanceName) return
    
    setIsSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.access_token) {
        throw new Error('Não autenticado')
      }

      const response = await supabase.functions.invoke('update-evolution-settings', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: {
          instance_id: instanceId,
          settings: {
            rejectCall: settings.rejectCall,
            msgCall: settings.msgCall,
            groupsIgnore: settings.groupsIgnore,
            alwaysOnline: settings.alwaysOnline,
            readMessages: settings.readMessages,
            readStatus: settings.readStatus,
            syncFullHistory: settings.syncFullHistory,
          }
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      setInitialSettings({ ...settings })
      setHasChanges(false)
      
      toast.success('Configurações salvas', {
        description: 'As configurações da instância foram atualizadas com sucesso.',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Erro ao salvar', {
        description: error instanceof Error ? error.message : 'Não foi possível salvar as configurações.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset para estado inicial
  const handleReset = () => {
    if (initialSettings) {
      setSettings({ ...initialSettings })
    }
  }

  if (!isConnected) {
    return (
      <div className={cn(
        "p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900",
        className
      )}>
        <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">
            Conecte o WhatsApp para acessar as configurações avançadas
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "space-y-4",
      className
    )}>
      {/* Settings Grid */}

      {/* Settings Grid */}
      <div className="space-y-2">
        <SettingItem
          icon={<PhoneOff className="h-4 w-4" />}
          label="Rejeitar Chamadas"
          description="Rejeita automaticamente chamadas de voz e vídeo no WhatsApp"
          checked={settings.rejectCall}
          onCheckedChange={(checked) => handleSettingChange('rejectCall', checked)}
          disabled={isLoading}
          badge="recommended"
        />

        {settings.rejectCall && (
          <div className="ml-14 mr-4 mb-2">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Mensagem ao rejeitar chamada
            </Label>
            <Input
              value={settings.msgCall}
              onChange={(e) => handleSettingChange('msgCall', e.target.value)}
              placeholder="Mensagem automática..."
              className="h-9 text-sm"
              disabled={isLoading}
            />
          </div>
        )}

        <SettingItem
          icon={<Users className="h-4 w-4" />}
          label="Ignorar Grupos"
          description="Ignora todas as mensagens recebidas em grupos do WhatsApp"
          checked={settings.groupsIgnore}
          onCheckedChange={(checked) => handleSettingChange('groupsIgnore', checked)}
          disabled={isLoading}
          badge="recommended"
        />

        <SettingItem
          icon={<Wifi className="h-4 w-4" />}
          label="Sempre Online"
          description="Mantém o status do WhatsApp sempre como online"
          checked={settings.alwaysOnline}
          onCheckedChange={(checked) => handleSettingChange('alwaysOnline', checked)}
          disabled={isLoading}
          badge="optional"
        />

        <SettingItem
          icon={<MessageSquare className="h-4 w-4" />}
          label="Marcar como Lido"
          description="Marca mensagens recebidas como lidas automaticamente"
          checked={settings.readMessages}
          onCheckedChange={(checked) => handleSettingChange('readMessages', checked)}
          disabled={isLoading}
          badge="recommended"
        />

        <SettingItem
          icon={<Eye className="h-4 w-4" />}
          label="Visualizar Status"
          description="Permite que o bot visualize os status dos seus contatos"
          checked={settings.readStatus}
          onCheckedChange={(checked) => handleSettingChange('readStatus', checked)}
          disabled={isLoading}
        />

        <SettingItem
          icon={<History className="h-4 w-4" />}
          label="Sincronizar Histórico"
          description="Sincroniza o histórico completo de mensagens (pode ser lento)"
          checked={settings.syncFullHistory}
          onCheckedChange={(checked) => handleSettingChange('syncFullHistory', checked)}
          disabled={isLoading}
          badge="optional"
        />
      </div>

      {/* Info Footer */}
      <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Essas configurações são aplicadas diretamente na sua instância WhatsApp. 
          Alterações podem levar alguns segundos para serem refletidas.
        </p>
      </div>

      {/* Action Buttons - Bottom Right */}
      {hasChanges && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Salvar
          </Button>
        </div>
      )}
    </div>
  )
}
