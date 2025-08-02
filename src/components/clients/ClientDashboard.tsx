'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  Mail, 
  Phone, 
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { Client } from '@/types/client';
import ClientEngagementMetrics from './ClientEngagementMetrics';
import ClientInteractionTimeline from './ClientInteractionTimeline';
import CommunicationPreferences from './CommunicationPreferences';

interface ClientDashboardProps {
  client: Client;
  onClientUpdate?: (client: Client) => void;
}

export default function ClientDashboard({ client, onClientUpdate }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEngagementLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'very_high':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChurnRiskLevel = (risk: number) => {
    if (risk >= 0.7) return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (risk >= 0.4) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const churnRisk = getChurnRiskLevel(client.churnRisk || 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(client.healthScore || 0)}`}>
              {client.healthScore}/100
            </div>
            <Progress value={client.healthScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(client.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Avg project: {formatCurrency(client.averageProjectValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getEngagementLevelColor(client.engagementLevel || '')}>
              {(client.engagementLevel || '').replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Last contact: {formatDate(client.lastContactDate || new Date())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${churnRisk.color}`}>
              {churnRisk.level}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${churnRisk.bgColor} ${churnRisk.color}`}>
              {((client.churnRisk || 0) * 100).toFixed(1)}% risk
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Best Action */}
      <Card>
        <CardHeader>
          <CardTitle>Next Best Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-3 h-3 rounded-full mt-2 ${
                (client.nextBestActionPriority || '') === 'urgent' ? 'bg-red-500' :
                (client.nextBestActionPriority || '') === 'high' ? 'bg-orange-500' :
                (client.nextBestActionPriority || '') === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{client.nextBestAction}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {client.nextBestActionReason}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Expected Impact:</strong> {client.nextBestActionEstimatedImpact}
              </p>
              <div className="flex items-center justify-between mt-3">
                <Badge variant={
                  (client.nextBestActionPriority || '') === 'urgent' ? 'destructive' :
                  (client.nextBestActionPriority || '') === 'high' ? 'default' :
                  'secondary'
                }>
                  {(client.nextBestActionPriority || '').toUpperCase()} Priority
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Suggested: {formatDate(client.nextBestActionSuggestedDate || new Date())}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{client.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">{client.email}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">{client.phone}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{client.companyLegalName}</p>
                    <p className="text-xs text-muted-foreground">{client.industry}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Relationship Details */}
            <Card>
              <CardHeader>
                <CardTitle>Relationship Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Acquisition Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(client.acquisitionDate || new Date())}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Satisfaction Score</p>
                    <p className="text-sm text-muted-foreground">
                      {client.satisfactionScore}/10
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Loyalty Score</p>
                    <p className="text-sm text-muted-foreground">
                      {client.loyaltyScore}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Projects</p>
                    <p className="text-sm text-muted-foreground">
                      {client.projects?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <ClientEngagementMetrics client={client} />
        </TabsContent>

        <TabsContent value="interactions">
          <ClientInteractionTimeline 
            client={client}
            onInteractionAdd={(interaction) => {
              // Handle new interaction
              console.log('New interaction:', interaction);
            }}
          />
        </TabsContent>

        <TabsContent value="preferences">
          <CommunicationPreferences 
            client={client}
            onPreferencesUpdate={(preferences) => {
              // Handle preferences update
              console.log('Preferences updated:', preferences);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
