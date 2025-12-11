import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChapters } from '@/hooks/useChapters';
import { useSubjects } from '@/hooks/useSubjects';
import { SubjectType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { BookOpen, Plus, Search, Mic, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Chapters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectFilter = searchParams.get('subject') as SubjectType | null;
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { chapters, isLoading, createChapter } = useChapters(subjectFilter);
  const { subjects } = useSubjects();
  
  const [newChapter, setNewChapter] = useState({
    name: '',
    description: '',
    subject_id: '',
    lectures_total: 4,
    priority: 1,
  });

  const handleSubjectChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('subject');
    } else {
      searchParams.set('subject', value);
    }
    setSearchParams(searchParams);
  };

  const handleCreateChapter = async () => {
    if (!newChapter.name || !newChapter.subject_id) return;
    
    await createChapter.mutateAsync({
      name: newChapter.name,
      description: newChapter.description || undefined,
      subject_id: newChapter.subject_id,
      lectures_total: newChapter.lectures_total,
      priority: newChapter.priority,
    });
    
    setNewChapter({ name: '', description: '', subject_id: '', lectures_total: 4, priority: 1 });
    setIsDialogOpen(false);
  };

  const filteredChapters = chapters.filter(chapter =>
    chapter.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubjectGradient = (subjectType?: SubjectType) => {
    switch (subjectType) {
      case 'math': return 'gradient-math';
      case 'physics': return 'gradient-physics';
      case 'chemistry': return 'gradient-chemistry';
      default: return 'gradient-primary';
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Chapters</h1>
            <p className="text-muted-foreground mt-1">Manage your study chapters and lectures</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Chapter</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={newChapter.subject_id}
                    onValueChange={(value) => setNewChapter(prev => ({ ...prev, subject_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Chapter Name *</Label>
                  <Input
                    id="name"
                    value={newChapter.name}
                    onChange={(e) => setNewChapter(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Quadratic Equations"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newChapter.description}
                    onChange={(e) => setNewChapter(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lectures">Number of Lectures</Label>
                    <Input
                      id="lectures"
                      type="number"
                      min={1}
                      max={20}
                      value={newChapter.lectures_total}
                      onChange={(e) => setNewChapter(prev => ({ ...prev, lectures_total: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority (1-5)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min={1}
                      max={5}
                      value={newChapter.priority}
                      onChange={(e) => setNewChapter(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateChapter} 
                  className="w-full"
                  disabled={!newChapter.name || !newChapter.subject_id || createChapter.isPending}
                >
                  {createChapter.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Chapter'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Tabs value={subjectFilter || 'all'} onValueChange={handleSubjectChange} className="flex-1">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="math" className="text-math">Math</TabsTrigger>
              <TabsTrigger value="physics" className="text-physics">Physics</TabsTrigger>
              <TabsTrigger value="chemistry" className="text-chemistry">Chemistry</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Chapters Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredChapters.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery ? 'No chapters match your search' : 'No chapters yet. Create your first chapter to get started!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredChapters.map((chapter) => {
              const progress = chapter.lectures_total > 0 
                ? (chapter.lectures_done / chapter.lectures_total) * 100 
                : 0;
              
              return (
                <Link key={chapter.id} to={`/chapters/${chapter.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground',
                          getSubjectGradient(chapter.subject?.subject_type as SubjectType)
                        )}>
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          {chapter.is_completed && (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          )}
                          {chapter.recording_status === 'done' && (
                            <Mic className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                      <CardTitle className="mt-3 text-lg group-hover:text-primary transition-colors">
                        {chapter.name}
                      </CardTitle>
                      {chapter.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {chapter.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Lectures</span>
                          <span className="font-medium">{chapter.lectures_done}/{chapter.lectures_total}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant="secondary" className="text-xs">
                            {chapter.subject?.name}
                          </Badge>
                          <Badge 
                            variant={chapter.is_completed ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {chapter.is_completed ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
