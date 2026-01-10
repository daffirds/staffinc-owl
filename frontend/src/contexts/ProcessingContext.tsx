import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProcessingState {
  isProcessing: boolean;
  candidateName: string | null;
  status: 'idle' | 'uploading' | 'complete';
}

interface ProcessingContextType {
  state: ProcessingState;
  startProcessing: (candidateName: string) => void;
  completeProcessing: () => void;
  resetProcessing: () => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export const ProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    candidateName: null,
    status: 'idle',
  });

  const startProcessing = useCallback((candidateName: string) => {
    setState({
      isProcessing: true,
      candidateName,
      status: 'uploading',
    });
  }, []);

  const completeProcessing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'complete',
    }));

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setState({
        isProcessing: false,
        candidateName: null,
        status: 'idle',
      });
    }, 5000);
  }, []);

  const resetProcessing = useCallback(() => {
    setState({
      isProcessing: false,
      candidateName: null,
      status: 'idle',
    });
  }, []);

  return (
    <ProcessingContext.Provider value={{ state, startProcessing, completeProcessing, resetProcessing }}>
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = (): ProcessingContextType => {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
};
