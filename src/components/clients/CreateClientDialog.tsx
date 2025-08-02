'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client } from '@/types/client';
import { useToast } from '@/contexts/ToastContext';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: Client) => void;
}

export function CreateClientDialog({ 
  open, 
  onOpenChange, 
  onClientCreated 
}: CreateClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Submitting form data:', formData);
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Client name is required');
      }

      // Call the API to create the client
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
        }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create client');
      }

      const result = await response.json();
      console.log('API Success:', result);
      
      // Create a client object from the API response
      const newClient: Client = {
        id: result.id,
        name: result.name,
        contact: {
          primaryContact: {
            id: `contact-${result.id}`,
            firstName: result.name.split(' ')[0] || 'Unknown',
            lastName: result.name.split(' ').slice(1).join(' ') || 'Client',
            email: result.email || '',
            phone: result.phone || '',
            role: 'Primary Contact',
            department: 'General',
            isPrimary: true,
            preferences: {
              preferredContactMethod: 'email' as any,
              bestTimeToContact: [],
              timezone: 'America/New_York',
              language: 'en',
              communicationStyle: 'formal' as any,
            },
          },
          additionalContacts: [],
          company: {
            legalName: result.company || result.name,
            industry: 'Technology',
            size: 'medium' as any,
          },
          address: {
            street: '123 Business St',
            city: 'Business City',
            state: 'BC',
            postalCode: '12345',
            country: 'United States',
            type: 'office' as any,
          },
          socialMedia: {},
        },
        relationship: {
          status: 'active' as any,
          tier: 'bronze' as any,
          acquisitionDate: new Date(),
          lastContactDate: new Date(),
          totalRevenue: 0,
          averageProjectValue: 0,
          paymentTerms: {
            method: 'bank_transfer' as any,
            terms: 'Net 30',
            currency: 'USD',
            paymentHistory: [],
          },
          contractDetails: {
            type: 'service_agreement' as any,
            startDate: new Date(),
            terms: 'Standard terms',
            value: 0,
            status: 'active' as any,
          },
          satisfactionScore: 8,
          loyaltyScore: 75,
        },
        projects: [],
        interactions: [],
        aiProfile: {
          healthScore: 75,
          engagementLevel: 'medium' as any,
          churnRisk: 0.2,
          preferences: {
            communicationFrequency: 'weekly' as any,
            preferredMeetingTypes: [],
            decisionMakingStyle: 'analytical' as any,
            responseTimeExpectation: 'same_day' as any,
            projectManagementStyle: 'agile' as any,
          },
          communicationStyle: 'formal' as any,
          predictedLifetimeValue: 100000,
          nextBestAction: {
            action: 'Initial contact',
            reason: 'New client onboarding',
            priority: 'medium' as unknown,
            estimatedImpact: 'Establish relationship',
            suggestedDate: new Date(),
          },
          insights: [],
          lastAnalyzed: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onClientCreated(newClient);
      onOpenChange(false);
      setFormData({ name: '', email: '', phone: '', company: '' });
      
    } catch (error) {
      console.error('Error creating client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      showError('Creation Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter client name"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Enter company name"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}