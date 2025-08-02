import {
  ExternalCalendarIntegration,
  CalendarEvent,
  CalendarProvider,
  SyncDirection
} from '@/types/calendar';

export interface ExternalCalendarConfig {
  provider: CalendarProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface CalendarSyncResult {
  imported: number;
  exported: number;
  errors: string[];
  lastSyncAt: Date;
}

export class ExternalCalendarService {
  private integrations: Map<string, ExternalCalendarIntegration> = new Map();
  private configs: Map<CalendarProvider, ExternalCalendarConfig> = new Map();

  constructor() {
    // Initialize with mock configurations
    this.configs.set(CalendarProvider.GOOGLE, {
      provider: CalendarProvider.GOOGLE,
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || ''
    });

    this.configs.set(CalendarProvider.OUTLOOK, {
      provider: CalendarProvider.OUTLOOK,
      clientId: process.env.OUTLOOK_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.OUTLOOK_CALENDAR_CLIENT_SECRET || '',
      redirectUri: process.env.OUTLOOK_CALENDAR_REDIRECT_URI || ''
    });
  }

  // Integration management
  async createIntegration(
    userId: string,
    provider: CalendarProvider,
    accountEmail: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<ExternalCalendarIntegration> {
    const integration: ExternalCalendarIntegration = {
      id: this.generateId(),
      provider,
      accountEmail,
      isEnabled: true,
      syncDirection: SyncDirection.BIDIRECTIONAL,
      lastSyncAt: undefined,
      syncErrors: []
    };

    this.integrations.set(integration.id, integration);
    
    // Perform initial sync
    try {
      await this.syncCalendar(integration.id);
    } catch (error) {
      integration.syncErrors = [error instanceof Error ? error.message : 'Unknown sync error'];
    }

    return integration;
  }

  async getIntegrations(userId: string): Promise<ExternalCalendarIntegration[]> {
    return Array.from(this.integrations.values());
  }

  async getIntegration(integrationId: string): Promise<ExternalCalendarIntegration | null> {
    return this.integrations.get(integrationId) || null;
  }

  async updateIntegration(
    integrationId: string,
    updates: Partial<ExternalCalendarIntegration>
  ): Promise<ExternalCalendarIntegration> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const updatedIntegration = { ...integration, ...updates };
    this.integrations.set(integrationId, updatedIntegration);

    return updatedIntegration;
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    this.integrations.delete(integrationId);
  }

  // Calendar synchronization
  async syncCalendar(integrationId: string): Promise<CalendarSyncResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    if (!integration.isEnabled) {
      throw new Error('Integration is disabled');
    }

    const result: CalendarSyncResult = {
      imported: 0,
      exported: 0,
      errors: [],
      lastSyncAt: new Date()
    };

    try {
      switch (integration.provider) {
        case CalendarProvider.GOOGLE:
          await this.syncGoogleCalendar(integration, result);
          break;
        case CalendarProvider.OUTLOOK:
          await this.syncOutlookCalendar(integration, result);
          break;
        case CalendarProvider.APPLE:
          await this.syncAppleCalendar(integration, result);
          break;
        case CalendarProvider.EXCHANGE:
          await this.syncExchangeCalendar(integration, result);
          break;
        default:
          throw new Error(`Unsupported calendar provider: ${integration.provider}`);
      }

      // Update integration with sync result
      integration.lastSyncAt = result.lastSyncAt;
      integration.syncErrors = result.errors;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      result.errors.push(errorMessage);
      integration.syncErrors = result.errors;
    }

    return result;
  }

  async syncAllCalendars(userId: string): Promise<CalendarSyncResult[]> {
    const integrations = await this.getIntegrations(userId);
    const results: CalendarSyncResult[] = [];

    for (const integration of integrations) {
      if (integration.isEnabled) {
        try {
          const result = await this.syncCalendar(integration.id);
          results.push(result);
        } catch (error) {
          results.push({
            imported: 0,
            exported: 0,
            errors: [error instanceof Error ? error.message : 'Unknown sync error'],
            lastSyncAt: new Date()
          });
        }
      }
    }

    return results;
  }

