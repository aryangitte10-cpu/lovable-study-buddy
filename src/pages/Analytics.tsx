import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChapters } from '@/hooks/useChapters';
import { useQuestions } from '@/hooks/useQuestions';
import { useSubjects } from '@/hooks/useSubjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, BookOpen, HelpCircle, CheckCircle2, 
  TrendingUp, Star, Calendar, Eye
} from 'lucide-react';

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

  // Time-filtered stats
  const timeFilteredStats = useMemo(() => {
    const now = new Date();
    const days = parseInt(timeRange);
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const questionsSeenInRange = questions.filter(q => {
      if (!q.last_seen_at) return false;
      return new Date(q.last_seen_at) >= cutoffDate;
    });
    
    return {
      questionsSeen: questionsSeenInRange.length,
      uniqueQuestionsSeen: questionsSeenInRange.length,
      totalTimesSeen: questionsSeenInRange.reduce((acc, q) => acc + q.times_seen, 0),
    };
  }, [questions, timeRange]);

  // Subject breakdown
  const subjectStats = subjects.map(subject => {
    const subjectChapters = chapters.filter(c => c.subject_id === subject.id);
    const completed = subjectChapters.filter(c => c.is_completed).length;
    const total = subjectChapters.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    const subjectLecturesTotal = subjectChapters.reduce((acc, c) => acc + c.lectures_total, 0);
    const subjectLecturesDone = subjectChapters.reduce((acc, c) => acc + c.lectures_done, 0);
    const lectureProgress = subjectLecturesTotal > 0 ? (subjectLecturesDone / subjectLecturesTotal) * 100 : 0;
    
    return {
      ...subject,
      completed,
      total,
      progress,
      lecturesTotal: subjectLecturesTotal,
      lecturesDone: subjectLecturesDone,
      lectureProgress,
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
                    Total in bank
                  </p>
                </div>
                <HelpCircle className="h-10 w-10 text-warning/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed ({timeRange}d)</p>
                  <p className="text-2xl font-bold text-primary">{timeFilteredStats.questionsSeen}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Questions seen
                  </p>
                </div>
                <Eye className="h-10 w-10 text-primary/20" />
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
                <div key={subject.id} className="space-y-3">
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
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Chapters</span>
                      <span>{subject.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Lectures ({subject.lecturesDone}/{subject.lecturesTotal})</span>
                      <span>{subject.lectureProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={subject.lectureProgress} className="h-1.5" />
                  </div>
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

        {/* Time-filtered Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Summary (Last {timeRange} Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Questions Reviewed</p>
                <p className="text-3xl font-bold">{timeFilteredStats.questionsSeen}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">5★ Questions</p>
                <p className="text-3xl font-bold text-amber-500">
                  {questions.filter(q => q.stars === 5).length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-3xl font-bold text-warning">
                  {questions.filter(q => q.next_due && new Date(q.next_due) <= new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
