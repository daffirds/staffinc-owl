import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUploader from '../components/upload/DocumentUploader';
import ProcessingStatus from '../components/upload/ProcessingStatus';
import api from '../services/api';
import { type Client, type Interviewer, type ClientRequirement } from '../types';

const UploadPage: React.FC = () => {
    const navigate = useNavigate();

    // Data State
    const [clients, setClients] = useState<Client[]>([]);
    const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
    const [requirements, setRequirements] = useState<ClientRequirement[]>([]);

    // Form State
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [newClientName, setNewClientName] = useState('');

    const [selectedReq, setSelectedReq] = useState<string>('');
    const [newReqRole, setNewReqRole] = useState('');
    const [newReqText, setNewReqText] = useState('');

    const [selectedInterviewer, setSelectedInterviewer] = useState<string>('');
    const [newInterviewerName, setNewInterviewerName] = useState('');

    const [candidateName, setCandidateName] = useState('');
    const [candidateRole, setCandidateRole] = useState('');
    const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAccepted, setIsAccepted] = useState(false);

    // Files State
    const [notesFile, setNotesFile] = useState<File | null>(null);
    const [notesText, setNotesText] = useState('');

    const [scoresFile, setScoresFile] = useState<File | null>(null);
    const [scoresText, setScoresText] = useState('');

    const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
    const [feedbackText, setFeedbackText] = useState('');

    // Processing State
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Load Initial Data
    useEffect(() => {
        fetchClients();
        fetchInterviewers();
    }, []);

    // Use Effect to load requirements when client changes
    useEffect(() => {
        if (selectedClient && selectedClient !== 'new') {
            fetchRequirements(selectedClient);
        } else {
            setRequirements([]);
        }
    }, [selectedClient]);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchInterviewers = async () => {
        try {
            const res = await api.get('/interviewers');
            setInterviewers(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchRequirements = async (clientId: string) => {
        try {
            const res = await api.get(`/requirements?client_id=${clientId}`);
            setRequirements(res.data);
        } catch (e) { console.error(e); }
    };

    const handleProcess = async () => {
        if (!candidateName || !candidateRole) {
            alert("Please fill in candidate details");
            return;
        }

        // Check mandatory uploads/texts
        if ((!notesFile && !notesText) || (!scoresFile && !scoresText) || (!feedbackFile && !feedbackText)) {
            alert("Please provide all 3 required documents (Notes, Scores, Feedback)");
            return;
        }

        setStatus('uploading');
        setStatusMsg('Creating records and uploading...');

        try {
            let finalClientId = selectedClient;
            if (selectedClient === 'new') {
                const cRes = await api.post('/clients', { name: newClientName });
                finalClientId = cRes.data.id;
            }

            let finalReqId = selectedReq;
            if (selectedReq === 'new') {
                const rRes = await api.post('/requirements', {
                    client_id: finalClientId,
                    role_title: newReqRole,
                    raw_content: newReqText
                });
                finalReqId = rRes.data.id;
            }

            let finalIntId = selectedInterviewer;
            if (selectedInterviewer === 'new') {
                const iRes = await api.post('/interviewers', { name: newInterviewerName });
                finalIntId = iRes.data.id;
            }

            // Prepare Upload
            const formData = new FormData();

            const metadata = {
                client_requirement_id: finalReqId,
                interviewer_id: finalIntId,
                candidate_name: candidateName,
                role: candidateRole,
                interview_date: interviewDate,
                is_accepted: isAccepted
            };

            formData.append('candidate_data', JSON.stringify(metadata));

            if (notesFile) formData.append('notes_file', notesFile);
            if (notesText) formData.append('notes_text', notesText);

            if (scoresFile) formData.append('scores_file', scoresFile);
            if (scoresText) formData.append('scores_text', scoresText);

            if (feedbackFile) formData.append('feedback_file', feedbackFile);
            if (feedbackText) formData.append('feedback_text', feedbackText);

            setStatus('processing');
            setStatusMsg('Analyzing document contents and gaps...');

            const processRes = await api.post('/upload/process', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setAnalysisResult(processRes.data.gaps);
            setStatus('success');
            setStatusMsg('Analysis Complete');

        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setStatusMsg(e.response?.data?.detail || e.message || 'Unknown error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Process New Candidate</h1>

            {/* 1. Candidate Info Card */}
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm mb-8">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Candidate Information</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Candidate Name</label>
                        <input
                            className="w-full p-2 border border-border rounded"
                            value={candidateName}
                            onChange={e => setCandidateName(e.target.value)}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Applied Role</label>
                        <input
                            className="w-full p-2 border border-border rounded"
                            value={candidateRole}
                            onChange={e => setCandidateRole(e.target.value)}
                            placeholder="e.g. Backend Engineer"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Client</label>
                        <select
                            className="w-full p-2 border border-border rounded"
                            value={selectedClient}
                            onChange={e => { setSelectedClient(e.target.value); setSelectedReq(''); }}
                        >
                            <option value="">Select Client...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            <option value="new">+ Create New Client</option>
                        </select>
                        {selectedClient === 'new' && (
                            <input
                                className="mt-2 w-full p-2 border border-border rounded bg-surface"
                                placeholder="New Client Name"
                                value={newClientName}
                                onChange={e => setNewClientName(e.target.value)}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Role Requirement</label>
                        <select
                            className="w-full p-2 border border-border rounded"
                            value={selectedReq}
                            onChange={e => setSelectedReq(e.target.value)}
                            disabled={!selectedClient || selectedClient === 'new'}
                        >
                            <option value="">Select Requirement...</option>
                            {requirements.map(r => <option key={r.id} value={r.id}>{r.role_title}</option>)}
                            <option value="new">+ Create New Requirement</option>
                        </select>
                        {selectedReq === 'new' && (
                            <div className="mt-2 space-y-2">
                                <input
                                    className="w-full p-2 border border-border rounded bg-surface"
                                    placeholder="Role Title (e.g. Sr Dev)"
                                    value={newReqRole}
                                    onChange={e => setNewReqRole(e.target.value)}
                                />
                                <textarea
                                    className="w-full p-2 border border-border rounded bg-surface text-sm"
                                    placeholder="Paste requirements text..."
                                    value={newReqText}
                                    onChange={e => setNewReqText(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Interviewer</label>
                        <select
                            className="w-full p-2 border border-border rounded"
                            value={selectedInterviewer}
                            onChange={e => setSelectedInterviewer(e.target.value)}
                        >
                            <option value="">Select Interviewer...</option>
                            {interviewers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            <option value="new">+ Create New Interviewer</option>
                        </select>
                        {selectedInterviewer === 'new' && (
                            <input
                                className="mt-2 w-full p-2 border border-border rounded bg-surface"
                                placeholder="New Interviewer Name"
                                value={newInterviewerName}
                                onChange={e => setNewInterviewerName(e.target.value)}
                            />
                        )}
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Interview Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-border rounded"
                                value={interviewDate}
                                onChange={e => setInterviewDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Final Status</label>
                            <div className="flex gap-2 p-2">
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" checked={isAccepted} onChange={() => setIsAccepted(true)} /> Accepted
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" checked={!isAccepted} onChange={() => setIsAccepted(false)} /> Rejected
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Documents Sections */}
            <div className="space-y-6">
                <DocumentUploader
                    label="1. Internal Interview Notes (Summary/Feedback)"
                    fileType="image"
                    required
                    onFileChange={setNotesFile}
                    onTextChange={setNotesText}
                />

                <DocumentUploader
                    label="2. Internal Candidate Scores (Rubric/Ratings)"
                    fileType="pdf"
                    required
                    onFileChange={setScoresFile}
                    onTextChange={setScoresText}
                />

                <DocumentUploader
                    label="3. Client Feedback (Email/Rejection Note)"
                    fileType="image"
                    required
                    onFileChange={setFeedbackFile}
                    onTextChange={setFeedbackText}
                />
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleProcess}
                    className="btn btn-primary px-8 py-3 text-lg shadow-lg"
                >
                    🚀 Process & Analyze
                </button>
            </div>

            <ProcessingStatus
                status={status}
                message={statusMsg}
                result={analysisResult}
                onClose={() => {
                    if (status === 'success') {
                        navigate('/dashboard');
                    } else {
                        setStatus('idle');
                    }
                }}
            />
        </div>
    );
};

export default UploadPage;
