import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GapCardProps {
  title: string;
  rejected: number;
  totalRejected: number;
  totalAccepted: number;
  onReviewClick: () => void;
}

const GapCard = ({ title, rejected, totalRejected, totalAccepted, onReviewClick }: GapCardProps) => {
  const otherRejected = totalRejected - rejected;
  
  const data = [
    { name: 'This Gap', value: rejected, color: 'hsl(var(--foreground))' },
    { name: 'Other Reasons', value: otherRejected, color: 'hsl(var(--muted-foreground))' },
    { name: 'Accepted', value: totalAccepted, color: 'hsl(var(--muted))' },
  ].filter(d => d.value > 0);

  const total = rejected + otherRejected + totalAccepted;
  const percentage = total > 0 ? Math.round((rejected / total) * 100) : 0;

  return (
    <Card className="border-2 border-foreground shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-24 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold">{rejected}</div>
            <p className="text-sm text-muted-foreground">
              {percentage}% of total
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-foreground" />
            <span>Rejected by this gap: {rejected}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-muted-foreground" />
            <span>Other reasons: {otherRejected}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-muted" />
            <span>Accepted: {totalAccepted}</span>
          </div>
        </div>
        <Button 
          onClick={onReviewClick} 
          className="mt-4 w-full border-2 border-foreground"
          variant="outline"
        >
          Review Gaps
        </Button>
      </CardContent>
    </Card>
  );
};

export default GapCard;
