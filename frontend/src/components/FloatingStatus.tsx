import { useProcessing } from '@/contexts/ProcessingContext';
import { Loader2, CheckCircle2 } from 'lucide-react';

const FloatingStatus = () => {
  const { state } = useProcessing();

  if (state.status === 'idle') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 border-2 border-foreground bg-background p-4 shadow-md">
      <div className="flex items-center gap-3">
        {state.status === 'uploading' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">
              Uploading & Analyzing {state.candidateName}...
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium">Analysis Complete!</span>
          </>
        )}
      </div>
    </div>
  );
};

export default FloatingStatus;
