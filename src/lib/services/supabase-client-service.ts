import { supabase } from '@/lib/supabase/client';
import { CreateClientData } from '@/lib/validations/client';
import { Client } from '@/types/client';

export class SupabaseClientService {
  async createClient(clientData: CreateClientData, ownerId: string): Promise<Client> {
    try {
      // Insert client data into Supabase
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          email: clientData.contact.primaryContact.email,
          phone: clientData.contact.primaryContact.phone,
          company: clientData.contact.company.legalName,
          address: `${clientData.contact.address.street}, ${clientData.contact.address.city}, ${clientData.contact.address.state} ${clientData.contact.address.postalCode}, ${clientData.contact.address.country}`,
          owner_id: ownerId,
          ai_profile: {
            contact: clientData.contact,
            relationship: clientData.relationship,
          },
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create client: ${error.message}`);
      }

      return this.mapSupabaseClientToClient(data);
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async getClient(id: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Client not found
        }
        throw new Error(`Failed to get client: ${error.message}`);
      }

      return this.mapSupabaseClientToClient(data);
    } catch (error) {
      console.error('Error getting client:', error);
      throw error;
    }
  }

  async getClients(ownerId: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get clients: ${error.message}`);
      }

      return data.map(this.mapSupabaseClientToClient);
    } catch (error) {
      console.error('Error getting clients:', error);
      throw error;
    }
  }

  async updateClient(id: string, clientData: Partial<CreateClientData>): Promise<Client> {
    try {
      const updateData: any = {};

      if (clientData.name) updateData.name = clientData.name;
      if (clientData.contact?.primaryContact?.email) updateData.email = clientData.contact.primaryContact.email;
      if (clientData.contact?.primaryContact?.phone) updateData.phone = clientData.contact.primaryContact.phone;
      if (clientData.contact?.company?.legalName) updateData.company = clientData.contact.company.legalName;
      
      if (clientData.contact?.address) {
        const address = clientData.contact.address;
        updateData.address = `${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
      }

      if (clientData.contact || clientData.relationship) {
        // Get current ai_profile and merge with new data
        const { data: currentClient } = await supabase
          .from('clients')
          .select('ai_profile')
          .eq('id', id)
          .single();

        const currentProfile = currentClient?.ai_profile || {};
        updateData.ai_profile = {
          ...currentProfile,
          ...(clientData.contact && { contact: clientData.contact }),
          ...(clientData.relationship && { relationship: clientData.relationship }),
        };
      }

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update client: ${error.message}`);
      }

      return this.mapSupabaseClientToClient(data);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete client: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  private mapSupabaseClientToClient(data: any): Client {
    return {
      id: data.id,
      name: data.name,
      contact: data.ai_profile?.contact || {
        primaryContact: {
          firstName: '',
          lastName: '',
          email: data.email || '',
          phone: data.phone || '',
          role: '',
          department: '',
          isPrimary: true,
          preferences: {
            preferredContactMethod: 'EMAIL' as any,
            bestTimeToContact: [],
            timezone: 'UTC',
            language: 'en',
            communicationStyle: 'FORMAL' as any,
          },
        },
        additionalContacts: [],
        company: {
          legalName: data.company || '',
          industry: '',
          size: 'SMALL' as any,
          website: '',
          taxId: '',
          registrationNumber: '',
        },
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          type: 'OFFICE' as any,
        },
        socialMedia: {},
      },
      relationship: data.ai_profile?.relationship || {
        status: 'PROSPECT' as any,
        tier: 'BRONZE' as any,
        acquisitionDate: new Date(),
        lastContactDate: new Date(),
        totalRevenue: 0,
        averageProjectValue: 0,
        paymentTerms: {
          method: 'BANK_TRANSFER' as any,
          terms: 'Net 30',
          currency: 'USD',
          paymentHistory: [],
        },
        contractDetails: {
          type: 'SERVICE_AGREEMENT' as any,
          startDate: new Date(),
          terms: '',
          value: 0,
          status: 'DRAFT' as any,
        },
        satisfactionScore: 5,
        loyaltyScore: 50,
      },
      projects: [],
      interactions: [],
      documents: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}