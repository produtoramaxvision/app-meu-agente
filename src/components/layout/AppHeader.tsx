import { Search, AlertCircle, Menu, X, Command as CommandIcon } from 'lucide-react';
import { ThemeSwitch } from '@/components/ds/ThemeSwitch';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSearch } from '@/contexts/SearchContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '../NotificationBell';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';

interface AppHeaderProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

type UniversalCommand = {
  id: string;
  keyword: string;
  prefix: string;
  label: string;
  description: string;
  route: string;
};

type ParsedCommand = {
  id: string;
  keyword: string;
  route: string;
  searchText: string;
};

const UNIVERSAL_COMMANDS: UniversalCommand[] = [
  {
    id: 'tasks',
    keyword: 'tarefas',
    prefix: '/tarefas',
    label: 'Buscar em tarefas',
    description: 'Filtrar pelo título, descrição ou status das tarefas.',
    route: '/tarefas',
  },
  {
    id: 'financial',
    keyword: 'contas',
    prefix: '/contas',
    label: 'Buscar em contas (financeiro)',
    description: 'Pesquisar transações e registros financeiros.',
    route: '/contas',
  },
  {
    id: 'agenda',
    keyword: 'agenda',
    prefix: '/agenda',
    label: 'Buscar na agenda',
    description: 'Pesquisar eventos e compromissos da agenda.',
    route: '/agenda',
  },
  {
    id: 'agenda_day',
    keyword: 'agenda-dia',
    prefix: '/agenda-dia',
    label: 'Agenda - visão Dia',
    description: 'Ver a agenda no modo diário filtrando por título.',
    route: '/agenda',
  },
  {
    id: 'agenda_week',
    keyword: 'agenda-semana',
    prefix: '/agenda-semana',
    label: 'Agenda - visão Semana',
    description: 'Ver a agenda na visão semanal filtrando por título.',
    route: '/agenda',
  },
  {
    id: 'events',
    keyword: 'eventos',
    prefix: '/eventos',
    label: 'Buscar por eventos/reuniões',
    description: 'Filtrar reuniões e eventos na agenda.',
    route: '/agenda',
  },
  {
    id: 'timeline',
    keyword: 'timeline',
    prefix: '/timeline',
    label: 'Ver agenda em timeline',
    description: 'Abrir a visualização de timeline da agenda filtrando por título.',
    route: '/agenda',
  },
  {
    id: 'agenda_timeline',
    keyword: 'agenda-timeline',
    prefix: '/agenda-timeline',
    label: 'Agenda - visão Timeline',
    description: 'Abrir a agenda direto na visão de timeline filtrando por título.',
    route: '/agenda',
  },
  {
    id: 'reports',
    keyword: 'relatorios',
    prefix: '/relatorios',
    label: 'Buscar em relatórios',
    description: 'Pesquisar transações dentro da página de relatórios.',
    route: '/relatorios',
  },
];

function parseCommand(raw: string): ParsedCommand | null {
  if (!raw.startsWith('/')) return null;

  const withoutSlash = raw.slice(1).trim();
  if (!withoutSlash) return null;

  const [keywordPart, ...rest] = withoutSlash.split(/\s+/);
  const lower = keywordPart.toLowerCase();

  const base =
    UNIVERSAL_COMMANDS.find((cmd) => cmd.keyword === lower) ||
    UNIVERSAL_COMMANDS.find((cmd) => cmd.keyword.startsWith(lower));

  if (!base) return null;

  return {
    id: base.id,
    keyword: base.keyword,
    route: base.route,
    searchText: rest.join(' ').trim(),
  };
}

