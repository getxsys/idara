'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import ClientDashboard from '@/components/clients/ClientDashboard';
import { Client } from '@/types/client';
import { clientRepository } from '@/lib/database/repository/client';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const clientData = await clientRepository.findById(clientId);
      if (clientData) {
        setClient(clientData);
      } else {
        setError('Client not found');
      }
    } catch (error) {
      console.error('Error loading client:', error);
      setError('Failed to load client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientUpdate = async (updatedClient: Client) => {
    try {
      await clientRepository.update(updatedClient.id, updatedClient);
      setClient(updatedClient);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {error || 'Client not found'}
          </h1>
          <Button onClick={() => router.push('/dashboard/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/clients')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        <Button
          onClick={() => router.push(`/dashboard/clients/${clientId}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Client
        </Button>
      </div>

      {/* Client Dashboard */}
      <ClientDashboard
        client={client}
        onClientUpdate={handleClientUpdate}
      />
    </div>
  );
}