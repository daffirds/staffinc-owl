import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileTextToggle from './FileTextToggle';

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
      <DialogContent className="border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase">Create New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="font-bold uppercase">Client Name</Label>
              <Input
                id="clientName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter client name"
                className="border-2 border-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-2 border-foreground">
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
  onSubmit: (data: { title: string; file: File | null; text: string }) => void;
  isLoading?: boolean;
  clientName?: string;
}

export const CreateRequirementDialog = ({ open, onOpenChange, onSubmit, isLoading, clientName }: CreateRequirementDialogProps) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase">Create New Requirement</DialogTitle>
          {clientName && (
            <p className="text-sm text-muted-foreground">For client: {clientName}</p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reqTitle" className="font-bold uppercase">Requirement Title</Label>
              <Input
                id="reqTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="border-2 border-foreground"
              />
            </div>
            <FileTextToggle
              label="Job Description Document"
              required
              file={file}
              text={text}
              onFileChange={setFile}
              onTextChange={setText}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-2 border-foreground">
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
  onSubmit: (data: { name: string; email: string }) => void;
  isLoading?: boolean;
}

export const CreateInterviewerDialog = ({ open, onOpenChange, onSubmit, isLoading }: CreateInterviewerDialogProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      onSubmit({ name: name.trim(), email: email.trim() });
      setName('');
      setEmail('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase">Add New Interviewer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="interviewerName" className="font-bold uppercase">Name</Label>
              <Input
                id="interviewerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter interviewer name"
                className="border-2 border-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewerEmail" className="font-bold uppercase">Email</Label>
              <Input
                id="interviewerEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="interviewer@company.com"
                className="border-2 border-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-2 border-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !email.trim() || isLoading}>
              {isLoading ? 'Adding...' : 'Add Interviewer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
