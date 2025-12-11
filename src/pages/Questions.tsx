import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuestions } from '@/hooks/useQuestions';
import { useChapters } from '@/hooks/useChapters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Star, Clock, Eye, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Questions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState<string>('all');
  const [showDueOnly, setShowDueOnly] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const { questions, isLoading, markQuestionSeen } = useQuestions(undefined, showDueOnly ? today : undefined);
  const { chapters } = useChapters();

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.chapter?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStars = starFilter === 'all' || q.stars === parseInt(starFilter);
    return matchesSearch && matchesStars;
  });

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

  const stats = {
    total: questions.length,
    fiveStar: questions.filter(q => q.stars === 5).length,
    fourStar: questions.filter(q => q.stars === 4).length,
    threeStar: questions.filter(q => q.stars === 3).length,
    dueToday: questions.filter(q => q.next_due && new Date(q.next_due) <= new Date()).length,
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Question Bank</h1>
            <p className="text-muted-foreground mt-1">Review and track your important questions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">5★ Questions</p>
              <p className="text-2xl font-bold text-amber-500">{stats.fiveStar}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">4★ Questions</p>
              <p className="text-2xl font-bold text-amber-400">{stats.fourStar}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">3★ Questions</p>
              <p className="text-2xl font-bold">{stats.threeStar}</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Due Today</p>
              <p className="text-2xl font-bold text-warning">{stats.dueToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Tabs value={starFilter} onValueChange={setStarFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="5">5★</TabsTrigger>
              <TabsTrigger value="4">4★</TabsTrigger>
              <TabsTrigger value="3">3★</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button 
            variant={showDueOnly ? 'default' : 'outline'}
            onClick={() => setShowDueOnly(!showDueOnly)}
          >
            <Clock className="mr-2 h-4 w-4" />
            Due Today
          </Button>
        </div>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredQuestions.length} Question{filteredQuestions.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || starFilter !== 'all' ? 'No questions match your filters' : 'No questions yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((question) => {
                  const isDue = question.next_due && new Date(question.next_due) <= new Date();
                  
                  return (
                    <div 
                      key={question.id}
                      className={cn(
                        'p-4 rounded-lg border transition-colors',
                        isDue ? 'bg-warning/5 border-warning/20' : 'hover:bg-secondary/30'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {question.chapter?.name || 'Unknown Chapter'}
                            </Badge>
                            {isDue && (
                              <Badge variant="destructive" className="text-xs">
                                Due
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{question.content}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              {renderStars(question.stars)}
                            </div>
                            {question.tags && question.tags.length > 0 && (
                              <div className="flex gap-1">
                                {question.tags.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
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
                          variant={isDue ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => markQuestionSeen.mutate(question.id)}
                          disabled={markQuestionSeen.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Mark Seen
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
