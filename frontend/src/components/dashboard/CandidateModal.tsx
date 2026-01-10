import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { fetchCandidatesByMetric, GapType, Candidate } from '@/lib/api';

interface CandidateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gapType: GapType;
  gapTitle: string;
  filters?: { clientId?: string; startDate?: string; endDate?: string };
}

const gapExplanationKey: Record<GapType, keyof Candidate> = {
  hiddenCriteria: 'hiddenCriteriaExplanation',
  assessmentConflict: 'assessmentConflictExplanation',
  calibrationGap: 'calibrationGapExplanation',
  scoreMismatch: 'scoreMismatchExplanation',
  other: 'otherExplanation',
};

const CandidateModal = ({ open, onOpenChange, gapType, gapTitle, filters }: CandidateModalProps) => {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates', gapType, page, filters],
    queryFn: () => fetchCandidatesByMetric(gapType, page, 10, filters),
    enabled: open,
  });

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (data && page < data.pagination.totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden border-2 border-foreground bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-wide">
            {gapTitle} Analysis
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-8 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load candidates</span>
          </div>
        ) : data ? (
          <>
            {/* AI Summary */}
            <div className="border-2 border-foreground bg-muted p-4">
              <h4 className="mb-2 font-bold uppercase tracking-wide">AI Analysis Summary</h4>
              <p className="text-sm leading-relaxed">{data.aiSummary}</p>
            </div>

            {/* Candidate List */}
            <div className="max-h-[400px] overflow-y-auto">
              {data.candidates.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No candidates found</p>
              ) : (
                <div className="divide-y-2 divide-foreground">
                  {data.candidates.map((candidate) => (
                    <div key={candidate.id} className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold">{candidate.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            {candidate.appliedRole} • {candidate.clientName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(candidate.interviewDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`border-2 border-foreground px-2 py-1 text-xs font-bold uppercase ${
                            candidate.status === 'rejected'
                              ? 'bg-foreground text-background'
                              : 'bg-background text-foreground'
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </div>
                      {candidate[gapExplanationKey[gapType]] && (
                        <p className="mt-2 border-l-4 border-foreground bg-muted pl-3 text-sm">
                          {candidate[gapExplanationKey[gapType]] as string}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t-2 border-foreground pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="border-2 border-foreground"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page === data.pagination.totalPages}
                  className="border-2 border-foreground"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default CandidateModal;
