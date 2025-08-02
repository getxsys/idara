'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Mail, Phone, Building } from 'lucide-react';
import { CreateClientDialog } from './CreateClientDialog';
import { EditClientDialog } from './EditClientDialog';
import { DeleteClientDialog } from './DeleteClientDialog';
import { useToast } from '@/contexts/ToastContext';

interface SimpleClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function SimpleClientList() {
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<SimpleClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<SimpleClient | null>(null);

  // Fetch clients from API
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clients');
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data.clients || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching clients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch clients';
      setError(errorMessage);
      showError('Error Loading Clients', errorMessage);
    } finally {
      setIsLoading(false);
    }
  });

  // Load clients on component mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filter clients based on search term
  useEffect(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  // Handle client creation
  const handleClientCreated = (newClient: any) => {
    const simpleClient: SimpleClient = {
      id: newClient.id,
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      company: newClient.company,
      address: newClient.address,
    };
    
    setClients(prev => [simpleClient, ...prev]);
    setShowCreateDialog(false);
    showSuccess('Client Created', `${newClient.name} has been successfully created.`);
  };

  // Handle client update
  const handleClientUpdated = (updatedClient: SimpleClient) => {
    setClients(prev => 
      prev.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    );
    setShowEditDialog(false);
    setSelectedClient(null);
    showSuccess('Client Updated', `${updatedClient.name} has been successfully updated.`);
  };

  // Handle client deletion
  const handleClientDeleted = (clientId: string) => {
    console.log('=== DELETE CLIENT HANDLER START ===');
    console.log('Current URL:', window.location.href);
    console.log('handleClientDeleted called with clientId:', clientId);
    
    const deletedClient = clients.find(client => client.id === clientId);
    console.log('Found deleted client:', deletedClient);
    
    // Update the client list immediately
    setClients(prev => {
      const newClients = prev.filter(client => client.id !== clientId);
      console.log('Updated clients list, new length:', newClients.length);
      return newClients;
    });
    
    // Close dialog and clear selection
    setShowDeleteDialog(false);
    setSelectedClient(null);
    
    // Prevent any potential navigation by ensuring we stay on current page
    if (typeof window !== 'undefined') {
      // Clear any pending navigation
      const currentPath = window.location.pathname + window.location.search;
      console.log('Current path before replaceState:', currentPath);
      window.history.replaceState(null, '', currentPath);
      
      // Prevent any future navigation for a short time
      const originalPushState = window.history.pushState;
      window.history.pushState = (state, title, url) => {
        console.log('Navigation prevented:', url);
        return;
      };
      
      setTimeout(() => {
        window.history.pushState = originalPushState;
        console.log('Navigation prevention removed');
      }, 1000);
    }
    
    // Show success toast
    const clientName = deletedClient?.name || 'Client';
    console.log('About to show success toast for:', clientName);
    
    try {
      showSuccess('Client Deleted', `${clientName} has been successfully deleted.`);
      console.log('Toast shown successfully');
    } catch (error) {
      console.error('Error showing toast:', error);
    }
    
    console.log('=== DELETE CLIENT HANDLER END ===');
  };

  // Open edit dialog
  const handleEditClick = (client: SimpleClient) => {
    console.log('Edit button clicked for client:', client);
    setSelectedClient(client);
    setShowEditDialog(true);
  };

  // Open delete dialog
  const handleDeleteClick = (client: SimpleClient) => {
    console.log('Delete button clicked for client:', client);
    setSelectedClient(client);
    setShowDeleteDialog(true);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage your client relationships and track engagement
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={fetchClients}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredClients.length} Client{filteredClients.length !== 1 ? 's' : ''}
          </CardTitle>
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
              {!searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Button>
              )}
            </div>
          ) : (
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
                    onClick={(e) => {
                      // Prevent any row-level navigation
                      e.preventDefault();
                      e.stopPropagation();
                    }}
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
                      {client.company && (
                        <div className="flex items-center">
                          <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                          {client.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {client.address || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(client.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClick(client);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick(client);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateClientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onClientCreated={handleClientCreated}
      />

      <EditClientDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
      />

      <DeleteClientDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        client={selectedClient}
        onClientDeleted={handleClientDeleted}
      />
    </div>
  );
}