import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import EntityCombobox from '@/components/upload/EntityCombobox';
import FileTextToggle from '@/components/upload/FileTextToggle';
import {
  CreateClientDialog,
  CreateRequirementDialog,
  CreateInterviewerDialog,
} from '@/components/upload/CreateEntityDialogs';
import { useProcessing } from '@/contexts/ProcessingContext';
import { useToast } from '@/hooks/use-toast';
import {
  fetchClients,
  fetchRequirements,
  fetchInterviewers,
  createClient,
  createRequirement,
  createInterviewer,
  getPresignedUrl,
  uploadToS3,
  processUpload,
} from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const UploadPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startProcessing, completeProcessing } = useProcessing();
  const { toast } = useToast();

  // Form state
  const [candidateName, setCandidateName] = useState('');
  const [appliedRole, setAppliedRole] = useState('');
  const [interviewDate, setInterviewDate] = useState<Date>();
  const [finalStatus, setFinalStatus] = useState<'accepted' | 'rejected'>();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState('');
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const [notesFile, setNotesFile] = useState<File | null>(null);
  const [notesText, setNotesText] = useState('');
  const [scoresFile, setScoresFile] = useState<File | null>(null);
  const [scoresText, setScoresText] = useState('');
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Dialog state
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [createRequirementOpen, setCreateRequirementOpen] = useState(false);
  const [createInterviewerOpen, setCreateInterviewerOpen] = useState(false);

  // Queries
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements', selectedClient],
    queryFn: () => fetchRequirements(selectedClient || undefined),
    enabled: !!selectedClient,
  });

  const { data: interviewers = [] } = useQuery({
    queryKey: ['interviewers'],
    queryFn: fetchInterviewers,
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClient(data.id);
      setCreateClientOpen(false);
      toast({ title: 'Client created successfully' });
    },
  });

  const createRequirementMutation = useMutation({
    mutationFn: (data: { title: string; file?: File | null; text: string }) =>
      createRequirement({
        ...data,
        clientId: selectedClient,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      setSelectedRequirement(data.id);
      setCreateRequirementOpen(false);
      toast({ title: 'Requirement created successfully' });
    },
  });

  const createInterviewerMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      createInterviewer({ name: data.name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviewers'] });
      setSelectedInterviewer(data.id);
      setCreateInterviewerOpen(false);
      toast({ title: 'Interviewer added successfully' });
    },
  });

  // Submit handler
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidateName || !appliedRole || !interviewDate || !finalStatus) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (!selectedClient || !selectedRequirement || !selectedInterviewer) {
      toast({ title: 'Please select client, requirement, and interviewer', variant: 'destructive' });
      return;
    }

    if ((!notesFile && !notesText) || (!scoresFile && !scoresText) || (!feedbackFile && !feedbackText)) {
      toast({ title: 'Please provide all three evaluation inputs', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    startProcessing(candidateName);

    try {
      // Upload files and get keys
      let internalNotesKey: string | undefined;
      let candidateScoresKey: string | undefined;
      let clientFeedbackKey: string | undefined;

      if (notesFile) {
        const presigned = await getPresignedUrl(notesFile.name, notesFile.type);
        await uploadToS3(presigned.uploadUrl, notesFile);
        internalNotesKey = presigned.key;
      }

      if (scoresFile) {
        const presigned = await getPresignedUrl(scoresFile.name, scoresFile.type);
        await uploadToS3(presigned.uploadUrl, scoresFile);
        candidateScoresKey = presigned.key;
      }

      if (feedbackFile) {
        const presigned = await getPresignedUrl(feedbackFile.name, feedbackFile.type);
        await uploadToS3(presigned.uploadUrl, feedbackFile);
        clientFeedbackKey = presigned.key;
      }

      // Process upload
      await processUpload({
        candidateName,
        appliedRole,
        interviewDate: interviewDate.toISOString().split('T')[0],
        finalStatus,
        clientId: selectedClient,
        requirementId: selectedRequirement,
        interviewerId: selectedInterviewer,
        internalNotesKey,
        internalNotesText: notesText || undefined,
        candidateScoresKey,
        candidateScoresText: scoresText || undefined,
        clientFeedbackKey,
        clientFeedbackText: feedbackText || undefined,
      });

      completeProcessing();
      toast({ title: 'Evaluation submitted successfully!' });

      // Reset form
      setCandidateName('');
      setAppliedRole('');
      setInterviewDate(undefined);
      setFinalStatus(undefined);
      setSelectedClient('');
      setSelectedRequirement('');
      setSelectedInterviewer('');
      setNotesFile(null);
      setNotesText('');
      setScoresFile(null);
      setScoresText('');
      setFeedbackFile(null);
      setFeedbackText('');

      // Optionally navigate
      // navigate('/');
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClientName = clients.find((c) => c.id === selectedClient)?.name;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="container mx-auto flex items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" asChild className="border border-input">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold uppercase tracking-tight">
            Upload Evaluation
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Candidate Metadata */}
            <div className="space-y-6 border border-border bg-background p-6">
              <h2 className="text-lg font-semibold uppercase tracking-wide">
                Candidate Information
              </h2>

              <div className="space-y-2">
                <Label htmlFor="candidateName" className="font-semibold uppercase">
                  Candidate Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="candidateName"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Enter candidate name"
                  className="border border-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appliedRole" className="font-semibold uppercase">
                  Applied Role <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="appliedRole"
                  value={appliedRole}
                  onChange={(e) => setAppliedRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="border border-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold uppercase">
                  Interview Date <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start border border-input text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {interviewDate ? format(interviewDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border border-input bg-background p-0">
                    <Calendar
                      mode="single"
                      selected={interviewDate}
                      onSelect={setInterviewDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold uppercase">
                  Final Client Hiring Status <span className="text-destructive">*</span>
                </Label>
                <Select value={finalStatus} onValueChange={(v) => setFinalStatus(v as 'accepted' | 'rejected')}>
                  <SelectTrigger className="border border-input">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="border border-border bg-background">
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column - Entity Selection */}
            <div className="space-y-6 border border-border bg-background p-6">
              <h2 className="text-lg font-semibold uppercase tracking-wide">
                Entity Selection
              </h2>

              <div className="space-y-2">
                <Label className="font-semibold uppercase">
                  Client <span className="text-destructive">*</span>
                </Label>
                <EntityCombobox
                  items={clients.map((c) => ({ id: c.id, label: c.name }))}
                  value={selectedClient}
                  onValueChange={(v) => {
                    setSelectedClient(v);
                    setSelectedRequirement(''); // Reset requirement when client changes
                  }}
                  placeholder="Select client"
                  searchPlaceholder="Search clients..."
                  emptyText="No clients found"
                  onCreateNew={() => setCreateClientOpen(true)}
                  createNewLabel="Create New Client"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold uppercase">
                  Job Requirement <span className="text-destructive">*</span>
                </Label>
                <EntityCombobox
                  items={requirements.map((r) => ({ id: r.id, label: r.title }))}
                  value={selectedRequirement}
                  onValueChange={setSelectedRequirement}
                  placeholder="Select requirement"
                  searchPlaceholder="Search requirements..."
                  emptyText="No requirements found"
                  onCreateNew={() => setCreateRequirementOpen(true)}
                  createNewLabel="Create New Requirement"
                  disabled={!selectedClient}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold uppercase">
                  Interviewer <span className="text-destructive">*</span>
                </Label>
                <EntityCombobox
                  items={interviewers.map((i) => ({ id: i.id, label: i.name }))}
                  value={selectedInterviewer}
                  onValueChange={setSelectedInterviewer}
                  placeholder="Select interviewer"
                  searchPlaceholder="Search interviewers..."
                  emptyText="No interviewers found"
                  onCreateNew={() => setCreateInterviewerOpen(true)}
                  createNewLabel="Add New Interviewer"
                  disabled={!selectedClient}
                />
              </div>
            </div>
          </div>

          {/* Evaluation Data Section */}
            <div className="mt-8 border border-border bg-background p-6">
              <h2 className="mb-6 text-lg font-semibold uppercase tracking-wide">
                Evaluation Data
              </h2>

              <div className="grid gap-6 lg:grid-cols-3">
                <FileTextToggle
                  label="Internal Interview Notes"
                  required
                  file={notesFile}
                  text={notesText}
                  onFileChange={setNotesFile}
                  onTextChange={setNotesText}
                />

                <FileTextToggle
                  label="Internal Candidate Scores"
                  required
                  file={scoresFile}
                  text={scoresText}
                  onFileChange={setScoresFile}
                  onTextChange={setScoresText}
                />

                <FileTextToggle
                  label="Client Feedback Notes"
                  required
                  file={feedbackFile}
                  text={feedbackText}
                  onFileChange={setFeedbackFile}
                  onTextChange={setFeedbackText}
                />
              </div>
            </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="border border-input px-8 shadow-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process & Analyze'
              )}
            </Button>
          </div>
        </form>




        {/* Create Entity Dialogs */}
        <CreateClientDialog
          open={createClientOpen}
          onOpenChange={setCreateClientOpen}
          onSubmit={(name) => createClientMutation.mutate(name)}
          isLoading={createClientMutation.isPending}
        />

        <CreateRequirementDialog
          open={createRequirementOpen}
          onOpenChange={setCreateRequirementOpen}
          onSubmit={(data) => createRequirementMutation.mutate(data)}
          isLoading={createRequirementMutation.isPending}
          clientName={selectedClientName}
        />

        <CreateInterviewerDialog
          open={createInterviewerOpen}
          onOpenChange={setCreateInterviewerOpen}
          onSubmit={(data) => createInterviewerMutation.mutate(data)}
          isLoading={createInterviewerMutation.isPending}
        />
      </main>
    </div>
  );
};

export default UploadPage;
