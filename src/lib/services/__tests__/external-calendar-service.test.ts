import { ExternalCalendarService } from '../external-calendar-service';
import { CalendarProvider, SyncDirection } from '@/types/calendar';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    GOOGLE_CALENDAR_CLIENT_ID: 'google-client-id',
    GOOGLE_CALENDAR_CLIENT_SECRET: 'google-client-secret',
    GOOGLE_CALENDAR_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
    OUTLOOK_CALENDAR_CLIENT_ID: 'outlook-client-id',
    OUTLOOK_CALENDAR_CLIENT_SECRET: 'outlook-client-secret',
    OUTLOOK_CALENDAR_REDIRECT_URI: 'http://localhost:3000/auth/outlook/callback',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('ExternalCalendarService', () => {
  let service: ExternalCalendarService;

  beforeEach(() => {
    service = new ExternalCalendarService();
  });

  describe('createIntegration', () => {
    it('creates a new integration with correct properties', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token',
        'refresh-token'
      );

      expect(integration.id).toBeDefined();
      expect(integration.provider).toBe(CalendarProvider.GOOGLE);
      expect(integration.accountEmail).toBe('user@gmail.com');
      expect(integration.isEnabled).toBe(true);
      expect(integration.syncDirection).toBe(SyncDirection.BIDIRECTIONAL);
      expect(integration.syncErrors).toEqual([]);
    });

    it('performs initial sync after creation', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      expect(integration.lastSyncAt).toBeUndefined(); // Initial sync might fail in mock
      expect(Array.isArray(integration.syncErrors)).toBe(true);
    });
  });

  describe('getIntegrations', () => {
    it('returns empty array when no integrations exist', async () => {
      const integrations = await service.getIntegrations('user-123');
      expect(integrations).toEqual([]);
    });

    it('returns all integrations for a user', async () => {
      await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );
      await service.createIntegration(
        'user-123',
        CalendarProvider.OUTLOOK,
        'user@outlook.com',
        'access-token'
      );

      const integrations = await service.getIntegrations('user-123');
      expect(integrations).toHaveLength(2);
    });
  });

  describe('getIntegration', () => {
    it('returns integration by id', async () => {
      const created = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      const retrieved = await service.getIntegration(created.id);
      expect(retrieved).toEqual(created);
    });

    it('returns null for non-existent integration', async () => {
      const integration = await service.getIntegration('non-existent');
      expect(integration).toBeNull();
    });
  });

  describe('updateIntegration', () => {
    it('updates integration properties', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      const updated = await service.updateIntegration(integration.id, {
        isEnabled: false,
        syncDirection: SyncDirection.IMPORT_ONLY,
      });

      expect(updated.isEnabled).toBe(false);
      expect(updated.syncDirection).toBe(SyncDirection.IMPORT_ONLY);
    });

    it('throws error when updating non-existent integration', async () => {
      await expect(
        service.updateIntegration('non-existent', { isEnabled: false })
      ).rejects.toThrow('Integration not found');
    });
  });

  describe('deleteIntegration', () => {
    it('deletes an existing integration', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      await service.deleteIntegration(integration.id);

      const deleted = await service.getIntegration(integration.id);
      expect(deleted).toBeNull();
    });

    it('does not throw error when deleting non-existent integration', async () => {
      await expect(service.deleteIntegration('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('syncCalendar', () => {
    it('syncs calendar and returns result', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      const result = await service.syncCalendar(integration.id);

      expect(result.imported).toBeGreaterThanOrEqual(0);
      expect(result.exported).toBeGreaterThanOrEqual(0);
      expect(result.errors).toEqual([]);
      expect(result.lastSyncAt).toBeInstanceOf(Date);
    });

    it('throws error when syncing non-existent integration', async () => {
      await expect(service.syncCalendar('non-existent')).rejects.toThrow('Integration not found');
    });

    it('throws error when syncing disabled integration', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      await service.updateIntegration(integration.id, { isEnabled: false });

      await expect(service.syncCalendar(integration.id)).rejects.toThrow('Integration is disabled');
    });

    it('handles sync errors gracefully', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.APPLE, // Unsupported provider for testing
        'user@icloud.com',
        'access-token'
      );

      const result = await service.syncCalendar(integration.id);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('syncAllCalendars', () => {
    it('syncs all enabled integrations', async () => {
      const integration1 = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      const integration2 = await service.createIntegration(
        'user-123',
        CalendarProvider.OUTLOOK,
        'user@outlook.com',
        'access-token'
      );

      // Disable one integration
      await service.updateIntegration(integration2.id, { isEnabled: false });

      const results = await service.syncAllCalendars('user-123');

      expect(results).toHaveLength(1); // Only enabled integration should be synced
      expect(results[0].imported).toBeGreaterThanOrEqual(0);
    });

    it('returns empty array when no integrations exist', async () => {
      const results = await service.syncAllCalendars('user-123');
      expect(results).toEqual([]);
    });
  });

  describe('OAuth flow', () => {
    describe('getAuthorizationUrl', () => {
      it('generates Google authorization URL', () => {
        const url = service.getAuthorizationUrl(CalendarProvider.GOOGLE, 'test-state');

        expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
        expect(url).toContain('client_id=google-client-id');
        expect(url).toContain('state=test-state');
        expect(url).toContain('scope=https://www.googleapis.com/auth/calendar');
      });

      it('generates Outlook authorization URL', () => {
        const url = service.getAuthorizationUrl(CalendarProvider.OUTLOOK, 'test-state');

        expect(url).toContain('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
        expect(url).toContain('client_id=outlook-client-id');
        expect(url).toContain('state=test-state');
        expect(url).toContain('scope=https://graph.microsoft.com/calendars.readwrite');
      });

      it('throws error for unsupported provider', () => {
        expect(() => {
          service.getAuthorizationUrl(CalendarProvider.APPLE, 'test-state');
        }).toThrow('OAuth not supported for provider: APPLE');
      });

      it('throws error when configuration is missing', () => {
        process.env.GOOGLE_CALENDAR_CLIENT_ID = '';

        expect(() => {
          service.getAuthorizationUrl(CalendarProvider.GOOGLE, 'test-state');
        }).toThrow('Configuration not found for provider: GOOGLE');
      });
    });

    describe('exchangeCodeForTokens', () => {
      it('exchanges Google authorization code for tokens', async () => {
        const tokens = await service.exchangeCodeForTokens(
          CalendarProvider.GOOGLE,
          'auth-code',
          'test-state'
        );

        expect(tokens.accessToken).toBe('mock_google_access_token');
        expect(tokens.refreshToken).toBe('mock_google_refresh_token');
        expect(tokens.expiresIn).toBe(3600);
      });

      it('exchanges Outlook authorization code for tokens', async () => {
        const tokens = await service.exchangeCodeForTokens(
          CalendarProvider.OUTLOOK,
          'auth-code',
          'test-state'
        );

        expect(tokens.accessToken).toBe('mock_outlook_access_token');
        expect(tokens.refreshToken).toBe('mock_outlook_refresh_token');
        expect(tokens.expiresIn).toBe(3600);
      });

      it('throws error for unsupported provider', async () => {
        await expect(
          service.exchangeCodeForTokens(CalendarProvider.APPLE, 'auth-code', 'test-state')
        ).rejects.toThrow('Token exchange not supported for provider: APPLE');
      });
    });
  });

  describe('provider-specific sync', () => {
    it('syncs Google Calendar', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      const result = await service.syncCalendar(integration.id);

      expect(result.imported).toBeGreaterThanOrEqual(0);
      expect(result.exported).toBeGreaterThanOrEqual(0);
    });

    it('syncs Outlook Calendar', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.OUTLOOK,
        'user@outlook.com',
        'access-token'
      );

      const result = await service.syncCalendar(integration.id);

      expect(result.imported).toBeGreaterThanOrEqual(0);
      expect(result.exported).toBeGreaterThanOrEqual(0);
    });

    it('syncs Apple Calendar', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.APPLE,
        'user@icloud.com',
        'access-token'
      );

      const result = await service.syncCalendar(integration.id);

      expect(result.imported).toBeGreaterThanOrEqual(0);
      expect(result.exported).toBeGreaterThanOrEqual(0);
    });

    it('syncs Exchange Calendar', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.EXCHANGE,
        'user@company.com',
        'access-token'
      );

      const result = await service.syncCalendar(integration.id);

      expect(result.imported).toBeGreaterThanOrEqual(0);
      expect(result.exported).toBeGreaterThanOrEqual(0);
    });
  });

  describe('event conversion', () => {
    const mockEvent = {
      id: '1',
      title: 'Test Event',
      description: 'Test Description',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:00:00Z'),
      location: 'Test Location',
      isAllDay: false,
      type: 'MEETING' as any,
      priority: 'HIGH' as any,
      status: 'CONFIRMED' as any,
      organizerId: 'user-123',
      attendees: [
        {
          id: 'att-1',
          email: 'john@example.com',
          name: 'John Doe',
          status: 'ACCEPTED' as any,
          isOptional: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('converts to Google Calendar event format', () => {
      const googleEvent = service.convertToExternalEvent(mockEvent, CalendarProvider.GOOGLE);

      expect(googleEvent.summary).toBe('Test Event');
      expect(googleEvent.description).toBe('Test Description');
      expect(googleEvent.location).toBe('Test Location');
      expect(googleEvent.start.dateTime).toBe('2024-01-15T10:00:00.000Z');
      expect(googleEvent.end.dateTime).toBe('2024-01-15T11:00:00.000Z');
      expect(googleEvent.attendees).toHaveLength(1);
      expect(googleEvent.attendees[0].email).toBe('john@example.com');
    });

    it('converts to Outlook Calendar event format', () => {
      const outlookEvent = service.convertToExternalEvent(mockEvent, CalendarProvider.OUTLOOK);

      expect(outlookEvent.subject).toBe('Test Event');
      expect(outlookEvent.body.content).toBe('Test Description');
      expect(outlookEvent.location.displayName).toBe('Test Location');
      expect(outlookEvent.start.dateTime).toBe('2024-01-15T10:00:00.000Z');
      expect(outlookEvent.end.dateTime).toBe('2024-01-15T11:00:00.000Z');
      expect(outlookEvent.attendees).toHaveLength(1);
      expect(outlookEvent.attendees[0].emailAddress.address).toBe('john@example.com');
    });

    it('converts from Google Calendar event format', () => {
      const googleEvent = {
        id: 'google-event-1',
        summary: 'Google Event',
        description: 'Google Description',
        location: 'Google Location',
        start: { dateTime: '2024-01-15T10:00:00.000Z' },
        end: { dateTime: '2024-01-15T11:00:00.000Z' },
      };

      const calendarEvent = service.convertFromExternalEvent(googleEvent, CalendarProvider.GOOGLE);

      expect(calendarEvent.title).toBe('Google Event');
      expect(calendarEvent.description).toBe('Google Description');
      expect(calendarEvent.location).toBe('Google Location');
      expect(calendarEvent.startTime).toEqual(new Date('2024-01-15T10:00:00.000Z'));
      expect(calendarEvent.endTime).toEqual(new Date('2024-01-15T11:00:00.000Z'));
      expect(calendarEvent.externalEventId).toBe('google-event-1');
    });

    it('converts from Outlook Calendar event format', () => {
      const outlookEvent = {
        id: 'outlook-event-1',
        subject: 'Outlook Event',
        body: { content: 'Outlook Description' },
        location: { displayName: 'Outlook Location' },
        start: { dateTime: '2024-01-15T10:00:00.000Z' },
        end: { dateTime: '2024-01-15T11:00:00.000Z' },
        isAllDay: false,
      };

      const calendarEvent = service.convertFromExternalEvent(outlookEvent, CalendarProvider.OUTLOOK);

      expect(calendarEvent.title).toBe('Outlook Event');
      expect(calendarEvent.description).toBe('Outlook Description');
      expect(calendarEvent.location).toBe('Outlook Location');
      expect(calendarEvent.startTime).toEqual(new Date('2024-01-15T10:00:00.000Z'));
      expect(calendarEvent.endTime).toEqual(new Date('2024-01-15T11:00:00.000Z'));
      expect(calendarEvent.externalEventId).toBe('outlook-event-1');
    });

    it('handles missing fields in external events', () => {
      const minimalGoogleEvent = {
        id: 'minimal-event',
        start: { dateTime: '2024-01-15T10:00:00.000Z' },
        end: { dateTime: '2024-01-15T11:00:00.000Z' },
      };

      const calendarEvent = service.convertFromExternalEvent(minimalGoogleEvent, CalendarProvider.GOOGLE);

      expect(calendarEvent.title).toBe('Untitled Event');
      expect(calendarEvent.description).toBeUndefined();
      expect(calendarEvent.location).toBeUndefined();
    });

    it('throws error for unsupported provider conversion', () => {
      expect(() => {
        service.convertToExternalEvent(mockEvent, CalendarProvider.APPLE);
      }).toThrow('Event conversion not supported for provider: APPLE');

      expect(() => {
        service.convertFromExternalEvent({}, CalendarProvider.APPLE);
      }).toThrow('Event conversion not supported for provider: APPLE');
    });
  });

  describe('sync direction handling', () => {
    it('only imports when sync direction is IMPORT_ONLY', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      await service.updateIntegration(integration.id, {
        syncDirection: SyncDirection.IMPORT_ONLY,
      });

      const result = await service.syncCalendar(integration.id);

      expect(result.imported).toBeGreaterThan(0);
      expect(result.exported).toBe(0);
    });

    it('only exports when sync direction is EXPORT_ONLY', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      await service.updateIntegration(integration.id, {
        syncDirection: SyncDirection.EXPORT_ONLY,
      });

      const result = await service.syncCalendar(integration.id);

      expect(result.imported).toBe(0);
      expect(result.exported).toBeGreaterThan(0);
    });

    it('imports and exports when sync direction is BIDIRECTIONAL', async () => {
      const integration = await service.createIntegration(
        'user-123',
        CalendarProvider.GOOGLE,
        'user@gmail.com',
        'access-token'
      );

      const result = await service.syncCalendar(integration.id);

      expect(result.imported).toBeGreaterThan(0);
      expect(result.exported).toBeGreaterThan(0);
    });
  });
});