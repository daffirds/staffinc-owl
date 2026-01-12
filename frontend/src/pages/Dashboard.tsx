import { useState } from 'react';
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Upload, Calendar as CalendarIcon, Building2, User, Check, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import MetricCard from '@/components/dashboard/MetricCard';
import GapCard from '@/components/dashboard/GapCard';
import CandidateModal from '@/components/dashboard/CandidateModal';
import {
  fetchCandidates,
  fetchClients,
  fetchInterviewers,
  fetchMetricsOverview,
  type Candidate,
  type GapType,
} from '@/lib/api';

const gapConfig: { type: GapType; title: string }[] = [
  { type: 'hiddenCriteria', title: 'Hidden Criteria' },
  { type: 'assessmentConflict', title: 'Assessment Conflict' },
  { type: 'scoreMismatch', title: 'Score Mismatch' },
  { type: 'other', title: 'Other' },
];

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGap, setSelectedGap] = useState<{ type: GapType; title: string } | null>(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  const [candidatePage, setCandidatePage] = useState(1);
  const [candidatePageSize, setCandidatePageSize] = useState(10);

  const filters = {
    clientId: selectedClient !== 'all' ? selectedClient : undefined,
    interviewerId: selectedInterviewer !== 'all' ? selectedInterviewer : undefined,
    startDate: dateRange.from ? dateRange.from.toISOString().split('T')[0] : undefined,
    endDate: dateRange.to ? dateRange.to.toISOString().split('T')[0] : undefined,
  };

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', filters],
    queryFn: () => fetchMetricsOverview(filters),
  });

  const { data: candidateTable, isLoading: candidatesLoading, refetch: refetchCandidates } = useQuery({
    queryKey: ['candidate-table', filters, candidatePage, candidatePageSize],
    queryFn: () => fetchCandidates(candidatePage, candidatePageSize, filters),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
    queryClient.invalidateQueries({ queryKey: ['candidate-table'] });
  };

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: interviewers = [] } = useQuery({
    queryKey: ['interviewers'],
    queryFn: fetchInterviewers,
  });

  const handleReviewGap = (gap: { type: GapType; title: string }) => {
    setSelectedGap(gap);
    setModalOpen(true);
  };

  const rejectionRate = metrics
    ? Math.round((metrics.rejectedCount / metrics.totalCandidates) * 100)
    : 0;

  const formatMaybeJson = (value?: string) => {
    if (!value) return '';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  const renderGapFlag = (status: Candidate['status'], value: boolean) => {
    if (status === 'accepted') {
      return <span className="text-muted-foreground">-</span>;
    }

    if (value) {
      return <Check className="mx-auto h-4 w-4 text-[hsl(var(--chart-2))]" aria-label="Yes" />;
    }

    return <X className="mx-auto h-4 w-4 text-destructive" aria-label="No" />;
  };

  const pagination = candidateTable?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const toggleCandidate = (id: string) => {
    setExpandedCandidateId((current) => (current === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold uppercase tracking-tight">Staffinc Owl</h1>
          <Button asChild className="border border-border bg-blue-600 text-white hover:bg-blue-700">
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Evaluation
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-end gap-4 border border-border bg-background p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wide">
              <Building2 className="mr-1 inline h-4 w-4" />
              Client
            </label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="border border-input">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent className="border border-border bg-background">
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wide">
              <User className="mr-1 inline h-4 w-4" />
              Interviewer
            </label>
            <Select value={selectedInterviewer} onValueChange={setSelectedInterviewer}>
              <SelectTrigger className="border border-input">
                <SelectValue placeholder="All Interviewers" />
              </SelectTrigger>
              <SelectContent className="border border-border bg-background">
                <SelectItem value="all">All Interviewers</SelectItem>
                {interviewers.map((interviewer) => (
                  <SelectItem key={interviewer.id} value={interviewer.id}>
                    {interviewer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wide">
              <CalendarIcon className="mr-1 inline h-4 w-4" />
              Date Range
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border border-input w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>All Time</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-border" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range ?? { from: undefined, to: undefined });
                    if (range?.to) {
                      setCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            className="border border-input"
            onClick={() => {
              setSelectedClient('all');
              setSelectedInterviewer('all');
              setDateRange({ from: undefined, to: undefined });
              setCandidatePage(1);
            }}
          >
            Reset Filters
          </Button>
        </div>

        {/* Executive Summary */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide">Executive Summary</h2>
          {metricsLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32 border-2 border-foreground" />
              <Skeleton className="h-32 border-2 border-foreground" />
              <Skeleton className="h-32 border-2 border-foreground" />
            </div>
          ) : metrics ? (
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Total Interviews" value={metrics.totalInterviews} subtitle="Completed evaluations" />
              <MetricCard title="Total Candidates" value={metrics.totalCandidates} subtitle="Unique candidates evaluated" />
              <MetricCard
                title="Rejection Rate"
                value={`${rejectionRate}%`}
                subtitle={`${metrics.rejectedCount} of ${metrics.totalCandidates} rejected`}
              />
            </div>
          ) : null}
        </section>

        {/* Gap Metrics */}
        <section>
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide">Rejection Reason Analysis</h2>
          {metricsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 border-2 border-foreground" />
              ))}
            </div>
          ) : metrics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {gapConfig.map((gap) => (
                <GapCard
                  key={gap.type}
                  title={gap.title}
                  rejected={metrics.gapBreakdown[gap.type].rejected}
                  totalRejected={metrics.rejectedCount}
                  totalAccepted={metrics.acceptedCount}
                  onReviewClick={() => handleReviewGap(gap)}
                />
              ))}
            </div>
          ) : null}
        </section>

        {/* Candidate Table */}
        <section className="mt-10">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold uppercase tracking-wide">Candidates</h2>
              <p className="text-sm text-muted-foreground">Recent completed evaluations</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border border-input"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Rows</span>
              <Select
                value={candidatePageSize.toString()}
                onValueChange={(value) => {
                  setCandidatePageSize(Number(value));
                  setCandidatePage(1);
                }}
              >
                <SelectTrigger className="w-[90px] border border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-border bg-background">
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto border border-border bg-background">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Hidden</th>
                  <th className="px-4 py-3 text-center font-semibold">Conflict</th>
                  <th className="px-4 py-3 text-center font-semibold">Score</th>
                  <th className="px-4 py-3 text-center font-semibold">Other</th>
                </tr>
              </thead>
              <tbody>
                {candidatesLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={9}>
                      Loading candidates...
                    </td>
                  </tr>
                ) : candidateTable?.candidates?.length ? (
                  candidateTable.candidates.map((candidate) => {
                    const isExpanded = expandedCandidateId === candidate.id;
                    return (
                      <React.Fragment key={candidate.id}>
                        <tr
                          className="cursor-pointer border-b border-border hover:bg-muted/50"
                          onClick={() => toggleCandidate(candidate.id)}
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 font-semibold">{candidate.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{candidate.clientName}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center border border-border px-2 py-1 text-xs font-semibold uppercase ${
                                candidate.status === 'rejected'
                                  ? 'bg-destructive text-destructive-foreground'
                                  : 'bg-[hsl(var(--chart-2))] text-background'
                              }`}
                            >
                              {candidate.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {renderGapFlag(candidate.status, candidate.hasHiddenCriteria)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {renderGapFlag(candidate.status, candidate.hasAssessmentConflict)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {renderGapFlag(candidate.status, candidate.hasScoreMismatch)}
                          </td>
                          <td className="px-4 py-3 text-center">{renderGapFlag(candidate.status, candidate.hasOther)}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-border">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid gap-4 rounded-lg border border-border bg-muted/50 p-4">
                                <div>
                                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide">Client Requirements</h4>
                                  <pre className="whitespace-pre-wrap rounded-md bg-background p-3 font-mono text-xs">
                                    {formatMaybeJson(
                                      candidate.standardizedRequirements || candidate.requirementsText
                                    ) || 'No requirements available'}
                                  </pre>
                                </div>
                                <div>
                                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide">Internal Scores</h4>
                                  <pre className="whitespace-pre-wrap rounded-md bg-background p-3 font-mono text-xs">
                                    {formatMaybeJson(candidate.standardizedScores || candidate.rawInternalScores) ||
                                      'No scores available'}
                                  </pre>
                                </div>
                                <div>
                                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide">Internal Notes</h4>
                                  <pre className="whitespace-pre-wrap rounded-md bg-background p-3 font-mono text-xs">
                                    {candidate.standardizedNotes || candidate.rawInternalNotes || 'No notes available'}
                                  </pre>
                                </div>
                                <div>
                                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide">Client Feedback</h4>
                                  <pre className="whitespace-pre-wrap rounded-md bg-background p-3 font-mono text-xs">
                                    {candidate.standardizedFeedback || candidate.rawClientFeedback || 'No feedback available'}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={9}>
                      No candidates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="border border-input"
                onClick={() => setCandidatePage((p) => Math.max(p - 1, 1))}
                disabled={candidatePage === 1}
              >
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination?.page ?? candidatePage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border border-input"
                onClick={() => setCandidatePage((p) => (p < totalPages ? p + 1 : p))}
                disabled={candidatePage >= totalPages}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>
      </main>

      {/* Candidate Modal */}
      {selectedGap ? (
        <CandidateModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          gapType={selectedGap.type}
          gapTitle={selectedGap.title}
          filters={filters}
        />
      ) : null}
    </div>
  );
};

export default Dashboard;
