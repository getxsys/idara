'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Settings, Save, Bell, Clock, Filter } from 'lucide-react';
import { notificationService } from '@/lib/services/notification-service';
import {
  NotificationPreferences,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationFrequency,
} from '@/types/notification';

interface NotificationPreferencesDialogProps {
  userId: string;
  onClose: () => void;
  className?: string;
}

export function NotificationPreferencesDialog({
  userId,
  onClose,
  className = '',
}: NotificationPreferencesDialogProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await notificationService.getPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      await notificationService.updatePreferences(preferences);
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGlobalToggle = (enabled: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, globalEnabled: enabled });
  };

  const handleCategoryToggle = (category: NotificationCategory, enabled: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: {
          ...preferences.categories[category],
          enabled,
        },
      },
    });
  };

  const handleChannelToggle = (channel: NotificationChannel, enabled: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel],
          enabled,
        },
      },
    });
  };

  const handleRelevanceThresholdChange = (value: number[]) => {
    if (!preferences) return;
    setPreferences({ ...preferences, relevanceThreshold: value[0] });
  };

  const handleFrequencyChange = (frequency: NotificationFrequency) => {
    if (!preferences) return;
    setPreferences({ ...preferences, frequency });
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        enabled,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading preferences...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p>Failed to load preferences</p>
              <Button onClick={onClose} className="mt-4">Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className={`w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              {/* Global Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn all notifications on or off
                  </p>
                </div>
                <Checkbox
                  checked={preferences.globalEnabled}
                  onCheckedChange={handleGlobalToggle}
                />
              </div>

              {/* Relevance Threshold */}
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Relevance Threshold: {Math.round(preferences.relevanceThreshold * 100)}%
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Only show notifications above this relevance score
                </p>
                <Slider
                  value={[preferences.relevanceThreshold]}
                  onValueChange={handleRelevanceThresholdChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <Label className="text-base font-medium mb-3 block">Delivery Frequency</Label>
                <div className="space-y-2">
                  {Object.values(NotificationFrequency).map((frequency) => (
                    <div key={frequency} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`frequency-${frequency}`}
                        name="frequency"
                        checked={preferences.frequency === frequency}
                        onChange={() => handleFrequencyChange(frequency)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`frequency-${frequency}`} className="text-sm capitalize">
                        {frequency.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="space-y-4">
                {Object.values(NotificationCategory).map((category) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium capitalize">
                        {category.replace('_', ' ')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Notifications related to {category.toLowerCase()}
                      </p>
                    </div>
                    <Checkbox
                      checked={preferences.categories[category]?.enabled ?? true}
                      onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="channels" className="space-y-4">
              <div className="space-y-4">
                {Object.values(NotificationChannel).map((channel) => (
                  <div key={channel} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium capitalize">
                        {channel.replace('_', ' ')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications via {channel.toLowerCase()}
                      </p>
                    </div>
                    <Checkbox
                      checked={preferences.channels[channel]?.enabled ?? true}
                      onCheckedChange={(checked) => handleChannelToggle(channel, checked as boolean)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              {/* Quiet Hours */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-base font-medium">Quiet Hours</Label>
                    <p className="text-sm text-muted-foreground">
                      Suppress non-urgent notifications during these hours
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.quietHours.enabled}
                    onCheckedChange={handleQuietHoursToggle}
                  />
                </div>

                {preferences.quietHours.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                        <input
                          id="start-time"
                          type="time"
                          value={preferences.quietHours.startTime}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            quietHours: {
                              ...preferences.quietHours,
                              startTime: e.target.value,
                            },
                          })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-time" className="text-sm">End Time</Label>
                        <input
                          id="end-time"
                          type="time"
                          value={preferences.quietHours.endTime}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            quietHours: {
                              ...preferences.quietHours,
                              endTime: e.target.value,
                            },
                          })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emergency-override"
                        checked={preferences.quietHours.emergencyOverride}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          quietHours: {
                            ...preferences.quietHours,
                            emergencyOverride: checked as boolean,
                          },
                        })}
                      />
                      <Label htmlFor="emergency-override" className="text-sm">
                        Allow critical notifications during quiet hours
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <div className="flex justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}