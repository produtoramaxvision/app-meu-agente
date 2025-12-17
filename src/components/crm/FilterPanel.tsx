import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useMediaQuery } from '@/hooks/use-media-query';
import { LeadFilters, FILTER_PRESETS, FilterPresetKey } from '@/hooks/useLeadFilters';
import { LeadStatus } from '@/types/sdr';
import { Filter, X, CalendarIcon, Zap, DollarSign, Clock, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilterPanelProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  onClearFilters: () => void;
  onApplyPreset?: (presetKey: FilterPresetKey) => void;
  activeFiltersCount: number;
}

/**
 * Opções de status disponíveis
 */
const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'novo', label: 'Novo', color: 'bg-blue-500' },
  { value: 'contatado', label: 'Contatado', color: 'bg-purple-500' },
  { value: 'qualificado', label: 'Qualificado', color: 'bg-cyan-500' },
  { value: 'proposta', label: 'Proposta', color: 'bg-amber-500' },
  { value: 'negociando', label: 'Negociando', color: 'bg-orange-500' },
  { value: 'ganho', label: 'Ganho', color: 'bg-green-500' },
  { value: 'perdido', label: 'Perdido', color: 'bg-red-500' },
];

/**
 * Ícones dos presets
 */
const PRESET_ICONS: Record<FilterPresetKey, React.ReactNode> = {
  all: <Layers className="h-4 w-4" />,
  hot: <Zap className="h-4 w-4" />,
  highValue: <DollarSign className="h-4 w-4" />,
  needFollowup: <Clock className="h-4 w-4" />,
};

/**
 * Componente interno com os filtros
 */
function FilterContent({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  onApplyPreset,
  onClose 
}: FilterPanelProps & { onClose?: () => void }) {
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters);

  // Handlers para atualizar filtros locais
  const handleStatusToggle = (status: LeadStatus) => {
    const newStatus = localFilters.status.includes(status)
      ? localFilters.status.filter(s => s !== status)
      : [...localFilters.status, status];
    
    setLocalFilters(prev => ({ ...prev, status: newStatus }));
  };

  const handlePresetClick = (presetKey: FilterPresetKey) => {
    if (onApplyPreset) {
      onApplyPreset(presetKey);
      onClose?.();
    }
  };

  const handleScoreChange = (value: number[]) => {
    setLocalFilters(prev => ({ ...prev, scoreRange: [value[0], value[1]] as [number, number] }));
  };

  const handleValueChange = (value: number[]) => {
    setLocalFilters(prev => ({ ...prev, valueRange: [value[0], value[1]] as [number, number] }));
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setLocalFilters(prev => ({ ...prev, dateRange: range }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose?.();
  };

  const handleClear = () => {
    onClearFilters();
    onClose?.();
  };

  // Formatação de valores
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Presets Rápidos */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Visualizações Rápidas</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FILTER_PRESETS) as FilterPresetKey[]).map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(key)}
              className="justify-start"
            >
              {PRESET_ICONS[key]}
              <span className="ml-2 text-xs">{FILTER_PRESETS[key].name}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Filtro de Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${option.value}`}
                checked={localFilters.status.includes(option.value)}
                onCheckedChange={() => handleStatusToggle(option.value)}
              />
              <label
                htmlFor={`status-${option.value}`}
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <div className={cn('h-2 w-2 rounded-full', option.color)} />
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Filtro de Score */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Score do Lead</Label>
          <span className="text-xs text-muted-foreground">
            {localFilters.scoreRange[0]} - {localFilters.scoreRange[1]}
          </span>
        </div>
        <Slider
          value={localFilters.scoreRange}
          onValueChange={handleScoreChange}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Congelado (0)</span>
          <span>Quente (100)</span>
        </div>
      </div>

      <Separator />

      {/* Filtro de Valor Estimado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Valor Estimado</Label>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(localFilters.valueRange[0])} - {formatCurrency(localFilters.valueRange[1])}
          </span>
        </div>
        <Slider
          value={localFilters.valueRange}
          onValueChange={handleValueChange}
          min={0}
          max={10000000} // R$ 100.000,00 em centavos
          step={50000} // R$ 500,00
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>R$ 0</span>
          <span>R$ 100k+</span>
        </div>
      </div>

      <Separator />

      {/* Filtro de Data */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Data de Criação</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !localFilters.dateRange.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {localFilters.dateRange.from ? (
                localFilters.dateRange.to ? (
                  <>
                    {format(localFilters.dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                    {format(localFilters.dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                  </>
                ) : (
                  format(localFilters.dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                )
              ) : (
                'Selecione um período'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: localFilters.dateRange.from,
                to: localFilters.dateRange.to,
              }}
              onSelect={(range) => handleDateRangeChange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Botões de ação (mobile usa DrawerFooter) */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleApply} className="flex-1">
          Aplicar Filtros
        </Button>
        <Button onClick={handleClear} variant="outline" size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Componente principal do painel de filtros
 * Responsivo: Popover no desktop, Drawer no mobile
 */
export function FilterPanel(props: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Desktop: Popover
  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Filter className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Filtros</span>
            {props.activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {props.activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filtros</h4>
              {props.activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {props.activeFiltersCount} ativos
                </Badge>
              )}
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <FilterContent {...props} onClose={() => setOpen(false)} />
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Filter className="h-4 w-4" />
          {props.activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {props.activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center justify-between">
            Filtros
            {props.activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {props.activeFiltersCount} ativos
              </Badge>
            )}
          </DrawerTitle>
          <DrawerDescription>
            Filtre seus leads por status, score, valor e mais
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[60vh] px-4">
          <FilterContent {...props} onClose={() => setOpen(false)} />
        </ScrollArea>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
