import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import FileTextToggle from './FileTextToggle';
import type { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  isLoading?: boolean;
}

export const CreateClientDialog = ({ open, onOpenChange, onSubmit, isLoading }: CreateClientDialogProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold uppercase">Create New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="font-semibold uppercase">Client Name</Label>
              <Input
                id="clientName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter client name"
                className="border border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border border-input">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface CreateRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; file?: File | null; text: string }) => void;
  isLoading?: boolean;
  clientName?: string;
}

export const CreateRequirementDialog = ({ open, onOpenChange, onSubmit, isLoading, clientName }: CreateRequirementDialogProps) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'file' | 'text'>('text');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && (file || text.trim())) {
      onSubmit({ title: title.trim(), file, text: text.trim() });
      setTitle('');
      setFile(null);
      setText('');
    }
  };

  const isValid = title.trim() && (file || text.trim());

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setText('');
    }
  };

  const handleTextInput = (value: string) => {
    setText(value);
    if (value) {
      setFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold uppercase">Create New Requirement</DialogTitle>
          {clientName && (
            <p className="text-sm text-muted-foreground">For client: {clientName}</p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reqTitle" className="font-semibold uppercase">Requirement Title</Label>
              <Input
                id="reqTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="border border-input"
              />
            </div>
            <FileTextToggle
              label="Job Description Document"
              required
              file={file}
              text={text}
              onFileChange={handleFileInput}
              onTextChange={handleTextInput}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border border-input">
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? 'Creating...' : 'Create Requirement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface CreateInterviewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string }) => void;
  isLoading?: boolean;
}

export const CreateInterviewerDialog = ({ open, onOpenChange, onSubmit, isLoading }: CreateInterviewerDialogProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim() });
      setName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold uppercase">Add New Interviewer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="interviewerName" className="font-semibold uppercase">Name</Label>
              <Input
                id="interviewerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter interviewer name"
                className="border border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border border-input">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Adding...' : 'Add Interviewer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
