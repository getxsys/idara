'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  Settings,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarViewType,
  EventType,
  EventPriority,
  EventStatus,
  ConflictSeverity
} from '@/types/calendar';
import { CalendarService } from '@/lib/services/calendar-service';
import { CreateEventInput } from '@/lib/validations/calendar';

interface CalendarInterfaceProps {
  userId: string;
  onEventSelect?: (event: CalendarEvent) => void;
  onEventCreate?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

export function CalendarInterface({
  userId,
  onEventSelect,
  onEventCreate,
  onEventUpdate,
  onEventDelete
}: CalendarInterfaceProps) {
  const [currentView, setCurrentView] = useState<CalendarViewType>(CalendarViewType.WEEK);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<EventPriority | 'all'>('all');

  const calendarService = new CalendarService();

  // Load events
  useEffect(() => {
    loadEvents();
  }, [selectedDate, currentView]);

  // Filter events
  useEffect(() => {
    let filtered = [...events];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(event => event.priority === filterPriority);
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, filterType, filterPriority]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const startDate = getViewStartDate(selectedDate, currentView);
      const endDate = getViewEndDate(selectedDate, currentView);
      
      const result = await calendarService.getEvents({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page: 1,
        limit: 100
      });
      
      setEvents(result.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: CreateEventInput) => {
    try {
      const newEvent = await calendarService.createEvent(eventData, userId);
      setEvents(prev => [...prev, newEvent]);
      setIsCreateDialogOpen(false);
      onEventCreate?.(newEvent);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    onEventSelect?.(event);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (currentView) {
      case CalendarViewType.DAY:
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case CalendarViewType.WEEK:
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case CalendarViewType.MONTH:
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case CalendarViewType.YEAR:
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setSelectedDate(newDate);
  };

  const getEventPriorityColor = (priority: EventPriority) => {
    switch (priority) {
      case EventPriority.URGENT:
        return 'bg-red-500';
      case EventPriority.HIGH:
        return 'bg-orange-500';
      case EventPriority.MEDIUM:
        return 'bg-yellow-500';
      case EventPriority.LOW:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConflictSeverityColor = (severity: ConflictSeverity) => {
    switch (severity) {
      case ConflictSeverity.CRITICAL:
        return 'text-red-600';
      case ConflictSeverity.HIGH:
        return 'text-orange-600';
      case ConflictSeverity.MEDIUM:
        return 'text-yellow-600';
      case ConflictSeverity.LOW:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString();
    const endStr = end.toLocaleDateString();
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Calendar</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-lg font-medium">
            {formatDateRange(
              getViewStartDate(selectedDate, currentView),
              getViewEndDate(selectedDate, currentView)
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          {/* Filters */}
          <Select value={filterType} onValueChange={(value) => setFilterType(value as EventType | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.values(EventType).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as EventPriority | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {Object.values(EventPriority).map(priority => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Create Event */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <CreateEventForm onSubmit={handleCreateEvent} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View Selector */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as CalendarViewType)}>
        <TabsList>
          <TabsTrigger value={CalendarViewType.DAY}>Day</TabsTrigger>
          <TabsTrigger value={CalendarViewType.WEEK}>Week</TabsTrigger>
          <TabsTrigger value={CalendarViewType.MONTH}>Month</TabsTrigger>
          <TabsTrigger value={CalendarViewType.AGENDA}>Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value={CalendarViewType.DAY} className="mt-4">
          <DayView
            date={selectedDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value={CalendarViewType.WEEK} className="mt-4">
          <WeekView
            date={selectedDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value={CalendarViewType.MONTH} className="mt-4">
          <MonthView
            date={selectedDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateSelect={setSelectedDate}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value={CalendarViewType.AGENDA} className="mt-4">
          <AgendaView
            events={filteredEvents}
            onEventClick={handleEventClick}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Event Details Sidebar */}
      {selectedEvent && (
        <EventDetailsSidebar
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
        />
      )}
    </div>
  );
}

// Helper functions
function getViewStartDate(date: Date, view: CalendarViewType): Date {
  const start = new Date(date);
  
  switch (view) {
    case CalendarViewType.DAY:
      start.setHours(0, 0, 0, 0);
      return start;
    case CalendarViewType.WEEK:
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek + 1); // Start on Monday
      start.setHours(0, 0, 0, 0);
      return start;
    case CalendarViewType.MONTH:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return start;
    case CalendarViewType.YEAR:
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return start;
    default:
      return start;
  }
}

function getViewEndDate(date: Date, view: CalendarViewType): Date {
  const end = new Date(date);
  
  switch (view) {
    case CalendarViewType.DAY:
      end.setHours(23, 59, 59, 999);
      return end;
    case CalendarViewType.WEEK:
      const dayOfWeek = end.getDay();
      end.setDate(end.getDate() - dayOfWeek + 7); // End on Sunday
      end.setHours(23, 59, 59, 999);
      return end;
    case CalendarViewType.MONTH:
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return end;
    case CalendarViewType.YEAR:
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      return end;
    default:
      return end;
  }
}

// Sub-components (simplified implementations)
function DayView({ date, events, onEventClick, isLoading }: any) {
  const dayEvents = events.filter((event: CalendarEvent) => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === date.toDateString();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : dayEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No events scheduled</div>
        ) : (
          <div className="space-y-2">
            {dayEvents.map((event: CalendarEvent) => (
              <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeekView({ date, events, onEventClick, isLoading }: any) {
  const weekStart = getViewStartDate(date, CalendarViewType.WEEK);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, index) => {
        const dayEvents = events.filter((event: CalendarEvent) => {
          const eventDate = new Date(event.startTime);
          return eventDate.toDateString() === day.toDateString();
        });

        return (
          <Card key={index} className="min-h-[200px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {dayEvents.map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded cursor-pointer hover:bg-muted"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-muted-foreground">
                      {event.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MonthView({ date, events, onEventClick, onDateSelect, isLoading }: any) {
  return (
    <Card>
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateSelect}
          className="rounded-md border-0"
        />
      </CardContent>
    </Card>
  );
}

function AgendaView({ events, onEventClick, isLoading }: any) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No events found</div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event: CalendarEvent) => (
              <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventCard({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  return (
    <div
      className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium">{event.title}</h4>
            <Badge variant="secondary" className="text-xs">
              {event.type}
            </Badge>
            <div className={`w-2 h-2 rounded-full ${getEventPriorityColor(event.priority)}`} />
          </div>
          
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>
                {event.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
                {event.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.attendees.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{event.attendees.length} attendees</span>
              </div>
            )}
          </div>

          {event.conflictDetection && event.conflictDetection.length > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600">
                {event.conflictDetection.length} conflict(s) detected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateEventForm({ onSubmit }: { onSubmit: (data: CreateEventInput) => void }) {
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    location: '',
    isAllDay: false,
    type: EventType.MEETING,
    priority: EventPriority.MEDIUM,
    attendees: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={formData.startTime.toISOString().slice(0, 16)}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={formData.endTime.toISOString().slice(0, 16)}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: new Date(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isAllDay"
          checked={formData.isAllDay}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAllDay: checked }))}
        />
        <Label htmlFor="isAllDay">All Day Event</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as EventType }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(EventType).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as EventPriority }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(EventPriority).map(priority => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Create Event</Button>
      </div>
    </form>
  );
}

function EventDetailsSidebar({ event, onClose, onUpdate, onDelete }: any) {
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Event Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">{event.title}</h4>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>
                {event.startTime.toLocaleString()} - {event.endTime.toLocaleString()}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{event.attendees.length} attendees</span>
            </div>
          </div>

          {event.conflictDetection && event.conflictDetection.length > 0 && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-orange-700">Conflicts Detected</span>
              </div>
              <div className="space-y-1">
                {event.conflictDetection.map((conflict: any, index: number) => (
                  <div key={index} className="text-sm text-orange-600">
                    {conflict.conflictType}: {conflict.suggestedResolution?.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Edit</Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete?.(event.id)}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getEventPriorityColor(priority: EventPriority): string {
  switch (priority) {
    case EventPriority.URGENT:
      return 'bg-red-500';
    case EventPriority.HIGH:
      return 'bg-orange-500';
    case EventPriority.MEDIUM:
      return 'bg-yellow-500';
    case EventPriority.LOW:
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}