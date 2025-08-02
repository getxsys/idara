import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExternalCalendarIntegrationComponent } from '../ExternalCalendarIntegration';
import { ExternalCalendarService } from '@/lib/services/external-calendar-service';
import { CalendarProvider, SyncDirection } from '@/types/calendar';

// Mock the external calendar service
jest.mock('@/lib/services/external-calendar-service');
const MockedExternalCalendarService = ExternalCalendarService as jest.MockedClass<typeof ExternalCalendarService>;

const mockIntegrations = [
  {
    id: '1',
    provider: CalendarProvider.GOOGLE,
    accountEmail: 'user@gmail.com',
    isEnabled: true,
    syncDirection: SyncDirection.BIDIRECTIONAL,
    lastSyncAt: new Date('2024-01-15T10:00:00Z'),
    syncErrors: [],
  },
  {
    id: '2',
    provider: CalendarProvider.OUTLOOK,
    accountEmail: 'user@outlook.com',
    isEnabled: false,
    syncDirection: SyncDirection.IMPORT_ONLY,
    lastSyncAt: new Date('2024-01-14T15:30:00Z'),
    syncErrors: ['Failed to sync some events'],
  },
];

const mockSyncResult = {
  imported: 5,
  exported: 3,
  errors: [],
  lastSyncAt: new Date('2024-01-15T12:00:00Z'),
};

describe('ExternalCalendarIntegrationComponent', () => {
  let mockService: jest.Mocked<ExternalCalendarService>;

  beforeEach(() => {
    mockService = {
      getIntegrations: jest.fn(),
      syncCalendar: jest.fn(),
      syncAllCalendars: jest.fn(),
      updateIntegration: jest.fn(),
      deleteIntegration: jest.fn(),
      getAuthorizationUrl: jest.fn(),
    } as any;

    MockedExternalCalendarService.mockImplementation(() => mockService);

    mockService.getIntegrations.mockResolvedValue(mockIntegrations);
    mockService.syncCalendar.mockResolvedValue(mockSyncResult);
    mockService.syncAllCalendars.mockResolvedValue([mockSyncResult]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders integration header and controls', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    expect(screen.getByText('External Calendar Integration')).toBeInTheDocument();
    expect(
      screen.getByText('Connect your external calendars to sync events automatically')
    ).toBeInTheDocument();
    expect(screen.getByText('Sync All')).toBeInTheDocument();
    expect(screen.getByText('Add Integration')).toBeInTheDocument();
  });

  it('loads and displays integrations', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(mockService.getIntegrations).toHaveBeenCalledWith('user-123');
    });

    await waitFor(() => {
      expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
      expect(screen.getByText('user@outlook.com')).toBeInTheDocument();
    });
  });

  it('displays integration status correctly', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });
  });

  it('shows sync direction for each integration', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Sync: Bidirectional')).toBeInTheDocument();
      expect(screen.getByText('Sync: Import Only')).toBeInTheDocument();
    });
  });

  it('displays last sync time', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Last sync:/)).toBeInTheDocument();
    });
  });

  it('shows sync errors when present', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Sync errors detected:')).toBeInTheDocument();
      expect(screen.getByText('Failed to sync some events')).toBeInTheDocument();
    });
  });

  it('syncs individual calendar when sync button is clicked', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
    });

    const syncButtons = screen.getAllByRole('button', { name: '' }); // Sync buttons with icon only
    const syncButton = syncButtons.find(button => 
      button.querySelector('svg') && !button.disabled
    );
    
    if (syncButton) {
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockService.syncCalendar).toHaveBeenCalledWith('1');
      });
    }
  });

  it('syncs all calendars when sync all button is clicked', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    const syncAllButton = screen.getByText('Sync All');
    fireEvent.click(syncAllButton);

    await waitFor(() => {
      expect(mockService.syncAllCalendars).toHaveBeenCalledWith('user-123');
    });
  });

  it('toggles integration enabled state', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
    });

    const enabledSwitches = screen.getAllByRole('switch');
    const firstSwitch = enabledSwitches[0];
    
    fireEvent.click(firstSwitch);

    await waitFor(() => {
      expect(mockService.updateIntegration).toHaveBeenCalledWith('1', { isEnabled: false });
    });
  });

  it('updates sync direction', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
    });

    // Find and click sync direction dropdown
    const syncDirectionSelects = screen.getAllByRole('combobox');
    const firstSelect = syncDirectionSelects[0];
    
    fireEvent.click(firstSelect);
    
    // Select "Import Only"
    const importOnlyOption = screen.getByText('Import Only');
    fireEvent.click(importOnlyOption);

    await waitFor(() => {
      expect(mockService.updateIntegration).toHaveBeenCalledWith('1', { 
        syncDirection: SyncDirection.IMPORT_ONLY 
      });
    });
  });

  it('deletes integration', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.className.includes('text-red-600')
    );
    
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockService.deleteIntegration).toHaveBeenCalledWith('1');
      });
    }
  });

  it('opens add integration dialog', () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    const addButton = screen.getByText('Add Integration');
    fireEvent.click(addButton);

    expect(screen.getByText('Add Calendar Integration')).toBeInTheDocument();
    expect(screen.getByText('Select a calendar provider')).toBeInTheDocument();
  });

  it('shows empty state when no integrations exist', async () => {
    mockService.getIntegrations.mockResolvedValue([]);

    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('No integrations configured')).toBeInTheDocument();
      expect(
        screen.getByText('Connect your external calendars to sync events automatically')
      ).toBeInTheDocument();
      expect(screen.getByText('Add Your First Integration')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    mockService.getIntegrations.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    expect(screen.getByText('Loading integrations...')).toBeInTheDocument();
  });

  it('displays sync activity summary', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    // Trigger a sync to populate sync results
    await waitFor(() => {
      expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
    });

    const syncButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && !button.disabled
    );
    
    if (syncButtons.length > 0) {
      fireEvent.click(syncButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Recent Sync Activity')).toBeInTheDocument();
        expect(screen.getByText('↓ 5 imported')).toBeInTheDocument();
        expect(screen.getByText('↑ 3 exported')).toBeInTheDocument();
      });
    }
  });

  it('shows provider icons and colors', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('GOOGLE')).toBeInTheDocument();
      expect(screen.getByText('OUTLOOK')).toBeInTheDocument();
    });
  });

  it('disables sync button for disabled integrations', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('user@outlook.com')).toBeInTheDocument();
    });

    // The sync button for the disabled integration should be disabled
    const syncButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.disabled
    );
    
    expect(syncButtons.length).toBeGreaterThan(0);
  });

  it('calls onIntegrationChange when integrations are loaded', async () => {
    const onIntegrationChange = jest.fn();
    
    render(
      <ExternalCalendarIntegrationComponent 
        userId="user-123" 
        onIntegrationChange={onIntegrationChange}
      />
    );

    await waitFor(() => {
      expect(onIntegrationChange).toHaveBeenCalledWith(mockIntegrations);
    });
  });
});

