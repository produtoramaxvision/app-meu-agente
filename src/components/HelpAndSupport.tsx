"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MessageSquare, Bug, Lightbulb, FileText, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupportDialog } from './SupportDialog';

type HelpAndSupportProps = {
  collapsed?: boolean;
  mode: 'sidebar' | 'floatingAuth';
};

const supportOptions = [
  {
    label: 'Suporte',
    description: 'Crie um ticket de suporte ou acompanhe seus tickets existentes.',
    icon: FileText,
    href: null, // Será tratado como suporte
    type: 'support' as const,
  },
  {
    label: 'Reportar Bug/Erro',
    description: 'Encontrou um problema? Nos avise para que possamos corrigi-lo.',
    icon: Bug,
    href: `mailto:suporte@meuagente.api.br?subject=${encodeURIComponent('Report de Bug - Meu Agente')}`,
    type: 'bug' as const,
  },
  {
    label: 'Sugestões',
    description: 'Tem ideias para melhorar o Meu Agente? Adoraríamos ouvir!',
    icon: Lightbulb,
    href: `mailto:suporte@meuagente.api.br?subject=${encodeURIComponent('Sugestão - Meu Agente')}`,
    type: 'suggestion' as const,
  },
];

export function HelpAndSupport({ collapsed = false, mode }: HelpAndSupportProps) {
  const [open, setOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const handleFormSuccess = (ticketNumber: string) => {
    console.log('Ticket criado:', ticketNumber);
    // Aqui podemos adicionar notificação ou outras ações
  };

  const triggerButton = (
    <Button
      variant="ghost"
      aria-label="Abrir menu de ajuda e suporte"
      className={cn(
        'group relative overflow-hidden flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
        mode === 'sidebar' && 'px-3 py-2.5 text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:scale-105 hover:shadow-lg',
        mode === 'sidebar' && !collapsed && 'justify-start',
        mode === 'sidebar' && collapsed && 'justify-center',
        mode === 'floatingAuth' && 'fixed bottom-6 left-6 h-12 w-12 rounded-full bg-surface shadow-lg border hover:scale-110 hover:bg-surface-hover z-50'
      )}
      size={mode === 'floatingAuth' ? 'icon' : 'default'}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      <HelpCircle className={cn('h-5 w-5 flex-shrink-0 relative z-10 transition-transform group-hover:scale-110', mode === 'floatingAuth' && 'text-text-muted')} />
      {mode === 'sidebar' && !collapsed && <span className="relative z-10">Ajuda</span>}
    </Button>
  );

  const trigger =
    mode === 'sidebar' && collapsed ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Ajuda</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
    );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger}
        <DialogContent className="sm:max-w-lg">
          <div className="relative z-10">
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                Precisa de ajuda?
              </DialogTitle>
              <DialogDescription className="pt-2">
                Se precisar de ajuda ou quiser relatar um problema, aqui estão algumas opções:
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 relative z-10">
              {supportOptions.map((option) => {
                if (option.type === 'support') {
                  return (
                    <button
                      key={option.label}
                      onClick={() => {
                        setShowSupport(true);
                        setOpen(false); // Fechar o modal principal
                      }}
                      className="group relative overflow-hidden rounded-xl border-0 bg-surface-elevated/50 p-4 transition-all duration-300 hover:bg-surface-elevated/80 hover:shadow-lg hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <option.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-foreground">{option.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1 px-2">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                }

                return (
                  <a
                    key={option.label}
                    href={option.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-xl border-0 bg-surface-elevated/50 p-4 transition-all duration-300 hover:bg-surface-elevated/80 hover:shadow-lg hover:scale-[1.02]"
                    onClick={() => setOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <option.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-foreground">{option.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1 px-2">{option.description}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Suporte com Abas */}
      <SupportDialog
        open={showSupport}
        onOpenChange={setShowSupport}
      />
    </>
  );
}