import { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionMenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

interface ActionMenuProps {
  children: ReactNode;
  items: ActionMenuItem[];
  className?: string;
}

// Helper function to render menu items
const renderMenuItems = (items: ActionMenuItem[], ItemComponent: React.ComponentType<{ onClick: () => void; disabled?: boolean; className?: string; children: React.ReactNode }>, SeparatorComponent: React.ComponentType) => (
  <>
    {items.map((item, index) => {
      const isLast = index === items.length - 1;
      const isDestructive = item.className?.includes('text-red') || item.className?.includes('text-destructive');
      
      return (
        <div key={index}>
          <ItemComponent 
            onClick={item.onClick} 
            className={`cursor-pointer ${item.className || ''}`}
            disabled={item.disabled}
          >
            {item.icon}
            <span>{item.label}</span>
          </ItemComponent>
          {!isLast && isDestructive && <SeparatorComponent />}
        </div>
      );
    })}
  </>
);

// DropdownMenu for button click
export function ActionMenu({ children, items, className }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        {renderMenuItems(items, DropdownMenuItem, DropdownMenuSeparator)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