describe('AddIntegrationForm', () => {
  let mockService: jest.Mocked<ExternalCalendarService>;

  beforeEach(() => {
    mockService = {
      getAuthorizationUrl: jest.fn(),
    } as any;

    MockedExternalCalendarService.mockImplementation(() => mockService);
    mockService.getAuthorizationUrl.mockReturnValue('https://example.com/oauth');
  });

  it('renders provider selection dropdown', () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    const addButton = screen.getByText('Add Integration');
    fireEvent.click(addButton);

    expect(screen.getByText('Calendar Provider')).toBeInTheDocument();
    expect(screen.getByText('Select a calendar provider')).toBeInTheDocument();
  });

  it('shows available calendar providers', () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    const addButton = screen.getByText('Add Integration');
    fireEvent.click(addButton);

    const providerSelect = screen.getByRole('combobox');
    fireEvent.click(providerSelect);

    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Outlook Calendar')).toBeInTheDocument();
    expect(screen.getByText('Apple Calendar')).toBeInTheDocument();
    expect(screen.getByText('Exchange Calendar')).toBeInTheDocument();
  });

  it('enables connect button when provider is selected', () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    const addButton = screen.getByText('Add Integration');
    fireEvent.click(addButton);

    const connectButton = screen.getByRole('button', { name: /connect/i });
    expect(connectButton).toBeDisabled();

    const providerSelect = screen.getByRole('combobox');
    fireEvent.click(providerSelect);
    
    const googleOption = screen.getByText('Google Calendar');
    fireEvent.click(googleOption);

    expect(connectButton).not.toBeDisabled();
  });

  it('shows authorization warning', () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    const addButton = screen.getByText('Add Integration');
    fireEvent.click(addButton);

    expect(
      screen.getByText(/You will be redirected to .* to authorize access/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We only request read and write permissions for calendar events/)
    ).toBeInTheDocument();
  });

  it('simulates connection process', async () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    const addButton = screen.getByText('Add Integration');
    fireEvent.click(addButton);

    const providerSelect = screen.getByRole('combobox');
    fireEvent.click(providerSelect);
    
    const googleOption = screen.getByText('Google Calendar');
    fireEvent.click(googleOption);

    const connectButton = screen.getByRole('button', { name: /connect/i });
    fireEvent.click(connectButton);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(connectButton).toBeDisabled();

    // Wait for the simulated connection to complete
    await waitFor(() => {
      expect(mockService.getAuthorizationUrl).toHaveBeenCalledWith(
        CalendarProvider.GOOGLE,
        expect.stringMatching(/^state-/)
      );
    }, { timeout: 3000 });
  });

  it('closes dialog when cancel is clicked', () => {
    render(<ExternalCalendarIntegrationComponent userId="user-123" />);

    const addButton = screen.getByText('Add Integration');
    fireEvent.click(addButton);

    expect(screen.getByText('Add Calendar Integration')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Add Calendar Integration')).not.toBeInTheDocument();
  });
});