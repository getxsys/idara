'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock,
  Globe,
  User,
  Settings,
  Bell,
  Volume2
} from 'lucide-react';
import { z } from 'zod';
import {
  Client,
  ContactMethod,
  CommunicationStyle,
  CommunicationFrequency,
  DecisionMakingStyle,
  ResponseTimeExpectation,
  ProjectManagementStyle,
} from '@/types/client';

const communicationPreferencesSchema = z.object({
  preferredContactMethod: z.nativeEnum(ContactMethod),
  bestTimeToContact: z.array(z.string()),
  timezone: z.string(),
  language: z.string(),
  communicationStyle: z.nativeEnum(CommunicationStyle),
  communicationFrequency: z.nativeEnum(CommunicationFrequency),
  decisionMakingStyle: z.nativeEnum(DecisionMakingStyle),
  responseTimeExpectation: z.nativeEnum(ResponseTimeExpectation),
  projectManagementStyle: z.nativeEnum(ProjectManagementStyle),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  callReminders: z.boolean(),
  meetingReminders: z.boolean(),
});

type CommunicationPreferencesData = z.infer<typeof communicationPreferencesSchema>;

interface CommunicationPreferencesProps {
  client: Client;
  onPreferencesUpdate: (preferences: CommunicationPreferencesData) => void;
}

const timeSlots = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
  '5:00 PM - 6:00 PM',
];

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

export default function CommunicationPreferences({ client, onPreferencesUpdate }: CommunicationPreferencesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>(
    client.contact.primaryContact.preferences.bestTimeToContact || []
  );

  const form = useForm<CommunicationPreferencesData>({
    resolver: zodResolver(communicationPreferencesSchema),
    defaultValues: {
      preferredContactMethod: client.contact.primaryContact.preferences.preferredContactMethod,
      bestTimeToContact: client.contact.primaryContact.preferences.bestTimeToContact || [],
      timezone: client.contact.primaryContact.preferences.timezone,
      language: client.contact.primaryContact.preferences.language,
      communicationStyle: client.contact.primaryContact.preferences.communicationStyle,
      communicationFrequency: client.aiProfile.preferences.communicationFrequency,
      decisionMakingStyle: client.aiProfile.preferences.decisionMakingStyle,
      responseTimeExpectation: client.aiProfile.preferences.responseTimeExpectation,
      projectManagementStyle: client.aiProfile.preferences.projectManagementStyle,
      emailNotifications: true,
      smsNotifications: false,
      callReminders: true,
      meetingReminders: true,
    },
  });

  const handleSubmit = async (data: CommunicationPreferencesData) => {
    try {
      await onPreferencesUpdate(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const toggleTimeSlot = (timeSlot: string) => {
    const updated = selectedTimeSlots.includes(timeSlot)
      ? selectedTimeSlots.filter(slot => slot !== timeSlot)
      : [...selectedTimeSlots, timeSlot];
    
    setSelectedTimeSlots(updated);
    form.setValue('bestTimeToContact', updated);
  };

  const getContactMethodIcon = (method: ContactMethod) => {
    switch (method) {
      case ContactMethod.EMAIL:
        return <Mail className="h-4 w-4" />;
      case ContactMethod.PHONE:
        return <Phone className="h-4 w-4" />;
      case ContactMethod.SMS:
        return <MessageSquare className="h-4 w-4" />;
      case ContactMethod.VIDEO_CALL:
        return <Calendar className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const formatEnumValue = (value: string) => {
    return value.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Communication Preferences</h3>
            <p className="text-sm text-muted-foreground">
              How {client.contact.primaryContact.firstName} prefers to communicate
            </p>
          </div>
          <Button onClick={() => setIsEditing(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Preferences
          </Button>
        </div>

        {/* Current Preferences Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Contact Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Preferred Method</span>
                <div className="flex items-center space-x-2">
                  {getContactMethodIcon(client.contact.primaryContact.preferences.preferredContactMethod)}
                  <span className="text-sm">
                    {formatEnumValue(client.contact.primaryContact.preferences.preferredContactMethod)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Best Time to Contact</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {client.contact.primaryContact.preferences.bestTimeToContact.map((time) => (
                    <Badge key={time} variant="secondary" className="text-xs">
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Timezone</span>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">{client.contact.primaryContact.preferences.timezone}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Language</span>
                <span className="text-sm">
                  {languages.find(lang => lang.code === client.contact.primaryContact.preferences.language)?.name || 'English'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Communication Style</span>
                <Badge variant="outline">
                  {formatEnumValue(client.contact.primaryContact.preferences.communicationStyle)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Business Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Business Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Communication Frequency</span>
                <Badge variant="outline">
                  {formatEnumValue(client.aiProfile.preferences.communicationFrequency)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Decision Making Style</span>
                <Badge variant="outline">
                  {formatEnumValue(client.aiProfile.preferences.decisionMakingStyle)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Time Expectation</span>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <Badge variant="outline">
                    {formatEnumValue(client.aiProfile.preferences.responseTimeExpectation)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Project Management Style</span>
                <Badge variant="outline">
                  {formatEnumValue(client.aiProfile.preferences.projectManagementStyle)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email Notifications</span>
                <Badge variant="default" className="ml-auto">Enabled</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">SMS Notifications</span>
                <Badge variant="secondary" className="ml-auto">Disabled</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Call Reminders</span>
                <Badge variant="default" className="ml-auto">Enabled</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Meeting Reminders</span>
                <Badge variant="default" className="ml-auto">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Edit Communication Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Update how you prefer to communicate with {client.contact.primaryContact.firstName}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Contact Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Contact Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ContactMethod).map((method) => (
                            <SelectItem key={method} value={method}>
                              {formatEnumValue(method)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="communicationStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CommunicationStyle).map((style) => (
                            <SelectItem key={style} value={style}>
                              {formatEnumValue(style)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Best Time to Contact */}
              <div className="space-y-2">
                <Label>Best Time to Contact</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={selectedTimeSlots.includes(slot) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTimeSlot(slot)}
                      className="justify-start"
                    >
                      <Clock className="mr-2 h-3 w-3" />
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Business Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="communicationFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CommunicationFrequency).map((freq) => (
                            <SelectItem key={freq} value={freq}>
                              {formatEnumValue(freq)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="decisionMakingStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decision Making Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(DecisionMakingStyle).map((style) => (
                            <SelectItem key={style} value={style}>
                              {formatEnumValue(style)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="responseTimeExpectation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Time Expectation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expectation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ResponseTimeExpectation).map((expectation) => (
                            <SelectItem key={expectation} value={expectation}>
                              {formatEnumValue(expectation)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectManagementStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Management Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ProjectManagementStyle).map((style) => (
                            <SelectItem key={style} value={style}>
                              {formatEnumValue(style)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>Email Notifications</span>
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receive email notifications for updates
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smsNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>SMS Notifications</span>
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receive SMS notifications for urgent updates
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="callReminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>Call Reminders</span>
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receive reminders for scheduled calls
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingReminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Meeting Reminders</span>
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receive reminders for scheduled meetings
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Preferences
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}