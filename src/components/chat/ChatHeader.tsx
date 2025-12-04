import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Trash2, MoreVertical, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatHeaderProps {
  onClearHistory: () => void;
  messageCount: number;
  isWebhookConfigured: boolean;
}

export function ChatHeader({
  onClearHistory,
  messageCount,
  isWebhookConfigured,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-bg">
      {/* Agent info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10 ring-2 ring-brand-500/20">
            <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          {/* Status indicator */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${
              isWebhookConfigured ? 'bg-success' : 'bg-warning'
            }`}
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-text">Agente de Scrape</h2>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-brand-500/10 text-brand-600 border-brand-500/20"
            >
              IA
            </Badge>
          </div>
          <p className="text-xs text-text-muted">
            {isWebhookConfigured
              ? 'Online • Pronto para extrair dados'
              : 'Webhook não configurado'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Info tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4 text-text-muted" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">
              O Agente de Scrape pode extrair dados de sites permitidos, 
              buscar em APIs públicas e gerar relatórios em CSV/JSON.
            </p>
          </TooltipContent>
        </Tooltip>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled className="text-xs text-text-muted">
              {messageCount} mensagem{messageCount !== 1 ? 's' : ''} no histórico
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onClearHistory}
              disabled={messageCount === 0}
              className="text-danger focus:text-danger focus:bg-danger-bg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
