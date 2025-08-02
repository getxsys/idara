import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/lib/services/calendar-service';
import { EventType, EventPriority } from '@/types/calendar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, startTime, endTime, location, type, attendees } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Create event data
    const eventData = {
      title,
      description: description || '',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location: location || '',
      isAllDay: false,
      type: type as EventType || EventType.MEETING,
      priority: EventPriority.MEDIUM,
      attendees: attendees || []
    };

    // Create event using the service
    const calendarService = new CalendarService();
    const event = await calendarService.createEvent(eventData, 'default-user-id');

    return NextResponse.json({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      type: event.type,
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const calendarService = new CalendarService();
    const result = await calendarService.getEvents({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
      limit: 50
    });

    return NextResponse.json({
      events: result.events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        type: event.type,
        priority: event.priority,
        status: event.status,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      })),
      total: result.total
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}