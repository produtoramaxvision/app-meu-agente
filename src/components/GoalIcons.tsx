import { LucideProps } from 'lucide-react';
import { goalIcons } from '@/constants/goalIcons';

interface IconProps extends LucideProps {
  name: string;
}

export const GoalIcon = ({ name, ...props }: IconProps) => {
  const IconComponent = goalIcons[name]?.icon;
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
};