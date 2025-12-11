import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function Analytics() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="font-display text-3xl font-bold mb-6">Analytics</h1>
        <Card><CardContent className="p-8 text-center text-muted-foreground">Analytics coming soon</CardContent></Card>
      </div>
    </AppLayout>
  );
}
