import { useState } from 'react';

// Hook para controlar o estado do popover (substitui variável global)
// Usado pela página Agenda para verificar se o popover está aberto
export const useEventPopoverOpen = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, setIsOpen };
};

// Função helper para verificar se o popover está aberto (mantida para compatibilidade)
// Nota: Esta é uma verificação limitada, considere usar o hook useEventPopoverOpen
let _isPopoverOpen = false;
export const isEventPopoverOpen = () => _isPopoverOpen;
export const setEventPopoverOpenState = (state: boolean) => {
  _isPopoverOpen = state;
};
