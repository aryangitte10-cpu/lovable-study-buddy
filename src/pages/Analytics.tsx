import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChapters } from '@/hooks/useChapters';
import { useQuestions } from '@/hooks/useQuestions';
import { useSubjects } from '@/hooks/useSubjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, BookOpen, HelpCircle, CheckCircle2, 
  TrendingUp, Star, Calendar 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7');
  
  const { chapters } = useChapters();
  const { questions } = useQuestions();
  const { subjects } = useSubjects();

  // Calculate stats
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => c.is_completed).length;
  const totalLectures = chapters.reduce((acc, c) => acc + c.lectures_total, 0);
  const completedLectures = chapters.reduce((acc, c) => acc + c.lectures_done, 0);
  const totalQuestions = questions.length;
  const reviewedQuestions = questions.filter(q => q.times_seen > 0).length;

  // Subject breakdown
  const subjectStats = subjects.map(subject => {
    const subjectChapters = chapters.filter(c => c.subject_id === subject.id);
    const completed = subjectChapters.filter(c => c.is_completed).length;
    const total = subjectChapters.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      ...subject,
      completed,
      total,
      progress,
    };
  });

  // Star distribution
  const starDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: questions.filter(q => q.stars === star).length,
  }));

  const maxStarCount = Math.max(...starDistribution.map(s => s.count), 1);

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">Track your progress over time</p>
          </div>
          
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="7">7 Days</TabsTrigger>
              <TabsTrigger value="30">30 Days</TabsTrigger>
              <TabsTrigger value="90">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chapters</p>
                  <p className="text-2xl font-bold">{completedChapters}/{totalChapters}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalChapters > 0 ? ((completedChapters / totalChapters) * 100).toFixed(0) : 0}% complete
                  </p>
                </div>
                <BookOpen className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lectures</p>
                  <p className="text-2xl font-bold">{completedLectures}/{totalLectures}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalLectures > 0 ? ((completedLectures / totalLectures) * 100).toFixed(0) : 0}% complete
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-success/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{totalQuestions}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reviewedQuestions} reviewed
                  </p>
                </div>
                <HelpCircle className="h-10 w-10 text-warning/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">5★ Questions</p>
                  <p className="text-2xl font-bold">{questions.filter(q => q.stars === 5).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    High priority
                  </p>
                </div>
                <Star className="h-10 w-10 text-amber-400/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {subjectStats.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: subject.color || '#6366f1' }}
                      />
                      <span className="font-medium">{subject.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {subject.completed}/{subject.total} chapters
                    </span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                </div>
              ))}
              
              {subjectStats.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No subjects found. Create some chapters to see progress!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Question Difficulty Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {starDistribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-24">
                    {Array.from({ length: star }, (_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div 
                      className="h-8 rounded-lg bg-amber-400/20 transition-all"
                      style={{ width: `${(count / maxStarCount) * 100}%`, minWidth: count > 0 ? '40px' : '0' }}
                    >
                      <div className="h-full flex items-center justify-end pr-2">
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Detailed activity charts coming soon</p>
              <p className="text-sm mt-1">Track your daily progress and streaks</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
