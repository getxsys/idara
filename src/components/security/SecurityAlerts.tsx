'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  Bell
} from 'lucide-react';
import { securityAlertService } from '@/lib/services/security-alerts';
import { 
  SecurityAlert, 
  AlertPriority,
  AlertType 
} from '@/types/security';

interface SecurityAlertsProps {
  userId?: string;
  showOnlyUnacknowledged?: boolean;
  maxAlerts?: number;
}

export function SecurityAlerts({ 
  userId, 
  showOnlyUnacknowledged = false, 
  maxAlerts = 10 
}: SecurityAlertsProps) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'acknowledged'>('all');

  useEffect(() => {
    loadAlerts();
  }, [userId, showOnlyUnacknowledged, filter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      let alertList: SecurityAlert[];

      if (showOnlyUnacknowledged) {
        alertList = securityAlertService.getUnacknowledgedAlerts(userId);
      } else {
        alertList = userId 
          ? securityAlertService.getAlertsForRecipient(userId)
          : securityAlertService.getUnacknowledgedAlerts();
      }

      // Apply filter
      if (filter === 'unacknowledged') {
        alertList = alertList.filter(alert => !alert.acknowledged);
      } else if (filter === 'acknowledged') {
        alertList = alertList.filter(alert => alert.acknowledged);
      }

      // Limit results
      if (maxAlerts) {
        alertList = alertList.slice(0, maxAlerts);
      }

      setAlerts(alertList);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await securityAlertService.acknowledgeAlert(alertId, userId || 'current-user');
      await loadAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case AlertPriority.URGENT: return 'destructive';
      case AlertPriority.HIGH: return 'destructive';
      case AlertPriority.MEDIUM: return 'default';
      case AlertPriority.LOW: return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: AlertPriority) => {
    switch (priority) {
      case AlertPriority.URGENT: return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case AlertPriority.HIGH: return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case AlertPriority.MEDIUM: return <Clock className="h-4 w-4 text-yellow-500" />;
      case AlertPriority.LOW: return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.EMAIL: return <Mail className="h-4 w-4" />;
      case AlertType.SMS: return <Smartphone className="h-4 w-4" />;
      case AlertType.PUSH: return <Bell className="h-4 w-4" />;
      case AlertType.IN_APP: return <MessageSquare className="h-4 w-4" />;
      case AlertType.WEBHOOK: return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Security Alerts</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unacknowledged' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unacknowledged')}
          >
            Unacknowledged
          </Button>
          <Button
            variant={filter === 'acknowledged' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('acknowledged')}
          >
            Acknowledged
          </Button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {filter === 'unacknowledged' 
                ? 'No unacknowledged alerts' 
                : filter === 'acknowledged'
                ? 'No acknowledged alerts'
                : 'No security alerts found'
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`${!alert.acknowledged ? 'border-l-4 border-l-orange-500' : ''}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(alert.priority)}
                      <Badge variant={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        {getTypeIcon(alert.type)}
                        <span className="text-xs">{alert.type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Event ID: {alert.eventId}</span>
                      {alert.sent && (
                        <span>Sent: {alert.sentAt?.toLocaleString()}</span>
                      )}
                      {alert.acknowledged && (
                        <span>
                          Acknowledged by {alert.acknowledgedBy} at {alert.acknowledgedAt?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!alert.acknowledged ? (
                      <Button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        size="sm"
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Acknowledged
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {alerts.length} alerts</span>
          <Button onClick={loadAlerts} variant="ghost" size="sm">
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}

export function SecurityAlertsSummary({ userId }: { userId?: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = () => {
      const statistics = securityAlertService.getAlertStatistics(userId);
      setStats(statistics);
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Total Alerts</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-orange-600">{stats.unacknowledged}</div>
          <p className="text-xs text-muted-foreground">Unacknowledged</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-green-600">{stats.acknowledged}</div>
          <p className="text-xs text-muted-foreground">Acknowledged</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-red-600">
            {stats.byPriority[AlertPriority.URGENT] + stats.byPriority[AlertPriority.HIGH]}
          </div>
          <p className="text-xs text-muted-foreground">High Priority</p>
        </CardContent>
      </Card>
    </div>
  );
}