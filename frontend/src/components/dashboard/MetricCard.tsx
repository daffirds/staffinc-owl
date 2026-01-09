import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight } from 'lucide-react';

interface MetricCardProps {
    title: string;
    description: string;
    count: number;
    totalRejected: number;
    color: string;
    onViewDetails: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    description,
    count,
    totalRejected,
    color,
    onViewDetails
}) => {
    const data = [
        { name: 'With Issue', value: count },
        { name: 'Without Issue', value: totalRejected - count }
    ];

    return (
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm flex flex-col h-full">
            <div className="mb-4">
                <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                    {title}
                </h3>
                <p className="text-sm text-text-secondary h-10">{description}</p>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[160px]">
                <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                            >
                                <Cell key="cell-0" fill={color} />
                                <Cell key="cell-1" fill="#F3F4F6" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{count}</span>
                    <span className="text-xs text-text-secondary">Candidates</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <button
                    onClick={onViewDetails}
                    className="w-full flex items-center justify-center gap-2 text-primary hover:text-primary-hover font-medium text-sm transition-colors"
                >
                    View Candidates <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default MetricCard;