  // OAuth flow helpers
  getAuthorizationUrl(provider: CalendarProvider, state: string): string {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Configuration not found for provider: ${provider}`);
    }

    switch (provider) {
      case CalendarProvider.GOOGLE:
        return this.getGoogleAuthUrl(config, state);
      case CalendarProvider.OUTLOOK:
        return this.getOutlookAuthUrl(config, state);
      default:
        throw new Error(`OAuth not supported for provider: ${provider}`);
    }
  }

  async exchangeCodeForTokens(
    provider: CalendarProvider,
    code: string,
    state: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Configuration not found for provider: ${provider}`);
    }

    switch (provider) {
      case CalendarProvider.GOOGLE:
        return this.exchangeGoogleCode(config, code);
      case CalendarProvider.OUTLOOK:
        return this.exchangeOutlookCode(config, code);
      default:
        throw new Error(`Token exchange not supported for provider: ${provider}`);
    }
  }

  // Provider-specific sync implementations
  private async syncGoogleCalendar(
    integration: ExternalCalendarIntegration,
    result: CalendarSyncResult
  ): Promise<void> {
    // Mock implementation - in real app, this would use Google Calendar API
    console.log(`Syncing Google Calendar for ${integration.accountEmail}`);
    
    // Simulate importing events
    result.imported = Math.floor(Math.random() * 10);
    
    // Simulate exporting events if bidirectional
    if (integration.syncDirection === SyncDirection.BIDIRECTIONAL || 
        integration.syncDirection === SyncDirection.EXPORT_ONLY) {
      result.exported = Math.floor(Math.random() * 5);
    }
  }

  private async syncOutlookCalendar(
    integration: ExternalCalendarIntegration,
    result: CalendarSyncResult
  ): Promise<void> {
    // Mock implementation - in real app, this would use Microsoft Graph API
    console.log(`Syncing Outlook Calendar for ${integration.accountEmail}`);
    
    result.imported = Math.floor(Math.random() * 8);
    
    if (integration.syncDirection === SyncDirection.BIDIRECTIONAL || 
        integration.syncDirection === SyncDirection.EXPORT_ONLY) {
      result.exported = Math.floor(Math.random() * 3);
    }
  }

  private async syncAppleCalendar(
    integration: ExternalCalendarIntegration,
    result: CalendarSyncResult
  ): Promise<void> {
    // Mock implementation - Apple Calendar integration would use CalDAV
    console.log(`Syncing Apple Calendar for ${integration.accountEmail}`);
    
    result.imported = Math.floor(Math.random() * 6);
    
    if (integration.syncDirection === SyncDirection.BIDIRECTIONAL || 
        integration.syncDirection === SyncDirection.EXPORT_ONLY) {
      result.exported = Math.floor(Math.random() * 2);
    }
  }

  private async syncExchangeCalendar(
    integration: ExternalCalendarIntegration,
    result: CalendarSyncResult
  ): Promise<void> {
    // Mock implementation - Exchange integration would use EWS or Graph API
    console.log(`Syncing Exchange Calendar for ${integration.accountEmail}`);
    
    result.imported = Math.floor(Math.random() * 12);
    
    if (integration.syncDirection === SyncDirection.BIDIRECTIONAL || 
        integration.syncDirection === SyncDirection.EXPORT_ONLY) {
      result.exported = Math.floor(Math.random() * 4);
    }
  }

  // OAuth URL generators
  private getGoogleAuthUrl(config: ExternalCalendarConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private getOutlookAuthUrl(config: ExternalCalendarConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'https://graph.microsoft.com/calendars.readwrite offline_access',
      response_mode: 'query',
      state
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  // Token exchange implementations
  private async exchangeGoogleCode(
    config: ExternalCalendarConfig,
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    // Mock implementation - in real app, this would make HTTP request to Google
    return {
      accessToken: 'mock_google_access_token',
      refreshToken: 'mock_google_refresh_token',
      expiresIn: 3600
    };
  }

  private async exchangeOutlookCode(
    config: ExternalCalendarConfig,
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    // Mock implementation - in real app, this would make HTTP request to Microsoft
    return {
      accessToken: 'mock_outlook_access_token',
      refreshToken: 'mock_outlook_refresh_token',
      expiresIn: 3600
    };
  }

  // Event conversion helpers
  convertToExternalEvent(event: CalendarEvent, provider: CalendarProvider): any {
    switch (provider) {
      case CalendarProvider.GOOGLE:
        return this.convertToGoogleEvent(event);
      case CalendarProvider.OUTLOOK:
        return this.convertToOutlookEvent(event);
      default:
        throw new Error(`Event conversion not supported for provider: ${provider}`);
    }
  }

  convertFromExternalEvent(externalEvent: any, provider: CalendarProvider): Partial<CalendarEvent> {
    switch (provider) {
      case CalendarProvider.GOOGLE:
        return this.convertFromGoogleEvent(externalEvent);
      case CalendarProvider.OUTLOOK:
        return this.convertFromOutlookEvent(externalEvent);
      default:
        throw new Error(`Event conversion not supported for provider: ${provider}`);
    }
  }

  private convertToGoogleEvent(event: CalendarEvent): any {
    return {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'UTC'
      },
      attendees: event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        optional: attendee.isOptional
      }))
    };
  }

  private convertFromGoogleEvent(googleEvent: any): Partial<CalendarEvent> {
    return {
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      location: googleEvent.location,
      startTime: new Date(googleEvent.start.dateTime || googleEvent.start.date),
      endTime: new Date(googleEvent.end.dateTime || googleEvent.end.date),
      isAllDay: !googleEvent.start.dateTime,
      externalEventId: googleEvent.id
    };
  }

  private convertToOutlookEvent(event: CalendarEvent): any {
    return {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || ''
      },
      location: {
        displayName: event.location || ''
      },
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'UTC'
      },
      attendees: event.attendees.map(attendee => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name
        },
        type: attendee.isOptional ? 'optional' : 'required'
      }))
    };
  }

  private convertFromOutlookEvent(outlookEvent: any): Partial<CalendarEvent> {
    return {
      title: outlookEvent.subject || 'Untitled Event',
      description: outlookEvent.body?.content,
      location: outlookEvent.location?.displayName,
      startTime: new Date(outlookEvent.start.dateTime),
      endTime: new Date(outlookEvent.end.dateTime),
      isAllDay: outlookEvent.isAllDay || false,
      externalEventId: outlookEvent.id
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}