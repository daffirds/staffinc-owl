import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FileTextToggleProps {
  label: string;
  required?: boolean;
  file: File | null;
  text: string;
  onFileChange: (file: File | null) => void;
  onTextChange: (text: string) => void;
}

const FileTextToggle = ({
  label,
  required,
  file,
  text,
  onFileChange,
  onTextChange,
}: FileTextToggleProps) => {
  const [mode, setMode] = useState<'file' | 'text'>('file');

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
    if (selectedFile) {
      onTextChange('');
    }
  };

  const handleTextInput = (value: string) => {
    onTextChange(value);
    if (value) {
      onFileChange(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-bold uppercase tracking-wide">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        <div className="flex border-2 border-foreground">
          <Button
            type="button"
            variant={mode === 'file' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('file')}
            className="rounded-none"
          >
            <Upload className="mr-1 h-4 w-4" />
            File
          </Button>
          <Button
            type="button"
            variant={mode === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('text')}
            className="rounded-none border-l-2 border-foreground"
          >
            <FileText className="mr-1 h-4 w-4" />
            Text
          </Button>
        </div>
      </div>

      {mode === 'file' ? (
        <div className="relative">
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInput}
            className="cursor-pointer border-2 border-dashed border-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
          {file && (
            <p className="mt-2 text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>
      ) : (
        <Textarea
          placeholder="Paste your content here..."
          value={text}
          onChange={(e) => handleTextInput(e.target.value)}
          className="min-h-[120px] border-2 border-foreground"
        />
      )}
    </div>
  );
};

export default FileTextToggle;