export function AppHeader({ onMenuClick, isMenuOpen = false }: AppHeaderProps) {
  const { cliente } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    hasResults,
    setMode,
    setRawCommand,
    setCommandId,
    setTargetRoute,
  } = useSearch();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showError, setShowError] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Sincroniza o input local com o estado global se ele mudar em outro lugar
    if (searchQuery !== localSearch) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Mostra erro visual quando não há resultados
    if (searchQuery && !hasResults) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [searchQuery, hasResults]);

  // Atalho global para abrir/fechar a Command Palette (Ctrl/Cmd + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const isCommandMode = localSearch.startsWith('/');

  const commandSuggestions: UniversalCommand[] = (() => {
    if (!isCommandMode) return [];

    const raw = localSearch.slice(1).toLowerCase();
    const [keywordPart] = raw.split(/\s+/);

    if (!keywordPart) return UNIVERSAL_COMMANDS;

    return UNIVERSAL_COMMANDS.filter((cmd) =>
      cmd.keyword.startsWith(keywordPart)
    );
  })();

  const executeParsedCommand = (parsed: ParsedCommand) => {
    // Registrar metadados de comando global no contexto
    setMode('global');
    setRawCommand(localSearch);
    setCommandId(parsed.id);
    setTargetRoute(parsed.route);

    // Define o termo de busca contextual que será usado pelas páginas
    setSearchQuery(parsed.searchText || '');

    // Navega para a rota alvo, se necessário
    if (location.pathname !== parsed.route) {
      navigate(parsed.route);
    }

    // Mantém o input sincronizado com o termo de busca puro (sem o comando)
    setLocalSearch(parsed.searchText || '');
    setShowError(false);
  };

  // Ações da paleta global reutilizando os mesmos comandos universais
  const handleCommandPaletteSelect = (cmd: UniversalCommand, searchText: string) => {
    // Monta uma string no formato "/prefix texto" para reaproveitar o parser e o fluxo atual
    const raw = `${cmd.prefix}${searchText ? ` ${searchText}` : ''}`;
    const parsed = parseCommand(raw) ?? {
      id: cmd.id,
      keyword: cmd.keyword,
      route: cmd.route,
      searchText,
    };

    executeParsedCommand(parsed);
    setIsCommandPaletteOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Modo comando com '/'
    const parsed = parseCommand(localSearch);
    if (parsed) {
      executeParsedCommand(parsed);
      return;
    }

    // Busca padrão quando não há comando
    if (!localSearch.trim()) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 2000);
      return () => clearTimeout(timer);
    }
    
    // Busca local padrão (sem comando)
    setMode('local');
    setRawCommand(undefined);
    setCommandId(undefined);
    setTargetRoute('/tarefas');
    setSearchQuery(localSearch);
    
    // Navega para a página de tarefas para exibir os resultados da busca
    if (location.pathname !== '/tarefas') {
      navigate('/tarefas');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-bg px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-surface transition-colors group"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          <div className="relative w-5 h-5">
            <Menu 
              className={cn(
                "h-5 w-5 absolute inset-0 transition-all duration-300",
                isMenuOpen && "opacity-0 rotate-90 scale-0"
              )} 
            />
            <X 
              className={cn(
                "h-5 w-5 absolute inset-0 transition-all duration-300",
                !isMenuOpen && "opacity-0 rotate-90 scale-0"
              )} 
            />
          </div>
        </button>
        
        {/* Search */}
        <div className="flex-1 mr-2 sm:mr-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                type="search"
                placeholder="Buscar em todo o app ou digitar comando (/tarefas, /contas, /agenda...)"
                className={cn(
                  "pl-9 pr-10 bg-surface transition-all duration-300",
                  showError && "border-red-500/50 animate-shake"
                )}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                aria-label="Busca universal e comandos rápidos"
              />

              {isCommandMode && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50">
                  <Command
                    className="rounded-md border bg-popover text-popover-foreground shadow-lg"
                    aria-label="Sugestões de comandos rápidos"
                  >
                    <CommandList>
                      <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>
                      <CommandGroup heading="Comandos rápidos">
                        {commandSuggestions.map((cmd) => (
                        <CommandItem
                          key={cmd.id}
                          value={cmd.prefix}
                          onSelect={() => {
                            const parsedCommand =
                              parseCommand(localSearch) ?? ({
                                id: cmd.id,
                                keyword: cmd.keyword,
                                route: cmd.route,
                                searchText: '',
                              } as ParsedCommand);
                            executeParsedCommand(parsedCommand);
                          }}
                        >
                          <span className="font-mono text-xs text-muted-foreground mr-2">
                            {cmd.prefix}
                          </span>
                          <span className="flex-1">{cmd.label}</span>
                          <CommandShortcut>
                            {cmd.route.replace('/', '')}
                          </CommandShortcut>
                        </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}

              {showError && (
                <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500 animate-pulse" />
              )}
            </div>
          </form>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Botão para abrir a Command Palette (além do atalho Ctrl/Cmd+K) */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface/80 transition-colors"
            aria-label="Abrir paleta de comandos (Ctrl+K)"
          >
            <CommandIcon className="h-4 w-4 text-text-muted" />
          </button>

          <ThemeSwitch />
          <NotificationBell />
          
          {cliente && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{cliente.name}</p>
                <p className="text-xs text-text-muted">{cliente.phone}</p>
              </div>
              <Link to="/perfil" className="transition-transform duration-300 ease-in-out hover:scale-110 block">
                <Avatar>
                  {cliente.avatar_url && (
                    <AvatarImage 
                      src={cliente.avatar_url}
                      alt={cliente.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-brand-900 to-brand-700 text-white">
                    {getInitials(cliente.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Command Palette Global (Ctrl/Cmd + K) */}
      <CommandDialog open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
        <CommandInput placeholder="Buscar comandos ou navegar pelo app..." />
        <CommandList>
          <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>

          <CommandGroup heading="Navegação rápida">
            {UNIVERSAL_COMMANDS.map((cmd) => (
              <CommandItem
                key={cmd.id}
                value={cmd.prefix}
                onSelect={(value) => {
                  // value é o prefix selecionado; o texto digitado vem de `value` do input,
                  // mas o cmdk não passa direto aqui. Vamos usar apenas o prefix e confiar
                  // no CommandInput para filtrar por label/descrição.
                  handleCommandPaletteSelect(cmd, '');
                }}
              >
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  {cmd.prefix}
                </span>
                <span className="flex-1">{cmd.label}</span>
                <CommandShortcut>{cmd.route.replace('/', '')}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Ações rápidas">
            <CommandItem
              onSelect={() => {
                navigate('/contas');
                setIsCommandPaletteOpen(false);
              }}
            >
              <span className="flex-1">Nova Transação</span>
              <CommandShortcut>contas</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate('/metas');
                setIsCommandPaletteOpen(false);
              }}
            >
              <span className="flex-1">Nova Meta</span>
              <CommandShortcut>metas</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate('/agenda');
                setIsCommandPaletteOpen(false);
              }}
            >
              <span className="flex-1">Novo Evento</span>
              <CommandShortcut>agenda</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate('/tarefas');
                setIsCommandPaletteOpen(false);
              }}
            >
              <span className="flex-1">Nova Tarefa</span>
              <CommandShortcut>tarefas</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate('/dashboard');
                setIsCommandPaletteOpen(false);
              }}
            >
              <span className="flex-1">Ir para Dashboard</span>
              <CommandShortcut>dashboard</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate('/perfil');
                setIsCommandPaletteOpen(false);
              }}
            >
              <span className="flex-1">Abrir Perfil</span>
              <CommandShortcut>perfil</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}