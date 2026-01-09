import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MetricCard from '../components/dashboard/MetricCard';
import { type Client } from '../types';
import { Filter } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
        fetchMetrics();
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [selectedClient]);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const url = selectedClient ? `/metrics/overview?client_id=${selectedClient}` : '/metrics/overview';
            const res = await api.get(url);
            setMetrics(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (loading && !metrics) {
        return <div className="p-8 text-center text-text-secondary">Loading dashboard...</div>;
    }

    const { total, accepted, rejected, metrics: gapMetrics } = metrics || { metrics: {} };

    // Calculate rejection rate
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Evaluation Dashboard</h1>
                    <p className="text-text-secondary">Start discovering patterns in your rejections</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-white border border-border rounded px-3 py-2">
                        <Filter size={16} className="text-text-secondary" />
                        <select
                            className="bg-transparent border-none text-sm focus:outline-none"
                            value={selectedClient}
                            onChange={e => setSelectedClient(e.target.value)}
                        >
                            <option value="">All Clients</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm text-center">
                    <div className="text-text-secondary text-sm mb-1">Total Candidates</div>
                    <div className="text-3xl font-bold">{total}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm text-center">
                    <div className="text-text-secondary text-sm mb-1">Accepted</div>
                    <div className="text-3xl font-bold text-success">{accepted}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm text-center">
                    <div className="text-text-secondary text-sm mb-1">Rejected</div>
                    <div className="text-3xl font-bold text-danger">{rejected}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm text-center">
                    <div className="text-text-secondary text-sm mb-1">Rejection Rate</div>
                    <div className="text-3xl font-bold">{rejectionRate}%</div>
                </div>
            </div>

            {/* 4 Quadrants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                <MetricCard
                    title="🕵️ Hidden Criteria"
                    description="Client rejected for reasons not mentioned in original requirements (Unwritten Rules)"
                    count={gapMetrics.hidden_criteria || 0}
                    totalRejected={rejected}
                    color="#3B82F6"
                    onViewDetails={() => alert('Drilldown coming soon!')}
                />
                <MetricCard
                    title="🔀 Assessment Conflict"
                    description="Direct contradiction: Internal says X is good, Client says X is bad"
                    count={gapMetrics.assessment_conflict || 0}
                    totalRejected={rejected}
                    color="#EF4444"
                    onViewDetails={() => alert('Drilldown coming soon!')}
                />
                <MetricCard
                    title="📏 Calibration Gap"
                    description="Same criteria mentioned, but stricter standard applied by client"
                    count={gapMetrics.calibration_gap || 0}
                    totalRejected={rejected}
                    color="#F59E0B"
                    onViewDetails={() => alert('Drilldown coming soon!')}
                />
                <MetricCard
                    title="📊 Score Mismatch"
                    description={`High internal score (Avg > 7) but still rejected. Avg Mismatch Score: ${gapMetrics.score_mismatch_avg?.toFixed(1) || '-'}`}
                    count={gapMetrics.score_mismatch || 0}
                    totalRejected={rejected}
                    color="#8B5CF6" // Purple
                    onViewDetails={() => alert('Drilldown coming soon!')}
                />
            </div>
        </div>
    );
};

export default DashboardPage;
