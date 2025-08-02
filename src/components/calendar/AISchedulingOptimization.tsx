'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Clock,
  MapPin,
  Users,
  Zap,
  TrendingUp,
  Calendar,
  Route,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  CalendarEvent,
  TimeSlot,
  EventPriority,
  TransportMode,
} from '@/types/calendar';
import {
  SchedulingOptimizationService,
  OptimizationContext,
  MeetingContext,
  ScheduleImprovement,
} from '@/lib/services/scheduling-optimization';

interface AISchedulingOptimizationProps {
  userId: string;
  events: CalendarEvent[];
  onScheduleOptimized?: (optimizedEvents: CalendarEvent[]) => void;
  onTimeSlotSelected?: (timeSlot: TimeSlot) => void;
}

export function AISchedulingOptimization({
  userId,
  events,
  onScheduleOptimized,
  onTimeSlotSelected,
}: AISchedulingOptimizationProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [selectedOptimization, setSelectedOptimization] = useState<string>('smart_scheduling');
  const [isSmartSchedulingOpen, setIsSmartSchedulingOpen] = useState(false);
  const [isMeetingOptimizerOpen, setIsMeetingOptimizerOpen] = useState(false);
  const [isScheduleAnalysisOpen, setIsScheduleAnalysisOpen] = useState(false);

  const optimizationService = new SchedulingOptimizationService();

  const optimizationOptions = [
    {
      id: 'smart_scheduling',
      title: 'Smart Scheduling',
      description: 'AI-powered time slot suggestions based on your preferences and availability',
      icon: Brain,
      color: 'bg-blue-500',
    },
    {
      id: 'meeting_optimizer',
      title: 'Meeting Optimizer',
      description: 'Optimize meeting times for multiple participants with travel considerations',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      id: 'schedule_analysis',
      title: 'Schedule Analysis',
      description: 'Analyze and optimize your entire schedule for better productivity',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      id: 'travel_optimization',
      title: 'Travel Optimization',
      description: 'Minimize travel time and optimize routes between meetings',
      icon: Route,
      color: 'bg-orange-500',
    },
  ];

  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      const context: OptimizationContext = {
        userPreferences: {
          defaultView: 'WEEK' as any,
          workingHours: {
            monday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
            tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
            wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
            thursday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
            friday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
            saturday: { isWorkingDay: false, startTime: '09:00', endTime: '17:00', breaks: [] },
            sunday: { isWorkingDay: false, startTime: '09:00', endTime: '17:00', breaks: [] },
          },
          timeZone: 'UTC',
          weekStartsOn: 1,
          showWeekends: true,
          defaultEventDuration: 60,
          reminderDefaults: [],
        },
        existingEvents: events,
      };

      const result = await optimizationService.optimizeSchedule(events, context);
      setOptimizationResults(result);
      onScheduleOptimized?.(result.optimizedEvents);
    } catch (error) {
      console.error('Schedule optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <span>AI Scheduling Optimization</span>
          </h2>
          <p className="text-muted-foreground">
            Leverage AI to optimize your schedule and improve productivity
          </p>
        </div>
        <Button
          onClick={handleOptimizeSchedule}
          disabled={isOptimizing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isOptimizing ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-pulse" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Optimize Schedule
            </>
          )}
        </Button>
      </div>

      {/* Optimization Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {optimizationOptions.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedOptimization === option.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedOptimization(option.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${option.color}`}>
                  <option.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">{option.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Optimization Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Smart Scheduling</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get AI-powered suggestions for optimal meeting times
            </p>
            <Dialog open={isSmartSchedulingOpen} onOpenChange={setIsSmartSchedulingOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Find Optimal Times
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Smart Scheduling Assistant</DialogTitle>
                </DialogHeader>
                <SmartSchedulingForm
                  onTimeSlotSelected={onTimeSlotSelected}
                  onClose={() => setIsSmartSchedulingOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Meeting Optimizer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span>Meeting Optimizer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Optimize meetings for multiple participants
            </p>
            <Dialog open={isMeetingOptimizerOpen} onOpenChange={setIsMeetingOptimizerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Optimize Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Meeting Optimization</DialogTitle>
                </DialogHeader>
                <MeetingOptimizerForm
                  onOptimized={() => setIsMeetingOptimizerOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Schedule Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span>Schedule Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analyze your schedule for productivity insights
            </p>
            <Dialog open={isScheduleAnalysisOpen} onOpenChange={setIsScheduleAnalysisOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Analyze Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Schedule Analysis & Insights</DialogTitle>
                </DialogHeader>
                <ScheduleAnalysisPanel
                  events={events}
                  onClose={() => setIsScheduleAnalysisOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Results */}
      {optimizationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Optimization Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizationResults
              results={optimizationResults}
              onApplyChanges={() => {
                onScheduleOptimized?.(optimizationResults.optimizedEvents);
                setOptimizationResults(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AIInsightsPanel events={events} />
        </CardContent>
      </Card>
    </div>
  );
}

// Smart Scheduling Form Component
function SmartSchedulingForm({
  onTimeSlotSelected,
  onClose,
}: {
  onTimeSlotSelected?: (timeSlot: TimeSlot) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    duration: 60,
    attendees: '',
    priority: EventPriority.MEDIUM,
    location: '',
    isVirtual: false,
  });
  const [suggestions, setSuggestions] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFindTimes = async () => {
    setIsLoading(true);
    try {
      // Mock AI suggestions
      const mockSuggestions: TimeSlot[] = [
        {
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + formData.duration * 60 * 1000),
          confidence: 0.95,
          reason: 'Optimal time - high energy, no conflicts, good for all participants',
        },
        {
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + formData.duration * 60 * 1000),
          confidence: 0.88,
          reason: 'Good alternative - minimal conflicts, within working hours',
        },
        {
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + formData.duration * 60 * 1000),
          confidence: 0.82,
          reason: 'Available slot - some travel considerations',
        },
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to find optimal times:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Meeting Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter meeting title"
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            min="15"
            max="480"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="attendees">Attendees (emails, comma-separated)</Label>
        <Textarea
          id="attendees"
          value={formData.attendees}
          onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
          placeholder="john@example.com, jane@example.com"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as EventPriority }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EventPriority.LOW}>Low</SelectItem>
              <SelectItem value={EventPriority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={EventPriority.HIGH}>High</SelectItem>
              <SelectItem value={EventPriority.URGENT}>Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Meeting room or address"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isVirtual"
          checked={formData.isVirtual}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVirtual: checked }))}
        />
        <Label htmlFor="isVirtual">Virtual Meeting</Label>
      </div>

      <Button
        onClick={handleFindTimes}
        disabled={isLoading || !formData.title}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Brain className="h-4 w-4 mr-2 animate-pulse" />
            Finding Optimal Times...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Find Optimal Times
          </>
        )}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">AI Suggestions</h4>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">
                    {suggestion.startTime.toLocaleDateString()} at{' '}
                    {suggestion.startTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {Math.round(suggestion.confidence * 100)}% match
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{suggestion.reason}</p>
              <Button
                size="sm"
                onClick={() => {
                  onTimeSlotSelected?.(suggestion);
                  onClose();
                }}
              >
                Select This Time
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Meeting Optimizer Form Component
function MeetingOptimizerForm({ onOptimized }: { onOptimized: () => void }) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    // Mock optimization process
    setTimeout(() => {
      setIsOptimizing(false);
      onOptimized();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Meeting Optimization</h3>
        <p className="text-muted-foreground">
          Optimize meeting times considering all participants' availability, travel time, and preferences
        </p>
      </div>

      <Button onClick={handleOptimize} disabled={isOptimizing} className="w-full">
        {isOptimizing ? (
          <>
            <Brain className="h-4 w-4 mr-2 animate-pulse" />
            Optimizing Meeting...
          </>
        ) : (
          <>
            <Target className="h-4 w-4 mr-2" />
            Optimize Meeting
          </>
        )}
      </Button>
    </div>
  );
}

// Schedule Analysis Panel Component
function ScheduleAnalysisPanel({
  events,
  onClose,
}: {
  events: CalendarEvent[];
  onClose: () => void;
}) {
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    // Mock analysis data
    setAnalysisData({
      productivityScore: 78,
      timeUtilization: 85,
      meetingEfficiency: 72,
      workLifeBalance: 68,
      insights: [
        {
          type: 'warning',
          title: 'High Meeting Load',
          description: 'You have 65% of your time in meetings. Consider consolidating or delegating some meetings.',
          impact: 'high',
        },
        {
          type: 'success',
          title: 'Good Time Blocking',
          description: 'Your focus time blocks are well-distributed throughout the week.',
          impact: 'medium',
        },
        {
          type: 'info',
          title: 'Travel Optimization',
          description: 'You could save 2 hours per week by optimizing travel between meetings.',
          impact: 'medium',
        },
      ],
    });
  }, [events]);

  if (!analysisData) {
    return <div>Loading analysis...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{analysisData.productivityScore}%</div>
          <div className="text-sm text-muted-foreground">Productivity Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{analysisData.timeUtilization}%</div>
          <div className="text-sm text-muted-foreground">Time Utilization</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{analysisData.meetingEfficiency}%</div>
          <div className="text-sm text-muted-foreground">Meeting Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{analysisData.workLifeBalance}%</div>
          <div className="text-sm text-muted-foreground">Work-Life Balance</div>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <h4 className="font-medium">AI Insights & Recommendations</h4>
        {analysisData.insights.map((insight: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-start space-x-3">
              {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />}
              {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
              {insight.type === 'info' && <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />}
              <div className="flex-1">
                <h5 className="font-medium">{insight.title}</h5>
                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                <Badge
                  variant="secondary"
                  className={`mt-2 ${
                    insight.impact === 'high'
                      ? 'bg-red-100 text-red-800'
                      : insight.impact === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {insight.impact} impact
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onClose} className="w-full">
        Close Analysis
      </Button>
    </div>
  );
}

// Optimization Results Component
function OptimizationResults({
  results,
  onApplyChanges,
}: {
  results: any;
  onApplyChanges: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Optimization Complete</h4>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {results.improvements.length} improvements found
        </Badge>
      </div>

      <div className="space-y-3">
        {results.improvements.map((improvement: ScheduleImprovement, index: number) => (
          <div key={index} className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-green-800">{improvement.description}</h5>
                <p className="text-sm text-green-600">
                  Saves {improvement.timesSaved} minutes • {improvement.impact} impact
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <div className="text-sm text-muted-foreground">Energy Score</div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(results.energyScore * 100)}%
          </div>
        </div>
        <Button onClick={onApplyChanges} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          Apply Changes
        </Button>
      </div>
    </div>
  );
}

// AI Insights Panel Component
function AIInsightsPanel({ events }: { events: CalendarEvent[] }) {
  const insights = [
    {
      icon: Clock,
      title: 'Peak Productivity Hours',
      description: 'Your most productive hours are 9-11 AM and 2-4 PM based on meeting patterns.',
      action: 'Schedule important tasks during these times',
    },
    {
      icon: MapPin,
      title: 'Travel Optimization',
      description: 'You could save 90 minutes per week by grouping meetings by location.',
      action: 'Optimize travel routes',
    },
    {
      icon: Users,
      title: 'Meeting Efficiency',
      description: '23% of your meetings could be shorter or replaced with async communication.',
      action: 'Review meeting necessity',
    },
  ];

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
          <insight.icon className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-medium text-blue-900">{insight.title}</h5>
            <p className="text-sm text-blue-700 mt-1">{insight.description}</p>
            <Button variant="link" className="p-0 h-auto text-blue-600 text-sm">
              {insight.action} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}