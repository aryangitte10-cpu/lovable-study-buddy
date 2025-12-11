import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Chapters() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="font-display text-3xl font-bold mb-6">Chapters</h1>
        <Card><CardContent className="p-8 text-center text-muted-foreground">Chapter management coming soon</CardContent></Card>
      </div>
    </AppLayout>
  );
}
