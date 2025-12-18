import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CustomFieldDefinition } from '@/hooks/useCustomFields';

interface CustomFieldRendererProps {
  definition: CustomFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function CustomFieldRenderer({ 
  definition, 
  value, 
  onChange,
  disabled = false
}: CustomFieldRendererProps) {
  
  // Helper para formatar valor monetário
  const formatCurrency = (val: string) => {
    const numbers = val.replace(/[^\d]/g, '');
    if (!numbers) return '';
    const num = parseInt(numbers) / 100;
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    const cleanValue = formatted.replace(/\./g, '').replace(',', '.');
    const numericValue = parseFloat(cleanValue) || 0;
    onChange(numericValue);
  };

  switch (definition.field_type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label>
            {definition.field_label}
            {definition.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input 
            value={(value as string) || ''} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${definition.field_label.toLowerCase()}`}
            disabled={disabled}
            className="w-full"
          />
        </div>
      );
    
    case 'number':
      return (
        <div className="space-y-2">
          <Label>
            {definition.field_label}
            {definition.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input 
            type="number" 
            value={(value as number) || ''} 
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            disabled={disabled}
            className="w-full"
          />
        </div>
      );
    
    case 'boolean':
      return (
        <div className="flex items-center justify-between space-y-0 rounded-md border p-3 sm:p-4">
          <div className="space-y-0.5">
            <Label className="text-sm sm:text-base">
              {definition.field_label}
              {definition.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
          <Switch 
            checked={(value as boolean) || false} 
            onCheckedChange={onChange}
            disabled={disabled}
          />
        </div>
      );
    
    case 'date':
      return (
        <div className="space-y-2">
          <Label>
            {definition.field_label}
            {definition.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                disabled={disabled}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {value ? format(new Date(value as string), 'PPP', { locale: ptBR }) : 'Selecione uma data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={value ? new Date(value as string) : undefined}
                onSelect={(date) => onChange(date?.toISOString())}
                locale={ptBR}
                disabled={disabled}
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    
    case 'select':
      return (
        <div className="space-y-2">
          <Label>
            {definition.field_label}
            {definition.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Selecione ${definition.field_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {definition.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    
    case 'multiselect': {
      const selectedValues = Array.isArray(value) ? value : [];
      
      return (
        <div className="space-y-2">
          <Label>
            {definition.field_label}
            {definition.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          
          {/* Exibir valores selecionados */}
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedValues.map((val) => (
                <Badge key={val} variant="secondary" className="gap-1">
                  {val}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => {
                      if (!disabled) {
                        onChange(selectedValues.filter((v) => v !== val));
                      }
                    }}
                  />
                </Badge>
              ))}
            </div>
          )}
          
          {/* Select para adicionar novos valores */}
          <Select 
            value="" 
            onValueChange={(val) => {
              if (!selectedValues.includes(val)) {
                onChange([...selectedValues, val]);
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Adicionar opção" />
            </SelectTrigger>
            <SelectContent>
              {definition.options
                ?.filter((option) => !selectedValues.includes(option))
                .map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    case 'currency': {
      const displayValue = typeof value === 'number' && value ? 
        value.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) : '';

      return (
        <div className="space-y-2">
          <Label>
            {definition.field_label}
            {definition.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              R$
            </span>
            <Input 
              type="text"
              value={displayValue}
              onChange={handleCurrencyChange}
              placeholder="0,00"
              disabled={disabled}
              className="pl-10 w-full"
            />
          </div>
        </div>
      );
    }
    
    case 'url':
      return (
        <div className="space-y-2">
          <Label>
            {definition.field_label}
            {definition.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input 
            type="url"
            value={(value as string) || ''} 
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://exemplo.com"
            disabled={disabled}
            className="w-full"
          />
          {value && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => window.open(value as string, '_blank')}
            >
              Abrir link →
            </Button>
          )}
        </div>
      );
    
    default:
      return null;
  }
}
