import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChapters } from '@/hooks/useChapters';
import { useQuestions } from '@/hooks/useQuestions';
import { useScheduleTasks } from '@/hooks/useScheduleTasks';
import { useSubjects } from '@/hooks/useSubjects';
import { SubjectType, SUBJECT_CONFIG } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, HelpCircle, CheckCircle2, Clock, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectFilter = searchParams.get('subject') as SubjectType | null;
  
  const { subjects } = useSubjects();
  const { chapters } = useChapters(subjectFilter);
  const { questions } = useQuestions(undefined, new Date().toISOString().split('T')[0]);
  const { tasks } = useScheduleTasks(new Date().toISOString().split('T')[0]);

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => c.is_completed).length;
  const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  const dueQuestions = questions.filter(q => 
    q.next_due && new Date(q.next_due) <= new Date()
  );
  const pendingTasks = tasks.filter(t => !t.is_completed);

  const handleSubjectChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('subject');
    } else {
      searchParams.set('subject', value);
    }
    setSearchParams(searchParams);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your JEE preparation progress</p>
          </div>
          <Link to="/chapters">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Chapter
            </Button>
          </Link>
        </div>

        {/* Subject Filter Tabs */}
        <Tabs value={subjectFilter || 'all'} onValueChange={handleSubjectChange}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all">All Subjects</TabsTrigger>
            <TabsTrigger value="math" className="text-math">Math</TabsTrigger>
            <TabsTrigger value="physics" className="text-physics">Physics</TabsTrigger>
            <TabsTrigger value="chemistry" className="text-chemistry">Chemistry</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedChapters}/{totalChapters}</div>
              <Progress value={progress} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% complete</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Due Questions</CardTitle>
              <HelpCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dueQuestions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Questions to review today</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Tasks</CardTitle>
              <Clock className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending tasks</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.is_completed).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks done today</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Chapters */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Chapters</span>
              <Link to="/chapters">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chapters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No chapters yet. Create your first chapter to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.slice(0, 5).map((chapter) => (
                  <Link key={chapter.id} to={`/chapters/${chapter.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground',
                          chapter.subject?.subject_type === 'math' && 'gradient-math',
                          chapter.subject?.subject_type === 'physics' && 'gradient-physics',
                          chapter.subject?.subject_type === 'chemistry' && 'gradient-chemistry',
                        )}>
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{chapter.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {chapter.lectures_done}/{chapter.lectures_total} lectures
                          </p>
                        </div>
                      </div>
                      <Badge variant={chapter.is_completed ? 'default' : 'secondary'}>
                        {chapter.is_completed ? 'Done' : 'In Progress'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
