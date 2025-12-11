import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChapters } from '@/hooks/useChapters';
import { useLectures } from '@/hooks/useLectures';
import { useQuestions } from '@/hooks/useQuestions';
import { useRecordings } from '@/hooks/useRecordings';
import { SubjectType, STAR_COLORS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, BookOpen, HelpCircle, Mic, Plus, Star, 
  CheckCircle2, Clock, Loader2, Eye 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChapterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { chapters } = useChapters();
  const { lectures, isLoading: lecturesLoading, markLectureDone } = useLectures(id);
  const { questions, isLoading: questionsLoading, createQuestion, markQuestionSeen } = useQuestions(id);
  const { recordings, markRecordingDone } = useRecordings(id);
  
  const chapter = chapters.find(c => c.id === id);
  const recording = recordings[0];
  
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    content: '',
    stars: 3,
    tags: '',
  });

  const handleAddQuestion = async () => {
    if (!newQuestion.content || !id) return;
    
    await createQuestion.mutateAsync({
      chapter_id: id,
      content: newQuestion.content,
      stars: newQuestion.stars,
      tags: newQuestion.tags ? newQuestion.tags.split(',').map(t => t.trim()) : [],
    });
    
    setNewQuestion({ content: '', stars: 3, tags: '' });
    setIsQuestionDialogOpen(false);
  };

  const getSubjectGradient = (subjectType?: SubjectType) => {
    switch (subjectType) {
      case 'math': return 'gradient-math';
      case 'physics': return 'gradient-physics';
      case 'chemistry': return 'gradient-chemistry';
      default: return 'gradient-primary';
    }
  };

  if (!chapter) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={cn(
          'h-4 w-4',
          i < count ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
        )} 
      />
    ));
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chapters')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center text-primary-foreground',
                getSubjectGradient(chapter.subject?.subject_type as SubjectType)
              )}>
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">{chapter.name}</h1>
                <p className="text-muted-foreground">{chapter.subject?.name}</p>
              </div>
            </div>
            {chapter.description && (
              <p className="text-muted-foreground mt-2">{chapter.description}</p>
            )}
          </div>
          <Badge variant={chapter.is_completed ? 'default' : 'secondary'}>
            {chapter.is_completed ? 'Completed' : 'In Progress'}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lectures</p>
                  <p className="text-2xl font-bold">{chapter.lectures_done}/{chapter.lectures_total}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{questions.length}</p>
                </div>
                <HelpCircle className="h-8 w-8 text-warning/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">5★ Questions</p>
                  <p className="text-2xl font-bold">{questions.filter(q => q.stars === 5).length}</p>
                </div>
                <Star className="h-8 w-8 text-amber-400/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recording</p>
                  <p className="text-2xl font-bold capitalize">{chapter.recording_status}</p>
                </div>
                <Mic className="h-8 w-8 text-success/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lectures" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lectures" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Lectures
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="recording" className="gap-2">
              <Mic className="h-4 w-4" />
              Recording
            </TabsTrigger>
          </TabsList>

          {/* Lectures Tab */}
          <TabsContent value="lectures">
            <Card>
              <CardHeader>
                <CardTitle>Lectures</CardTitle>
              </CardHeader>
              <CardContent>
                {lecturesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : lectures.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No lectures found</p>
                ) : (
                  <div className="space-y-2">
                    {lectures.map((lecture) => (
                      <div 
                        key={lecture.id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border transition-colors',
                          lecture.is_completed ? 'bg-success/5 border-success/20' : 'hover:bg-secondary/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={lecture.is_completed}
                            disabled={lecture.is_completed || markLectureDone.isPending}
                            onCheckedChange={() => markLectureDone.mutate(lecture.id)}
                          />
                          <div>
                            <p className={cn(
                              'font-medium',
                              lecture.is_completed && 'line-through text-muted-foreground'
                            )}>
                              {lecture.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Lecture {lecture.lecture_number}
                            </p>
                          </div>
                        </div>
                        {lecture.is_completed ? (
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Done</span>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markLectureDone.mutate(lecture.id)}
                            disabled={markLectureDone.isPending}
                          >
                            Mark Done
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Questions</CardTitle>
                <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Question Content *</Label>
                        <Input
                          value={newQuestion.content}
                          onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Enter question or topic..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty (Stars)</Label>
                        <Select
                          value={newQuestion.stars.toString()}
                          onValueChange={(value) => setNewQuestion(prev => ({ ...prev, stars: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 4, 3, 2, 1].map((star) => (
                              <SelectItem key={star} value={star.toString()}>
                                <div className="flex items-center gap-2">
                                  {renderStars(star)}
                                  <span className="ml-2">{star} Star{star !== 1 ? 's' : ''}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tags (comma-separated)</Label>
                        <Input
                          value={newQuestion.tags}
                          onChange={(e) => setNewQuestion(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="e.g., algebra, important, pyq"
                        />
                      </div>
                      <Button 
                        onClick={handleAddQuestion} 
                        className="w-full"
                        disabled={!newQuestion.content || createQuestion.isPending}
                      >
                        {createQuestion.isPending ? 'Adding...' : 'Add Question'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {questionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : questions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No questions yet. Add your first question!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {questions.map((question) => (
                      <div 
                        key={question.id}
                        className="p-4 rounded-lg border hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{question.content}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                {renderStars(question.stars)}
                              </div>
                              {question.tags && question.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {question.tags.slice(0, 3).map((tag, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Seen {question.times_seen}x
                              </span>
                              {question.next_due && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due: {new Date(question.next_due).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markQuestionSeen.mutate(question.id)}
                            disabled={markQuestionSeen.isPending}
                          >
                            Mark Seen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recording Tab */}
          <TabsContent value="recording">
            <Card>
              <CardHeader>
                <CardTitle>Recording</CardTitle>
              </CardHeader>
              <CardContent>
                {!chapter.is_completed ? (
                  <div className="text-center py-8">
                    <Mic className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      Complete all lectures to unlock recording
                    </p>
                  </div>
                ) : chapter.recording_status === 'done' ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
                    <p className="font-medium text-success">Recording Completed!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've finished your revision recording for this chapter.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mic className="h-12 w-12 mx-auto text-primary/30 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Record your revision notes for this chapter
                    </p>
                    <Button 
                      onClick={() => markRecordingDone.mutate(chapter.id)}
                      disabled={markRecordingDone.isPending}
                    >
                      {markRecordingDone.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark Recording Done
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
