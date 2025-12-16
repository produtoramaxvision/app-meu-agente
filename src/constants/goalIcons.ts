import { Car, PiggyBank, Home, Plane, Gift, Folder, LucideIcon } from 'lucide-react';

export const goalIcons: Record<string, { icon: LucideIcon, label: string }> = {
  carro: { icon: Car, label: 'Carro' },
  economia: { icon: PiggyBank, label: 'Economia' },
  casa: { icon: Home, label: 'Casa' },
  viagem: { icon: Plane, label: 'Viagem' },
  presente: { icon: Gift, label: 'Presente' },
  trabalho: { icon: Folder, label: 'Trabalho' },
};

export type GoalIconName = keyof typeof goalIcons;
