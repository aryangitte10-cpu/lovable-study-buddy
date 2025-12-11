import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useScheduleTasks } from '@/hooks/useScheduleTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, CheckCircle2, Clock, BookOpen, 
  HelpCircle, Mic, Trophy, Loader2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

const TASK_ICONS = {
  new_chapter: BookOpen,
  lecture: BookOpen,
  revision_question: HelpCircle,
  revision_recording: Mic,
  weekly_test: Trophy,
};

const TASK_COLORS = {
  new_chapter: 'text-primary',
  lecture: 'text-physics',
  revision_question: 'text-warning',
  revision_recording: 'text-success',
  weekly_test: 'text-destructive',
};

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const { tasks, isLoading, completeTask } = useScheduleTasks(dateStr);

  // Get week days
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Schedule</h1>
            <p className="text-muted-foreground mt-1">Your daily study plan</p>
          </div>
          <Button onClick={goToToday} variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="font-display text-xl font-semibold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h2>
              <Button variant="ghost" size="icon" onClick={goToNextDay}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'flex flex-col items-center p-2 rounded-lg transition-all',
                      isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-secondary',
                      isToday && !isSelected && 'ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    <span className="text-xs font-medium">{format(day, 'EEE')}</span>
                    <span className="text-lg font-bold">{format(day, 'd')}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tasks for Selected Day */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Pending ({pendingTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success/30" />
                  <p>All tasks completed!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => {
                    const Icon = TASK_ICONS[task.task_type] || Clock;
                    const colorClass = TASK_COLORS[task.task_type] || 'text-muted-foreground';
                    
                    return (
                      <div 
                        key={task.id}
                        className="flex items-start justify-between p-3 rounded-lg border hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('mt-0.5', colorClass)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            )}
                            <Badge variant="outline" className="mt-1 text-xs capitalize">
                              {task.task_type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => completeTask.mutate(task.id)}
                          disabled={completeTask.isPending}
                        >
                          Done
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Completed ({completedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No completed tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task) => {
                    const Icon = TASK_ICONS[task.task_type] || Clock;
                    
                    return (
                      <div 
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                      >
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                        <div>
                          <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                          <Badge variant="secondary" className="mt-1 text-xs capitalize">
                            {task.task_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
