import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Upload, Calendar, Building2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import MetricCard from '@/components/dashboard/MetricCard';
import GapCard from '@/components/dashboard/GapCard';
import CandidateModal from '@/components/dashboard/CandidateModal';
import { fetchCandidates, fetchClients, fetchMetricsOverview, type Candidate, type GapType } from '@/lib/api';

const gapConfig: { type: GapType; title: string }[] = [
  { type: 'hiddenCriteria', title: 'Hidden Criteria' },
  { type: 'assessmentConflict', title: 'Assessment Conflict' },
  { type: 'scoreMismatch', title: 'Score Mismatch' },
  { type: 'other', title: 'Other' },
];

const Dashboard = () => {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGap, setSelectedGap] = useState<{ type: GapType; title: string } | null>(null);

  const [candidatePage, setCandidatePage] = useState(1);
  const [candidatePageSize, setCandidatePageSize] = useState(10);

  const filters = {
    clientId: selectedClient !== 'all' ? selectedClient : undefined,
    startDate: dateRange !== 'all' ? getDateRangeStart(dateRange) : undefined,
    endDate: dateRange !== 'all' ? new Date().toISOString().split('T')[0] : undefined,
  };

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', filters],
    queryFn: () => fetchMetricsOverview(filters),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: candidateTable, isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidate-table', filters, candidatePage, candidatePageSize],
    queryFn: () => fetchCandidates(candidatePage, candidatePageSize, filters),
  });

  const handleReviewGap = (gap: { type: GapType; title: string }) => {
    setSelectedGap(gap);
    setModalOpen(true);
  };

  const rejectionRate = metrics
    ? Math.round((metrics.rejectedCount / metrics.totalCandidates) * 100)
    : 0;

  const renderGapFlag = (status: Candidate['status'], value: boolean) => {
    if (status === 'accepted') {
      return <span className="text-muted-foreground">-</span>;
    }

    if (value) {
      return <Check className="mx-auto h-4 w-4 text-[hsl(var(--chart-3))]" aria-label="Yes" />;
    }

    return <X className="mx-auto h-4 w-4 text-destructive" aria-label="No" />;
  };

  const pagination = candidateTable?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground bg-background">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Staffinc Owl</h1>
          <Button asChild className="border-2 border-foreground shadow-xs">
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Evaluation
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-end gap-4 border-2 border-foreground bg-background p-4 shadow-xs">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-bold uppercase tracking-wide">
              <Building2 className="mr-1 inline h-4 w-4" />
              Client
            </label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="border-2 border-foreground">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent className="border-2 border-foreground bg-background">
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
            <label className="mb-2 block text-sm font-bold uppercase tracking-wide">
              <Calendar className="mr-1 inline h-4 w-4" />
              Date Range
            </label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="border-2 border-foreground">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent className="border-2 border-foreground bg-background">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="border-2 border-foreground"
            onClick={() => {
              setSelectedClient('all');
              setDateRange('all');
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
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide">Gap Analysis</h2>
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
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wide">Candidates</h2>
              <p className="text-sm text-muted-foreground">Recent completed evaluations</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Rows</span>
              <Select
                value={candidatePageSize.toString()}
                onValueChange={(value) => {
                  setCandidatePageSize(Number(value));
                  setCandidatePage(1);
                }}
              >
                <SelectTrigger className="w-[90px] border-2 border-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-foreground bg-background">
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto border-2 border-foreground bg-background shadow-xs">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Hidden</th>
                  <th className="px-4 py-3 text-center font-semibold">Conflict</th>
                  <th className="px-4 py-3 text-center font-semibold">Mismatch</th>
                  <th className="px-4 py-3 text-center font-semibold">Other</th>
                </tr>
              </thead>
              <tbody>
                {candidatesLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>
                      Loading candidates...
                    </td>
                  </tr>
                ) : candidateTable?.candidates?.length ? (
                  candidateTable.candidates.map((candidate) => (
                    <tr key={candidate.id} className="border-t-2 border-foreground/30">
                      <td className="px-4 py-3 text-muted-foreground">
                        {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold">{candidate.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{candidate.clientName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center border-2 border-foreground px-2 py-1 text-xs font-bold uppercase ${
                            candidate.status === 'rejected'
                              ? 'bg-foreground text-background'
                              : 'bg-background text-foreground'
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
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>
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
                className="border-2 border-foreground"
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
                className="border-2 border-foreground"
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

function getDateRangeStart(range: string): string {
  const now = new Date();
  switch (range) {
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '90d':
      now.setDate(now.getDate() - 90);
      break;
    default:
      return '';
  }
  return now.toISOString().split('T')[0];
}

export default Dashboard;
