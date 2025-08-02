'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Activity,
  Users,
  Lock
} from 'lucide-react';
import { securityMonitoringService } from '@/lib/services/security-monitoring';
import { securityAlertService } from '@/lib/services/security-alerts';
import { complianceReportingService } from '@/lib/services/compliance-reporting';
import { 
  SecurityAlert, 
  ComplianceType, 
  AlertPriority,
  SecuritySeverity 
} from '@/types/security';

interface SecurityDashboardProps {
  userId?: string;
}

export function SecurityDashboard({ userId }: SecurityDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    loadAlerts();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      const data = await securityMonitoringService.getSecurityDashboard(userId);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load security dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const userAlerts = userId 
        ? securityAlertService.getAlertsForRecipient(userId)
        : securityAlertService.getUnacknowledgedAlerts();
      setAlerts(userAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
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

  const generateComplianceReport = async (type: ComplianceType) => {
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();
      const reportId = await securityMonitoringService.generateComplianceReport(
        type, 
        startDate, 
        endDate, 
        userId || 'current-user'
      );
      alert(`Compliance report generated with ID: ${reportId}`);
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
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

  const getSeverityIcon = (severity: SecuritySeverity) => {
    switch (severity) {
      case SecuritySeverity.CRITICAL: return <XCircle className="h-4 w-4 text-red-500" />;
      case SecuritySeverity.HIGH: return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case SecuritySeverity.MEDIUM: return <Clock className="h-4 w-4 text-yellow-500" />;
      case SecuritySeverity.LOW: return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security events, alerts, and compliance status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getThreatLevelColor(dashboardData?.threatLevel)}`}></div>
          <span className="text-sm font-medium capitalize">
            {dashboardData?.threatLevel} Threat Level
          </span>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.unacknowledgedAlerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Unacknowledged security alerts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Events</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.recentSecurityEvents?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recent security events
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData?.complianceStatus ? 
                    Object.values(dashboardData.complianceStatus).filter((s: any) => s.compliant).length : 0
                  }/4
                </div>
                <p className="text-xs text-muted-foreground">
                  Compliant frameworks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.recentReports?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Generated this month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Priority Distribution</CardTitle>
                <CardDescription>
                  Breakdown of alerts by priority level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData?.alertsByPriority && Object.entries(dashboardData.alertsByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityColor(priority as AlertPriority)}>
                          {priority}
                        </Badge>
                      </div>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>
                  Current compliance status across frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.complianceStatus && Object.entries(dashboardData.complianceStatus).map(([framework, status]) => (
                    <div key={framework} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium uppercase">{framework}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(status as any).compliant ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date((status as any).lastAssessment).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Security Alerts</h2>
            <Button onClick={loadAlerts} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
          
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    No security alerts found
                  </div>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Created: {alert.createdAt.toLocaleString()}</span>
                          {alert.sent && <span>Sent: {alert.sentAt?.toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!alert.acknowledged && (
                          <Button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            size="sm"
                            variant="outline"
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.acknowledged && (
                          <Badge variant="secondary">Acknowledged</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Security Events</h2>
          
          <div className="space-y-3">
            {dashboardData?.recentSecurityEvents?.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    No recent security events
                  </div>
                </CardContent>
              </Card>
            ) : (
              dashboardData?.recentSecurityEvents?.map((event: any) => (
                <Card key={event.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(event.severity)}
                          <span className="font-medium">{event.type.replace(/_/g, ' ')}</span>
                          <Badge variant={event.resolved ? 'secondary' : 'destructive'}>
                            {event.resolved ? 'Resolved' : 'Active'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>User: {event.userId}</span>
                          <span>Time: {event.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Compliance Reports</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>
                  Create compliance reports for different frameworks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => generateComplianceReport(ComplianceType.GDPR)}
                  className="w-full"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate GDPR Report
                </Button>
                <Button 
                  onClick={() => generateComplianceReport(ComplianceType.HIPAA)}
                  className="w-full"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate HIPAA Report
                </Button>
                <Button 
                  onClick={() => generateComplianceReport(ComplianceType.SOX)}
                  className="w-full"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate SOX Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>
                  Recently generated compliance reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.recentReports?.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      No recent reports
                    </div>
                  ) : (
                    dashboardData?.recentReports?.map((report: any) => (
                      <div key={report.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{report.type.toUpperCase()}</div>
                          <div className="text-sm text-muted-foreground">
                            {report.generatedAt.toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant={report.status === 'completed' ? 'secondary' : 'default'}>
                          {report.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}