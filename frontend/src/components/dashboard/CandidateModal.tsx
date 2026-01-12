import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight, AlertCircle, ChevronDown } from 'lucide-react';
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
  scoreMismatch: 'scoreMismatchExplanation',
  other: 'otherExplanation',
};

const CandidateModal = ({ open, onOpenChange, gapType, gapTitle, filters }: CandidateModalProps) => {
  const [page, setPage] = useState(1);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates', gapType, page, filters],
    queryFn: () => fetchCandidatesByMetric(gapType, page, 10, filters),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setPage(1);
      setExpandedCandidateId(null);
      setOpenSection(undefined);
      return;
    }

    setExpandedCandidateId(null);
    setOpenSection(undefined);
  }, [gapType, open, page]);

  const candidates = data?.candidates ?? [];

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const formatMaybeJson = useMemo(() => {
    return (value?: string) => {
      if (!value) return '';
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    };
  }, []);

  const toggleCandidate = (id: string) => {
    setExpandedCandidateId((current) => {
      const next = current === id ? null : id;
      setOpenSection(undefined);
      return next;
    });
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden border-2 border-foreground bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-wide">{gapTitle} Analysis</DialogTitle>
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
              <p className="text-sm leading-relaxed">{data.aiSummary || '—'}</p>
            </div>

            {/* Candidate List */}
            <div className="max-h-[400px] overflow-y-auto">
              {candidates.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No candidates found</p>
              ) : (
                <div className="divide-y-2 divide-foreground">
                  {candidates.map((candidate) => {
                    const isExpanded = expandedCandidateId === candidate.id;
                    const titleLine = [candidate.appliedRole || 'Role TBD', candidate.clientName]
                      .filter(Boolean)
                      .join(' • ');

                    return (
                      <div key={candidate.id} className="py-4">
                        <button
                          type="button"
                          className="flex w-full items-start justify-between gap-3 text-left"
                          onClick={() => toggleCandidate(candidate.id)}
                        >
                          <div>
                            <h5 className="font-bold">{candidate.name}</h5>
                            <p className="text-sm text-muted-foreground">{titleLine}</p>
                            {candidate.interviewDate ? (
                              <p className="text-xs text-muted-foreground">
                                {new Date(candidate.interviewDate).toLocaleDateString()}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`border-2 border-foreground px-2 py-1 text-xs font-bold uppercase ${
                                candidate.status === 'rejected'
                                  ? 'bg-foreground text-background'
                                  : 'bg-background text-foreground'
                              }`}
                            >
                              {candidate.status}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {isExpanded ? (
                          <div className="mt-3 rounded-lg border-2 border-foreground bg-background p-3">
                            {candidate[gapExplanationKey[gapType]] ? (
                              <p className="mb-3 border-l-4 border-foreground bg-muted pl-3 text-sm">
                                {candidate[gapExplanationKey[gapType]] as string}
                              </p>
                            ) : null}

                            <Accordion
                              type="single"
                              collapsible
                              value={openSection}
                              onValueChange={setOpenSection}
                              className="w-full"
                            >
                              <AccordionItem value="requirements">
                                <AccordionTrigger className="py-2 text-sm">
                                  Standardized requirements
                                </AccordionTrigger>
                                <AccordionContent className="pb-2">
                                  <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs">
                                    {formatMaybeJson(
                                      candidate.standardizedRequirements || candidate.requirementsText
                                    ) || 'No requirements available'}
                                  </pre>
                                </AccordionContent>
                              </AccordionItem>

                              <AccordionItem value="feedback">
                                <AccordionTrigger className="py-2 text-sm">Feedback</AccordionTrigger>
                                <AccordionContent className="pb-2">
                                  <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs">
                                    {candidate.standardizedFeedback ||
                                      candidate.rawClientFeedback ||
                                      'No feedback available'}
                                  </pre>
                                </AccordionContent>
                              </AccordionItem>

                              <AccordionItem value="scores">
                                <AccordionTrigger className="py-2 text-sm">Scores</AccordionTrigger>
                                <AccordionContent className="pb-2">
                                  <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs">
                                    {formatMaybeJson(
                                      candidate.standardizedScores || candidate.rawInternalScores
                                    ) || 'No scores available'}
                                  </pre>
                                </AccordionContent>
                              </AccordionItem>

                              <AccordionItem value="notes">
                                <AccordionTrigger className="py-2 text-sm">Notes</AccordionTrigger>
                                <AccordionContent className="pb-2">
                                  <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs">
                                    {candidate.standardizedNotes ||
                                      candidate.rawInternalNotes ||
                                      'No notes available'}
                                  </pre>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
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
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="border-2 border-foreground"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default CandidateModal;
