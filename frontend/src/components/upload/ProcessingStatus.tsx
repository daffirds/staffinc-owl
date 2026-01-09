import React from 'react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProcessingStatusProps {
    status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
    message?: string;
    result?: any;
    onClose?: () => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status, message, result, onClose }) => {
    if (status === 'idle') return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                <div className="flex flex-col items-center text-center">
                    {status === 'uploading' || status === 'processing' ? (
                        <Loader2 className="animate-spin text-primary mb-4" size={48} />
                    ) : status === 'success' ? (
                        <CheckCircle className="text-success mb-4" size={48} />
                    ) : (
                        <AlertTriangle className="text-danger mb-4" size={48} />
                    )}

                    <h3 className="text-xl font-bold mb-2">
                        {status === 'uploading' ? 'Uploading Documents...' :
                            status === 'processing' ? 'Analyzing Gaps...' :
                                status === 'success' ? 'Analysis Complete!' : 'Error Occurred'}
                    </h3>

                    <p className="text-text-secondary mb-6">{message}</p>

                    {status === 'success' && result && (
                        <div className="w-full bg-surface p-4 rounded mb-6 text-left text-sm">
                            <div className="font-semibold mb-2">Findings:</div>
                            <ul className="space-y-1">
                                {result.has_hidden_criteria && <li className="text-info">Has Hidden Criteria</li>}
                                {result.has_assessment_conflict && <li className="text-danger">Assessment Conflict Detected</li>}
                                {result.has_calibration_gap && <li className="text-warning">Calibration Gap Detected</li>}
                                {result.has_score_mismatch && <li className="text-danger">Score Mismatch Detected</li>}
                            </ul>
                            <div className="mt-2 text-xs text-center text-text-secondary">
                                Wait for redirect to details...
                            </div>
                        </div>
                    )}

                    {(status === 'success' || status === 'error') && (
                        <button
                            onClick={onClose}
                            className="btn btn-primary w-full"
                        >
                            {status === 'success' ? 'View Details' : 'Close'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcessingStatus;
