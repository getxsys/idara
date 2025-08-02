'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import {
  CalendarEvent,
  ConflictInfo,
  ConflictType,
  ConflictSeverity,
  ResolutionType,
  TimeSlot
} from '@/types/calendar';

interface ConflictDetectionProps {
  event: CalendarEvent;
  conflicts: ConflictInfo[];
  onResolveConflict: (conflictId: string, resolution: any) => void;
  onAcceptSuggestion: (timeSlot: TimeSlot) => void;
}

export function ConflictDetection({
  event,
  conflicts,
  onResolveConflict,
  onAcceptSuggestion
}: ConflictDetectionProps) {
  const [selectedConflict, setSelectedConflict] = useState<ConflictInfo | null>(null);

  if (conflicts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">No conflicts detected</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            This event doesn't conflict with any existing events.
          </p>
        </CardContent>
      </Card>
    );
  }

  const criticalConflicts = conflicts.filter(c => c.severity === ConflictSeverity.CRITICAL);
  const highConflicts = conflicts.filter(c => c.severity === ConflictSeverity.HIGH);
  const mediumConflicts = conflicts.filter(c => c.severity === ConflictSeverity.MEDIUM);
  const lowConflicts = conflicts.filter(c => c.severity === ConflictSeverity.LOW);

  return (
    <div className="space-y-4">
      {/* Summary Alert */}
      <Alert className={`border-${getSeverityColor(getHighestSeverity(conflicts))}-200 bg-${getSeverityColor(getHighestSeverity(conflicts))}-50`}>
        <AlertTriangle className={`h-4 w-4 text-${getSeverityColor(getHighestSeverity(conflicts))}-600`} />
        <AlertDescription className={`text-${getSeverityColor(getHighestSeverity(conflicts))}-700`}>
          <strong>{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected</strong>
          {criticalConflicts.length > 0 && (
            <span className="ml-2">
              ({criticalConflicts.length} critical, requires immediate attention)
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Conflict List */}
      <div className="space-y-3">
        {conflicts.map((conflict, index) => (
          <ConflictCard
            key={index}
            conflict={conflict}
            event={event}
            onViewDetails={() => setSelectedConflict(conflict)}
            onResolve={(resolution) => onResolveConflict(conflict.conflictingEventId, resolution)}
          />
        ))}
      </div>

      {/* AI Suggestions */}
      {event.aiSuggestions?.conflictResolutions && event.aiSuggestions.conflictResolutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>AI Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {event.aiSuggestions.conflictResolutions.map((resolution, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {resolution.type}
                        </Badge>
                        <span className="text-sm font-medium">{resolution.description}</span>
                      </div>
                      
                      {resolution.alternativeOptions && resolution.alternativeOptions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Alternative time slots:</p>
                          {resolution.alternativeOptions.map((slot, slotIndex) => (
                            <div key={slotIndex} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {slot.startTime.toLocaleDateString()} {slot.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
                                  {slot.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(slot.confidence * 100)}% confidence
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onAcceptSuggestion(slot)}
                              >
                                Accept
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflict Details Dialog */}
      {selectedConflict && (
        <ConflictDetailsDialog
          conflict={selectedConflict}
          event={event}
          onClose={() => setSelectedConflict(null)}
          onResolve={(resolution) => {
            onResolveConflict(selectedConflict.conflictingEventId, resolution);
            setSelectedConflict(null);
          }}
        />
      )}
    </div>
  );
}

interface ConflictCardProps {
  conflict: ConflictInfo;
  event: CalendarEvent;
  onViewDetails: () => void;
  onResolve: (resolution: any) => void;
}

function ConflictCard({ conflict, event, onViewDetails, onResolve }: ConflictCardProps) {
  const severityColor = getSeverityColor(conflict.severity);
  const conflictTypeIcon = getConflictTypeIcon(conflict.conflictType);

  return (
    <Card className={`border-${severityColor}-200`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-full bg-${severityColor}-100`}>
              {conflictTypeIcon}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium">{getConflictTypeLabel(conflict.conflictType)}</h4>
                <Badge 
                  variant="secondary" 
                  className={`text-${severityColor}-700 bg-${severityColor}-100`}
                >
                  {conflict.severity}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {getConflictDescription(conflict, event)}
              </p>
              
              {conflict.suggestedResolution && (
                <div className="flex items-center space-x-2 text-sm">
                  <ArrowRight className="h-3 w-3 text-blue-500" />
                  <span className="text-blue-600">{conflict.suggestedResolution.description}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              Details
            </Button>
            {conflict.suggestedResolution && (
              <Button 
                size="sm" 
                onClick={() => onResolve(conflict.suggestedResolution)}
                className={`bg-${severityColor}-600 hover:bg-${severityColor}-700`}
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ConflictDetailsDialogProps {
  conflict: ConflictInfo;
  event: CalendarEvent;
  onClose: () => void;
  onResolve: (resolution: any) => void;
}

function ConflictDetailsDialog({ conflict, event, onClose, onResolve }: ConflictDetailsDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getConflictTypeIcon(conflict.conflictType)}
            <span>Conflict Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Conflict Overview */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary">{conflict.conflictType}</Badge>
              <Badge 
                variant="secondary" 
                className={`text-${getSeverityColor(conflict.severity)}-700 bg-${getSeverityColor(conflict.severity)}-100`}
              >
                {conflict.severity} Priority
              </Badge>
            </div>
            <p className="text-sm">{getConflictDescription(conflict, event)}</p>
          </div>

          {/* Event Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Current Event</h4>
              <EventSummary event={event} />
            </div>
            <div>
              <h4 className="font-medium mb-2">Conflicting Event</h4>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Event ID: {conflict.conflictingEventId}
                </p>
                {/* In a real implementation, you'd fetch and display the conflicting event details */}
              </div>
            </div>
          </div>

          {/* Resolution Options */}
          {conflict.suggestedResolution && (
            <div>
              <h4 className="font-medium mb-3">Suggested Resolution</h4>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline">{conflict.suggestedResolution.type}</Badge>
                  <span className="font-medium">{conflict.suggestedResolution.description}</span>
                </div>
                
                {conflict.suggestedResolution.newStartTime && conflict.suggestedResolution.newEndTime && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      New time: {conflict.suggestedResolution.newStartTime.toLocaleString()} - 
                      {conflict.suggestedResolution.newEndTime.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {conflict.suggestedResolution.alternativeOptions && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Alternative time slots:</p>
                    <div className="space-y-2">
                      {conflict.suggestedResolution.alternativeOptions.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {slot.startTime.toLocaleDateString()} {slot.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
                              {slot.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(slot.confidence * 100)}% match
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline">
                            Select
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {conflict.suggestedResolution && (
              <Button onClick={() => onResolve(conflict.suggestedResolution)}>
                Apply Resolution
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EventSummary({ event }: { event: CalendarEvent }) {
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <h5 className="font-medium">{event.title}</h5>
      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Clock className="h-3 w-3" />
          <span>
            {event.startTime.toLocaleString()} - {event.endTime.toLocaleString()}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center space-x-2">
            <MapPin className="h-3 w-3" />
            <span>{event.location}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Users className="h-3 w-3" />
          <span>{event.attendees.length} attendees</span>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getHighestSeverity(conflicts: ConflictInfo[]): ConflictSeverity {
  const severityOrder = [
    ConflictSeverity.LOW,
    ConflictSeverity.MEDIUM,
    ConflictSeverity.HIGH,
    ConflictSeverity.CRITICAL
  ];
  
  return conflicts.reduce((highest, conflict) => {
    const currentIndex = severityOrder.indexOf(conflict.severity);
    const highestIndex = severityOrder.indexOf(highest);
    return currentIndex > highestIndex ? conflict.severity : highest;
  }, ConflictSeverity.LOW);
}

function getSeverityColor(severity: ConflictSeverity): string {
  switch (severity) {
    case ConflictSeverity.CRITICAL:
      return 'red';
    case ConflictSeverity.HIGH:
      return 'orange';
    case ConflictSeverity.MEDIUM:
      return 'yellow';
    case ConflictSeverity.LOW:
      return 'blue';
    default:
      return 'gray';
  }
}

function getConflictTypeIcon(type: ConflictType) {
  switch (type) {
    case ConflictType.OVERLAP:
      return <XCircle className="h-4 w-4 text-red-500" />;
    case ConflictType.BACK_TO_BACK:
      return <Clock className="h-4 w-4 text-orange-500" />;
    case ConflictType.TRAVEL_TIME:
      return <MapPin className="h-4 w-4 text-blue-500" />;
    case ConflictType.WORKLOAD:
      return <Users className="h-4 w-4 text-purple-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

function getConflictTypeLabel(type: ConflictType): string {
  switch (type) {
    case ConflictType.OVERLAP:
      return 'Time Overlap';
    case ConflictType.BACK_TO_BACK:
      return 'Back-to-Back Meetings';
    case ConflictType.TRAVEL_TIME:
      return 'Travel Time Conflict';
    case ConflictType.WORKLOAD:
      return 'Workload Conflict';
    default:
      return 'Unknown Conflict';
  }
}

function getConflictDescription(conflict: ConflictInfo, event: CalendarEvent): string {
  switch (conflict.conflictType) {
    case ConflictType.OVERLAP:
      return `This event overlaps with another scheduled event. Both events cannot occur at the same time.`;
    case ConflictType.BACK_TO_BACK:
      return `This event is scheduled immediately before or after another event, leaving no buffer time.`;
    case ConflictType.TRAVEL_TIME:
      return `Insufficient travel time between this event and another event at a different location.`;
    case ConflictType.WORKLOAD:
      return `This event may cause workload conflicts with other scheduled activities.`;
    default:
      return `A scheduling conflict has been detected with another event.`;
  }
}