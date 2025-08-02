import { supabase } from '@/lib/supabase/client';
import { CreateEventInput } from '@/lib/validations/calendar';
import { CalendarEvent, EventType, EventPriority, EventStatus } from '@/types/calendar';

export class SupabaseCalendarService {
  async createEvent(eventData: CreateEventInput, organizerId: string): Promise<CalendarEvent> {
    try {
      // Insert calendar event data into Supabase
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          location: eventData.location,
          is_all_day: eventData.isAllDay,
          type: eventData.type,
          priority: eventData.priority,
          status: 'CONFIRMED',
          organizer_id: organizerId,
          project_id: eventData.projectId || null,
          client_id: eventData.clientId || null,
          ai_suggestions: eventData.aiSuggestions || null,
          metadata: eventData.metadata || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create event: ${error.message}`);
      }

      // Add event attendees if specified
      if (eventData.attendees && eventData.attendees.length > 0) {
        const attendeeInserts = eventData.attendees.map(attendee => ({
          event_id: data.id,
          email: attendee.email,
          name: attendee.name,
          user_id: attendee.userId || null,
          status: attendee.status || 'PENDING',
          is_optional: attendee.isOptional || false,
        }));

        const { error: attendeeError } = await supabase
          .from('event_attendees')
          .insert(attendeeInserts);

        if (attendeeError) {
          console.error('Failed to add event attendees:', attendeeError);
        }
      }

      return this.mapSupabaseEventToCalendarEvent(data);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async getEvent(id: string): Promise<CalendarEvent | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          users!organizer_id (
            id,
            email,
            first_name,
            last_name
          ),
          clients (
            id,
            name,
            email
          ),
          projects (
            id,
            name,
            description
          ),
          event_attendees (
            id,
            email,
            name,
            status,
            is_optional,
            users (
              id,
              email,
              first_name,
              last_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Event not found
        }
        throw new Error(`Failed to get event: ${error.message}`);
      }

      return this.mapSupabaseEventToCalendarEvent(data);
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  async getEvents(filters: {
    startDate?: string;
    endDate?: string;
    organizerId?: string;
    projectId?: string;
    clientId?: string;
    type?: EventType;
    status?: EventStatus;
    page?: number;
    limit?: number;
  }): Promise<{ events: CalendarEvent[]; total: number }> {
    try {
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          users!organizer_id (
            id,
            email,
            first_name,
            last_name
          ),
          clients (
            id,
            name,
            email
          ),
          projects (
            id,
            name,
            description
          ),
          event_attendees (
            id,
            email,
            name,
            status,
            is_optional,
            users (
              id,
              email,
              first_name,
              last_name
            )
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('end_time', filters.endDate);
      }

      if (filters.organizerId) {
        query = query.eq('organizer_id', filters.organizerId);
      }

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      query = query
        .order('start_time', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get events: ${error.message}`);
      }

      return {
        events: data.map(this.mapSupabaseEventToCalendarEvent),
        total: count || 0,
      };
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }

  async updateEvent(id: string, eventData: Partial<CreateEventInput>): Promise<CalendarEvent> {
    try {
      const updateData: any = {};

      if (eventData.title) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      if (eventData.startTime) updateData.start_time = eventData.startTime;
      if (eventData.endTime) updateData.end_time = eventData.endTime;
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.isAllDay !== undefined) updateData.is_all_day = eventData.isAllDay;
      if (eventData.type) updateData.type = eventData.type;
      if (eventData.priority) updateData.priority = eventData.priority;
      if (eventData.projectId !== undefined) updateData.project_id = eventData.projectId;
      if (eventData.clientId !== undefined) updateData.client_id = eventData.clientId;
      if (eventData.aiSuggestions !== undefined) updateData.ai_suggestions = eventData.aiSuggestions;
      if (eventData.metadata !== undefined) updateData.metadata = eventData.metadata;

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update event: ${error.message}`);
      }

      return this.mapSupabaseEventToCalendarEvent(data);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete event: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async updateAttendeeStatus(eventId: string, attendeeEmail: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('event_attendees')
        .update({ status })
        .eq('event_id', eventId)
        .eq('email', attendeeEmail);

      if (error) {
        throw new Error(`Failed to update attendee status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating attendee status:', error);
      throw error;
    }
  }

  private mapSupabaseEventToCalendarEvent(data: any): CalendarEvent {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      startTime: new Date(data.start_time),
      endTime: new Date(data.end_time),
      location: data.location,
      isAllDay: data.is_all_day,
      type: data.type as EventType,
      priority: data.priority as EventPriority,
      status: data.status as EventStatus,
      organizer: {
        id: data.users?.id,
        email: data.users?.email,
        name: `${data.users?.first_name || ''} ${data.users?.last_name || ''}`.trim(),
      },
      attendees: data.event_attendees?.map((attendee: any) => ({
        id: attendee.id,
        email: attendee.email,
        name: attendee.name,
        status: attendee.status,
        isOptional: attendee.is_optional,
        userId: attendee.users?.id,
      })) || [],
      project: data.projects ? {
        id: data.projects.id,
        name: data.projects.name,
        description: data.projects.description,
      } : undefined,
      client: data.clients ? {
        id: data.clients.id,
        name: data.clients.name,
        email: data.clients.email,
      } : undefined,
      aiSuggestions: data.ai_suggestions,
      metadata: data.metadata,
      conflictDetection: [], // This would be populated by conflict detection service
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}