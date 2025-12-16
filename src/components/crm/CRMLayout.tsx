import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, MoreHorizontal, LayoutGrid, List, BarChart3, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

interface CRMLayoutProps {
  children: ReactNode;
  headerStats?: ReactNode;
  viewMode: 'kanban' | 'lista' | 'dashboard';
  onViewChange: (mode: 'kanban' | 'lista' | 'dashboard') => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onExport?: () => void;
}

export function CRMLayout({ children, headerStats, viewMode, onViewChange, searchValue, onSearchChange, onExport }: CRMLayoutProps) {
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
          <div className="relative hidden md:block w-56 lg:w-64 max-w-xs shrink-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              className="pl-8 h-9"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <div className="flex items-center border rounded-md p-1 bg-muted/20">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'group relative h-7 w-7 rounded-md transition-all duration-200',
                'text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:shadow-md',
                viewMode === 'kanban' &&
                  'bg-gradient-to-r from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white shadow-lg'
              )}
              onClick={() => onViewChange('kanban')}
              aria-pressed={viewMode === 'kanban'}
            >
              <LayoutGrid className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'group relative h-7 w-7 rounded-md transition-all duration-200',
                'text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:shadow-md',
                viewMode === 'lista' &&
                  'bg-gradient-to-r from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white shadow-lg'
              )}
              onClick={() => onViewChange('lista')}
              aria-pressed={viewMode === 'lista'}
            >
              <List className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'group relative h-7 w-7 rounded-md transition-all duration-200',
                'text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:shadow-md',
                viewMode === 'dashboard' &&
                  'bg-gradient-to-r from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white shadow-lg'
              )}
              onClick={() => onViewChange('dashboard')}
              aria-pressed={viewMode === 'dashboard'}
            >
              <BarChart3 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </Button>
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

