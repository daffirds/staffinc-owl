import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EntityComboboxProps {
  items: { id: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  onCreateNew?: () => void;
  createNewLabel?: string;
  disabled?: boolean;
}

const EntityCombobox = ({
  items,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  onCreateNew,
  createNewLabel,
  disabled,
}: EntityComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedItem = items.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border border-input"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <span className="flex-1 text-left">
              {selectedItem ? selectedItem.label : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] border border-border bg-background p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="border-b border-border" />
            <CommandList>
              {onCreateNew && createNewLabel && (

              <CommandItem
                onSelect={() => {
                  onCreateNew();
                  setOpen(false);
                }}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createNewLabel}
              </CommandItem>
            )}
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    onValueChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EntityCombobox;
