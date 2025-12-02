"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { SupportFormTab, SupportTicketsTab } from './SupportTabs';
import { SupportFAQ } from './SupportFAQ';
import { useSupportTickets, getSupportSLA } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { FileText, List, HelpCircle } from 'lucide-react';

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [activeTab, setActiveTab] = useState('form');
  const { cliente } = useAuth();
  const { supportPlanInfo } = useSupportTickets();

  // Obter SLA do plano atual
  const currentSLA = cliente?.plan_id ? getSupportSLA(cliente.plan_id) : getSupportSLA('free');

  const handleFormSuccess = (ticketNumber: string) => {
    console.log('Ticket criado:', ticketNumber);
    // Mudar para a aba de tickets após criar um ticket
    setActiveTab('tickets');
  };

  const handleFAQSelect = (question: string) => {
    console.log('Pergunta selecionada:', question);
    // Mudar para a aba de formulário com a pergunta pré-preenchida
    setActiveTab('form');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] sm:h-[90vh] sm:max-h-[90vh] overflow-y-auto p-0 gap-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-col h-full">
          {/* Header fixo */}
          <div className="flex-shrink-0 p-6 border-b border-border/40 bg-surface/50 backdrop-blur-xl sticky top-0 z-20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                Suporte
              </DialogTitle>
              <DialogDescription className="pl-12">
                Precisa de ajuda? Crie um ticket ou acompanhe seus tickets existentes.
              </DialogDescription>
              
              {/* Informações de SLA */}
              <div className="bg-surface-elevated/50 border border-border/50 rounded-xl p-4 mt-6 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground text-sm flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                        {cliente?.plan_id === 'premium' ? 'Plano Premium' : cliente?.plan_id === 'business' ? 'Plano Business' : cliente?.plan_id === 'basic' ? 'Plano Básico' : 'Plano Gratuito'}
                      </Badge>
                      Seu Plano de Suporte
                    </h3>
                    <p className="text-xs text-muted-foreground pl-1">{currentSLA.description}</p>
                  </div>
                  <div className="text-left sm:text-right bg-background/50 p-2 rounded-lg border border-border/30">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Tempo de resposta estimado</p>
                    <Badge 
                      variant={currentSLA.priority === 'critical' ? 'destructive' : 
                              currentSLA.priority === 'high' ? 'default' : 
                              currentSLA.priority === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs font-medium shadow-sm"
                      data-testid="plan-badge"
                    >
                      {currentSLA.responseTime}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/30">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tabs fixas */}
              <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-surface-elevated/80 border border-border/40 backdrop-blur-sm rounded-xl mb-6" data-testid="support-tabs-list" aria-label="Opções de suporte">
                <TabsTrigger 
                  value="form" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all" 
                  data-testid="new-ticket-tab"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Criar novo ticket de suporte"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Novo Ticket</span>
                  <span className="sm:hidden">Novo</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tickets" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all" 
                  data-testid="my-tickets-tab"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Ver meus tickets de suporte"
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Meus Tickets</span>
                  <span className="sm:hidden">Tickets</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="faq" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all" 
                  data-testid="faq-tab"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Perguntas frequentes"
                >
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  FAQ
                </TabsTrigger>
              </TabsList>
              
              {/* Conteúdo das tabs */}
              <TabsContent value="form" className="space-y-4 focus-visible:ring-0 focus-visible:outline-none">
                <SupportFormTab onSuccess={handleFormSuccess} />
              </TabsContent>
              
              <TabsContent value="tickets" className="space-y-4 focus-visible:ring-0 focus-visible:outline-none">
                <SupportTicketsTab />
              </TabsContent>
              
              <TabsContent value="faq" className="space-y-4 focus-visible:ring-0 focus-visible:outline-none">
                <SupportFAQ onSelectQuestion={handleFAQSelect} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
