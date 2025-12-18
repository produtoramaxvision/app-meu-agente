import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CustomFieldsManager } from './CustomFieldsManager';
import { AutomationsManager } from './AutomationsManager';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { FilterPanel } from './FilterPanel';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, MoreHorizontal, LayoutGrid, List, BarChart3, Download, Settings, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { LeadFilters, FilterPresetKey } from '@/hooks/useLeadFilters';

interface CRMLayoutProps {
  children: ReactNode;
  headerStats?: ReactNode;
  viewMode: 'kanban' | 'lista' | 'dashboard';
  onViewChange: (mode: 'kanban' | 'lista' | 'dashboard') => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onExport?: () => void;
  onNewLead?: () => void;
  filters?: LeadFilters;
  onFiltersChange?: (filters: LeadFilters) => void;
  onClearFilters?: () => void;
  onApplyPreset?: (presetKey: FilterPresetKey) => void;
  activeFiltersCount?: number;
}

export function CRMLayout({ children, headerStats, viewMode, onViewChange, searchValue, onSearchChange, onExport, onNewLead, filters, onFiltersChange, onClearFilters, onApplyPreset, activeFiltersCount }: CRMLayoutProps) {
  const baseControlButtonClasses =
    'group relative h-8 w-8 rounded-md transition-all duration-300 ease-out text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const iconAnimationClasses =
    'h-4 w-4 transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[hsl(var(--sidebar-bg))]">
      {/* CRM Header */}
      <div className="border-b px-4 md:px-6 h-[74px] min-h-[74px] flex items-center justify-between gap-4 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent whitespace-nowrap">
            Pipeline
          </h1>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3 min-w-0">
            {headerStats}
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          {/* FilterPanel - Renderizado condicionalmente se props existirem */}
          {filters && onFiltersChange && onClearFilters && (
            <FilterPanel
              filters={filters}
              onFiltersChange={onFiltersChange}
              onClearFilters={onClearFilters}
              onApplyPreset={onApplyPreset}
              activeFiltersCount={activeFiltersCount || 0}
            />
          )}

          <div className="relative hidden md:block w-56 lg:w-64 max-w-xs shrink-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              className="pl-8 pr-8 h-9"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 rounded-md hover:bg-muted"
                onClick={() => onSearchChange('')}
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center border rounded-md p-1 bg-muted/20">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                baseControlButtonClasses,
                viewMode === 'kanban' &&
                  'bg-gradient-to-r from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white shadow-lg'
              )}
              onClick={() => onViewChange('kanban')}
              aria-pressed={viewMode === 'kanban'}
            >
              <LayoutGrid className={iconAnimationClasses} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                baseControlButtonClasses,
                viewMode === 'dashboard' &&
                  'bg-gradient-to-r from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white shadow-lg'
              )}
              onClick={() => onViewChange('dashboard')}
              aria-pressed={viewMode === 'dashboard'}
            >
              <BarChart3 className={iconAnimationClasses} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                baseControlButtonClasses,
                viewMode === 'lista' &&
                  'bg-gradient-to-r from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white shadow-lg'
              )}
              onClick={() => onViewChange('lista')}
              aria-pressed={viewMode === 'lista'}
            >
              <List className={iconAnimationClasses} />
            </Button>
            
            {/* Automations Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    baseControlButtonClasses
                  )}
                  title="Automações"
                >
                  <Zap className={iconAnimationClasses} />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Automações do CRM</SheetTitle>
                </SheetHeader>
                <div className="py-6">
                  <AutomationsManager />
                </div>
              </SheetContent>
            </Sheet>

            {/* Settings Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    baseControlButtonClasses
                  )}
                  title="Configurações"
                >
                  <Settings className={cn(iconAnimationClasses, 'group-hover:rotate-90')} />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Configurações do CRM</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Campos Personalizados</h3>
                    <CustomFieldsManager />
                  </div>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Notificações em Tempo Real</h3>
                    <NotificationSettings />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {onExport && (
            <Button
              size="sm"
              variant="outline"
              className="hidden md:flex items-center gap-2"
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'group relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              'text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:shadow-md'
            )}
            onClick={onNewLead}
          >
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
            <motion.span
              initial={false}
              className="hidden sm:inline transition-transform duration-200 group-hover:translate-x-0.5"
            >
              Novo Lead
            </motion.span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-[hsl(var(--sidebar-bg))]">
        {children}
      </div>
    </div>
  );
}

