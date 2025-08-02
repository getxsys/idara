'use client';
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MoreHorizontal, Mail, Phone, Building } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ClientDashboard from '@/components/clients/ClientDashboard';
import { ActionPriority, ContactMethod, DayOfWeek, CommunicationStyle, CompanySize, Address, ClientStatus, ClientTier, PaymentTerms, ContractDetails, EngagementLevel, CommunicationFrequency, MeetingType, DecisionMakingStyle, ResponseTimeExpectation, ProjectManagementStyle } from '@/types/client';

interface SimpleClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyLegalName?: string;
  streetAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<SimpleClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<SimpleClient | null>(null);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clients', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else {
        setClients([]);
        showError('Error Loading Clients', 'Failed to load clients. Please try again.');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
      showError('Error Loading Clients', 'Failed to load clients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadClients();
    // The visibilitychange listener is removed to prevent over-fetching.
    // Real-time updates are handled by the Supabase subscription.

    const channel = supabase.channel('public:clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        loadClients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadClients]);

  useEffect(() => {
    let filtered = clients;
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.companyLegalName && client.companyLegalName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  useEffect(() => {
    if (!selectedClient && filteredClients.length > 0) {
      setSelectedClient(filteredClients[0]);
    }
  }, [filteredClients, selectedClient]);

  const handleClientDelete = async (clientId: string) => {
    try {
      console.log('Dashboard: Deleting client with ID:', clientId);
      const clientToDelete = clients.find(client => client.id === clientId);
      const clientName = clientToDelete?.name || 'Client';
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
      showSuccess('Client Deleted', `${clientName} has been successfully deleted.`);
      await loadClients();
      setSelectedClient(null);
      console.log('Dashboard: Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      showError('Delete Failed', 'Failed to delete client. Please try again.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">Manage your client relationships and track engagement</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search clients..."
          className="pl-9 pr-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredClients.length} Client{filteredClients.length !== 1 ? 's' : ''}
            </CardTitle>
            <Button onClick={() => router.push('/dashboard/clients/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No clients found matching your search' : 'No clients found'}
              </p>
            </div>
          ) : (
            <div className="max-h-[288px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedClient?.id === client.id ? 'bg-primary/10' : ''}`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <TableCell>
                        <div className="font-medium">{client.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="mr-1 h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-1 h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.companyLegalName && (
                          <div className="flex items-center">
                            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                            {client.companyLegalName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {client.streetAddress || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(client.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                            }}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/clients/${client.id}/edit`);
                            }}>
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete ${client.name}?`)) {
                                  handleClientDelete(client.id);
                                }
                              }}
                            >
                              Delete Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        {selectedClient ? (
          <ClientDashboard client={
            (() => {
              const mappedClient = {
                id: selectedClient.id,
                name: selectedClient.name,
                contact: {
                  primaryContact: {
                    id: selectedClient.id + '-primary',
                    isPrimary: true,
                    preferences: {
                      preferredContactMethod: 'email' as ContactMethod,
                      bestTimeToContact: [
                        {
                          start: '09:00',
                          end: '17:00',
                          label: 'Business Hours',
                          days: [
                            DayOfWeek.MONDAY,
                            DayOfWeek.TUESDAY,
                            DayOfWeek.WEDNESDAY,
                            DayOfWeek.THURSDAY,
                            DayOfWeek.FRIDAY,
                          ],
                        }
                      ],
                      timezone: 'UTC',
                      language: 'English',
                      communicationStyle: CommunicationStyle.FORMAL,
                    },
                    firstName: selectedClient.name?.split(' ')[0] || '',
                    lastName: selectedClient.name?.split(' ')[1] || '',
                    email: selectedClient.email || '',
                    phone: selectedClient.phone || '',
                    role: '',
                  },
                  company: {
                    legalName: selectedClient.companyLegalName || '',
                    industry: '',
                    size: CompanySize.SMALL,
                  },
                  additionalContacts: [],
                  address: {
                    street: selectedClient.streetAddress || '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: '',
                  } as Address,
                  socialMedia: {},
                },
                relationship: {
                  status: ClientStatus.ACTIVE,
                  tier: Object.values(ClientTier)[0],
                  totalRevenue: 0,
                  averageProjectValue: 0,
                  lastContactDate: selectedClient.updatedAt ? new Date(selectedClient.updatedAt) : (selectedClient.createdAt ? new Date(selectedClient.createdAt) : new Date()),
                  acquisitionDate: selectedClient.createdAt ? new Date(selectedClient.createdAt) : new Date(),
                  satisfactionScore: 0,
                  loyaltyScore: 0,
                  paymentTerms: 'Net 30' as unknown as PaymentTerms,
                  contractDetails: {
                    contractId: '',
                    startDate: new Date(),
                    endDate: new Date(),
                    terms: '',
                    status: '',
                    type: '',
                    value: '',
                  } as unknown as ContractDetails,
                },
                projects: [],
                aiProfile: {
                  healthScore: 0,
                  engagementLevel: EngagementLevel.MEDIUM,
                  churnRisk: 0.1,
                  insights: [],
                  nextBestAction: {
                    action: 'No action available',
                    reason: '',
                    estimatedImpact: '',
                    priority: ActionPriority.MEDIUM,
                    suggestedDate: new Date(),
                  },
                  preferences: {
                    communicationFrequency: CommunicationFrequency.MONTHLY,
                    preferredMeetingTypes: [MeetingType.STATUS_UPDATE],
                    decisionMakingStyle: DecisionMakingStyle.ANALYTICAL,
                    responseTimeExpectation: ResponseTimeExpectation.NEXT_DAY,
                    projectManagementStyle: ProjectManagementStyle.AGILE,
                  },
                  communicationStyle: CommunicationStyle.FORMAL,
                  predictedLifetimeValue: 0,
                  lastAnalyzed: new Date(),
                },
                interactions: [],
                createdAt: new Date(selectedClient.createdAt || ''),
                updatedAt: new Date(selectedClient.updatedAt || ''),
              };
              return mappedClient;
            })()
          } />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <span>Select a client to view details</span>
          </div>
        )}
      </div>
    </div>
  );
}
