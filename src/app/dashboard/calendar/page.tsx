'use client';

import React, { useState } from 'react';
import { CalendarInterface } from '@/components/calendar/CalendarInterface';
import { ConflictDetection } from '@/components/calendar/ConflictDetection';
import { ExternalCalendarIntegrationComponent } from '@/components/calendar/ExternalCalendarIntegration';
import { AISchedulingOptimization } from '@/components/calendar/AISchedulingOptimization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Settings,
  ExternalLink,
  Clock,
  Users,
  AlertTriangle
} from 'lucide-react';
import { CalendarEvent, ConflictInfo, TimeSlot } from '@/types/calendar';

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [activeTab, setActiveTab] = useState('calendar');

  // Mock user ID - in real app, this would come from auth context
  const userId = 'user-123';

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    // Set conflicts if any exist
    if (event.conflictDetection) {
      setConflicts(event.conflictDetection);
    } else {
      setConflicts([]);
    }
  };

  const handleEventCreate = (event: CalendarEvent) => {
    console.log('Event created:', event);
    // Handle event creation
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    console.log('Event updated:', event);
    // Handle event update
  };

  const handleEventDelete = (eventId: string) => {
    console.log('Event deleted:', eventId);
    // Handle event deletion
    setSelectedEvent(null);
    setConflicts([]);
  };

  const handleResolveConflict = (conflictId: string, resolution: any) => {
    console.log('Resolving conflict:', conflictId, resolution);
    // Handle conflict resolution
  };

  const handleAcceptSuggestion = (timeSlot: TimeSlot) => {
    console.log('Accepting time slot suggestion:', timeSlot);
    // Handle time slot suggestion acceptance
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Calendar</h1>
          <p className="text-muted-foreground">
            Intelligent scheduling with AI-powered conflict detection and external calendar integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" />
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="ai-optimization" className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>AI Optimization</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <ExternalLink className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Calendar */}
            <div className="lg:col-span-3">
              <CalendarInterface
                userId={userId}
                onEventSelect={handleEventSelect}
                onEventCreate={handleEventCreate}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Events Today</span>
                    </div>
                    <Badge variant="secondary">5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Meetings</span>
                    </div>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Conflicts</span>
                    </div>
                    <Badge variant="destructive">1</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Conflict Detection */}
              {selectedEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConflictDetection
                      event={selectedEvent}
                      conflicts={conflicts}
                      onResolveConflict={handleResolveConflict}
                      onAcceptSuggestion={handleAcceptSuggestion}
                    />
                  </CardContent>
                </Card>
              )}

              {/* AI Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span>AI Suggestions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div className="p-2 bg-blue-50 rounded text-blue-700">
                      💡 Consider scheduling your team meeting earlier to avoid the lunch rush
                    </div>
                    <div className="p-2 bg-green-50 rounded text-green-700">
                      ✅ Your calendar looks optimized for tomorrow
                    </div>
                    <div className="p-2 bg-orange-50 rounded text-orange-700">
                      ⚠️ You have back-to-back meetings from 2-4 PM
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-optimization">
          <AISchedulingOptimization
            userId={userId}
            events={[]} // Would be populated with actual events
            onScheduleOptimized={(optimizedEvents) => {
              console.log('Schedule optimized:', optimizedEvents);
            }}
            onTimeSlotSelected={(timeSlot) => {
              console.log('Time slot selected:', timeSlot);
            }}
          />
        </TabsContent>

        <TabsContent value="integrations">
          <ExternalCalendarIntegrationComponent
            userId={userId}
            onIntegrationChange={(integrations) => {
              console.log('Integrations updated:', integrations);
            }}
          />
        </TabsContent>

        <TabsContent value="settings">
          <CalendarSettingsPanel userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Calendar Settings Panel Component
function CalendarSettingsPanel({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Working Hours</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Set your working hours to help AI scheduling suggestions
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="time"
                  defaultValue="09:00"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="time"
                  defaultValue="17:00"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Time Zone</h4>
            <select className="w-full px-3 py-2 border rounded-md">
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <div>
            <h4 className="font-medium mb-2">Default Event Duration</h4>
            <select className="w-full px-3 py-2 border rounded-md">
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Smart Scheduling</h4>
              <p className="text-sm text-muted-foreground">
                Get AI-powered time slot suggestions
              </p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Conflict Detection</h4>
              <p className="text-sm text-muted-foreground">
                Automatically detect and resolve scheduling conflicts
              </p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Travel Time Optimization</h4>
              <p className="text-sm text-muted-foreground">
                Factor in travel time between meetings
              </p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Meeting Preparation</h4>
              <p className="text-sm text-muted-foreground">
                Get context and preparation suggestions
              </p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}