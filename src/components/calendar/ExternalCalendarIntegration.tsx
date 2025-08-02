'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Calendar,
  RefreshCw,
  Settings,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Clock
} from 'lucide-react';
import {
  ExternalCalendarIntegration,
  CalendarProvider,
  SyncDirection
} from '@/types/calendar';
import { ExternalCalendarService, CalendarSyncResult } from '@/lib/services/external-calendar-service';

interface ExternalCalendarIntegrationProps {
  userId: string;
  onIntegrationChange?: (integrations: ExternalCalendarIntegration[]) => void;
}

export function ExternalCalendarIntegrationComponent({
  userId,
  onIntegrationChange
}: ExternalCalendarIntegrationProps) {
  const [integrations, setIntegrations] = useState<ExternalCalendarIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Map<string, CalendarSyncResult>>(new Map());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const externalCalendarService = new ExternalCalendarService();

  useEffect(() => {
    loadIntegrations();
  }, [userId]);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const userIntegrations = await externalCalendarService.getIntegrations(userId);
      setIntegrations(userIntegrations);
      onIntegrationChange?.(userIntegrations);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (integrationId: string) => {
    setIsSyncing(integrationId);
    try {
      const result = await externalCalendarService.syncCalendar(integrationId);
      setSyncResults(prev => new Map(prev.set(integrationId, result)));
      
      // Update integration with sync result
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, lastSyncAt: result.lastSyncAt, syncErrors: result.errors }
          : integration
      ));
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setIsLoading(true);
    try {
      const results = await externalCalendarService.syncAllCalendars(userId);
      results.forEach((result, index) => {
        const integration = integrations[index];
        if (integration) {
          setSyncResults(prev => new Map(prev.set(integration.id, result)));
        }
      });
      await loadIntegrations();
    } catch (error) {
      console.error('Sync all failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      await externalCalendarService.updateIntegration(integrationId, { isEnabled: enabled });
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, isEnabled: enabled }
          : integration
      ));
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    }
  };

  const handleUpdateSyncDirection = async (integrationId: string, syncDirection: SyncDirection) => {
    try {
      await externalCalendarService.updateIntegration(integrationId, { syncDirection });
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, syncDirection }
          : integration
      ));
    } catch (error) {
      console.error('Failed to update sync direction:', error);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await externalCalendarService.deleteIntegration(integrationId);
      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      setSyncResults(prev => {
        const newResults = new Map(prev);
        newResults.delete(integrationId);
        return newResults;
      });
    } catch (error) {
      console.error('Failed to delete integration:', error);
    }
  };

  const getProviderIcon = (provider: CalendarProvider) => {
    switch (provider) {
      case CalendarProvider.GOOGLE:
        return '🔵'; // Google icon placeholder
      case CalendarProvider.OUTLOOK:
        return '🔷'; // Outlook icon placeholder
      case CalendarProvider.APPLE:
        return '🍎'; // Apple icon placeholder
      case CalendarProvider.EXCHANGE:
        return '📧'; // Exchange icon placeholder
      default:
        return '📅';
    }
  };

  const getProviderColor = (provider: CalendarProvider) => {
    switch (provider) {
      case CalendarProvider.GOOGLE:
        return 'bg-blue-100 text-blue-800';
      case CalendarProvider.OUTLOOK:
        return 'bg-indigo-100 text-indigo-800';
      case CalendarProvider.APPLE:
        return 'bg-gray-100 text-gray-800';
      case CalendarProvider.EXCHANGE:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncDirectionLabel = (direction: SyncDirection) => {
    switch (direction) {
      case SyncDirection.IMPORT_ONLY:
        return 'Import Only';
      case SyncDirection.EXPORT_ONLY:
        return 'Export Only';
      case SyncDirection.BIDIRECTIONAL:
        return 'Bidirectional';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">External Calendar Integration</h2>
          <p className="text-muted-foreground">
            Connect your external calendars to sync events automatically
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={isLoading || integrations.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Calendar Integration</DialogTitle>
              </DialogHeader>
              <AddIntegrationForm
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  loadIntegrations();
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Integration List */}
      {isLoading && integrations.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading integrations...</span>
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No integrations configured</h3>
              <p className="text-muted-foreground mb-4">
                Connect your external calendars to sync events automatically
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              syncResult={syncResults.get(integration.id)}
              isSyncing={isSyncing === integration.id}
              onSync={() => handleSync(integration.id)}
              onToggle={(enabled) => handleToggleIntegration(integration.id, enabled)}
              onUpdateSyncDirection={(direction) => handleUpdateSyncDirection(integration.id, direction)}
              onDelete={() => handleDeleteIntegration(integration.id)}
              getProviderIcon={getProviderIcon}
              getProviderColor={getProviderColor}
              getSyncDirectionLabel={getSyncDirectionLabel}
            />
          ))}
        </div>
      )}

      {/* Sync Summary */}
      {syncResults.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(syncResults.entries()).map(([integrationId, result]) => {
                const integration = integrations.find(i => i.id === integrationId);
                if (!integration) return null;

                return (
                  <div key={integrationId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getProviderIcon(integration.provider)}</span>
                      <div>
                        <div className="font-medium">{integration.accountEmail}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.lastSyncAt.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-green-600">
                        ↓ {result.imported} imported
                      </div>
                      <div className="text-blue-600">
                        ↑ {result.exported} exported
                      </div>
                      {result.errors.length > 0 && (
                        <div className="text-red-600">
                          {result.errors.length} errors
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface IntegrationCardProps {
  integration: ExternalCalendarIntegration;
  syncResult?: CalendarSyncResult;
  isSyncing: boolean;
  onSync: () => void;
  onToggle: (enabled: boolean) => void;
  onUpdateSyncDirection: (direction: SyncDirection) => void;
  onDelete: () => void;
  getProviderIcon: (provider: CalendarProvider) => string;
  getProviderColor: (provider: CalendarProvider) => string;
  getSyncDirectionLabel: (direction: SyncDirection) => string;
}

function IntegrationCard({
  integration,
  syncResult,
  isSyncing,
  onSync,
  onToggle,
  onUpdateSyncDirection,
  onDelete,
  getProviderIcon,
  getProviderColor,
  getSyncDirectionLabel
}: IntegrationCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="text-2xl">{getProviderIcon(integration.provider)}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium">{integration.accountEmail}</h3>
                <Badge className={getProviderColor(integration.provider)}>
                  {integration.provider}
                </Badge>
                {integration.isEnabled ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span>Sync: {getSyncDirectionLabel(integration.syncDirection)}</span>
                  {integration.lastSyncAt && (
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Last sync: {integration.lastSyncAt.toLocaleString()}</span>
                    </span>
                  )}
                </div>

                {integration.syncErrors && integration.syncErrors.length > 0 && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Sync errors detected:</div>
                      <ul className="list-disc list-inside mt-1">
                        {integration.syncErrors.map((error, index) => (
                          <li key={index} className="text-xs">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {syncResult && (
                  <div className="flex items-center space-x-4 mt-2 p-2 bg-muted rounded">
                    <span className="text-green-600">↓ {syncResult.imported} imported</span>
                    <span className="text-blue-600">↑ {syncResult.exported} exported</span>
                    {syncResult.errors.length > 0 && (
                      <span className="text-red-600">{syncResult.errors.length} errors</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor={`enabled-${integration.id}`} className="text-sm">
                Enabled
              </Label>
              <Switch
                id={`enabled-${integration.id}`}
                checked={integration.isEnabled}
                onCheckedChange={onToggle}
              />
            </div>

            <Select
              value={integration.syncDirection}
              onValueChange={(value) => onUpdateSyncDirection(value as SyncDirection)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SyncDirection.IMPORT_ONLY}>Import Only</SelectItem>
                <SelectItem value={SyncDirection.EXPORT_ONLY}>Export Only</SelectItem>
                <SelectItem value={SyncDirection.BIDIRECTIONAL}>Bidirectional</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={!integration.isEnabled || isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddIntegrationForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | ''>('');
  const [isConnecting, setIsConnecting] = useState(false);

  const externalCalendarService = new ExternalCalendarService();

  const handleConnect = async () => {
    if (!selectedProvider) return;

    setIsConnecting(true);
    try {
      // In a real implementation, this would redirect to OAuth flow
      const authUrl = externalCalendarService.getAuthorizationUrl(
        selectedProvider as CalendarProvider,
        'state-' + Math.random().toString(36).substr(2, 9)
      );
      
      // For demo purposes, we'll simulate a successful connection
      setTimeout(() => {
        onSuccess();
        setIsConnecting(false);
      }, 2000);
      
      // In real implementation:
      // window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate connection:', error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="provider">Calendar Provider</Label>
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger>
            <SelectValue placeholder="Select a calendar provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CalendarProvider.GOOGLE}>
              <div className="flex items-center space-x-2">
                <span>🔵</span>
                <span>Google Calendar</span>
              </div>
            </SelectItem>
            <SelectItem value={CalendarProvider.OUTLOOK}>
              <div className="flex items-center space-x-2">
                <span>🔷</span>
                <span>Outlook Calendar</span>
              </div>
            </SelectItem>
            <SelectItem value={CalendarProvider.APPLE}>
              <div className="flex items-center space-x-2">
                <span>🍎</span>
                <span>Apple Calendar</span>
              </div>
            </SelectItem>
            <SelectItem value={CalendarProvider.EXCHANGE}>
              <div className="flex items-center space-x-2">
                <span>📧</span>
                <span>Exchange Calendar</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          You will be redirected to {selectedProvider || 'the provider'} to authorize access to your calendar.
          We only request read and write permissions for calendar events.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isConnecting}>
          Cancel
        </Button>
        <Button 
          onClick={handleConnect} 
          disabled={!selectedProvider || isConnecting}
        >
          {isConnecting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      </div>
    </div>
  );
}