'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createClientSchema, type CreateClientData } from '@/lib/validations/client';
import {
  ClientStatus,
  ClientTier,
  CompanySize,
  AddressType,
  ContactMethod,
  CommunicationStyle,
  PaymentMethod,
  ContractType,
  ContractStatus,
} from '@/types/client';

interface ClientFormProps {
  initialData?: Partial<CreateClientData>;
  onSubmit: (data: CreateClientData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function ClientForm({ initialData, onSubmit, onCancel, isLoading }: ClientFormProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const form = useForm<CreateClientData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: initialData?.name || '',
      contact: {
        primaryContact: {
          firstName: initialData?.contact?.primaryContact?.firstName || '',
          lastName: initialData?.contact?.primaryContact?.lastName || '',
          email: initialData?.contact?.primaryContact?.email || '',
          phone: initialData?.contact?.primaryContact?.phone || '',
          role: initialData?.contact?.primaryContact?.role || '',
          department: initialData?.contact?.primaryContact?.department || '',
          isPrimary: true,
          preferences: {
            preferredContactMethod: initialData?.contact?.primaryContact?.preferences?.preferredContactMethod || ContactMethod.EMAIL,
            bestTimeToContact: initialData?.contact?.primaryContact?.preferences?.bestTimeToContact || [],
            timezone: initialData?.contact?.primaryContact?.preferences?.timezone || 'UTC',
            language: initialData?.contact?.primaryContact?.preferences?.language || 'en',
            communicationStyle: initialData?.contact?.primaryContact?.preferences?.communicationStyle || CommunicationStyle.FORMAL,
          },
        },
        additionalContacts: initialData?.contact?.additionalContacts || [],
        company: {
          legalName: initialData?.contact?.company?.legalName || '',
          industry: initialData?.contact?.company?.industry || '',
          size: initialData?.contact?.company?.size || CompanySize.SMALL,
          website: initialData?.contact?.company?.website || '',
          taxId: initialData?.contact?.company?.taxId || '',
          registrationNumber: initialData?.contact?.company?.registrationNumber || '',
          foundedYear: initialData?.contact?.company?.foundedYear || undefined,
        },
        address: {
          street: initialData?.contact?.address?.street || '',
          city: initialData?.contact?.address?.city || '',
          state: initialData?.contact?.address?.state || '',
          postalCode: initialData?.contact?.address?.postalCode || '',
          country: initialData?.contact?.address?.country || '',
          type: initialData?.contact?.address?.type || AddressType.OFFICE,
        },
        socialMedia: initialData?.contact?.socialMedia || {},
      },
      relationship: {
        status: initialData?.relationship?.status || ClientStatus.PROSPECT,
        tier: initialData?.relationship?.tier || ClientTier.BRONZE,
        acquisitionDate: initialData?.relationship?.acquisitionDate || new Date(),
        lastContactDate: initialData?.relationship?.lastContactDate || new Date(),
        totalRevenue: initialData?.relationship?.totalRevenue || 0,
        averageProjectValue: initialData?.relationship?.averageProjectValue || 0,
        paymentTerms: {
          method: initialData?.relationship?.paymentTerms?.method || PaymentMethod.BANK_TRANSFER,
          terms: initialData?.relationship?.paymentTerms?.terms || 'Net 30',
          currency: initialData?.relationship?.paymentTerms?.currency || 'USD',
          creditLimit: initialData?.relationship?.paymentTerms?.creditLimit || undefined,
          paymentHistory: initialData?.relationship?.paymentTerms?.paymentHistory || [],
        },
        contractDetails: {
          type: initialData?.relationship?.contractDetails?.type || ContractType.SERVICE_AGREEMENT,
          startDate: initialData?.relationship?.contractDetails?.startDate || new Date(),
          endDate: initialData?.relationship?.contractDetails?.endDate || undefined,
          renewalDate: initialData?.relationship?.contractDetails?.renewalDate || undefined,
          terms: initialData?.relationship?.contractDetails?.terms || '',
          value: initialData?.relationship?.contractDetails?.value || 0,
          status: initialData?.relationship?.contractDetails?.status || ContractStatus.DRAFT,
        },
        satisfactionScore: initialData?.relationship?.satisfactionScore || 5,
        loyaltyScore: initialData?.relationship?.loyaltyScore || 50,
      },
    },
  });

  const handleSubmit = async (data: CreateClientData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting client form:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact Details</TabsTrigger>
            <TabsTrigger value="company">Company Info</TabsTrigger>
            <TabsTrigger value="relationship">Relationship</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact.primaryContact.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact.primaryContact.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact.primaryContact.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact.primaryContact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact.primaryContact.role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CEO, Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact.primaryContact.department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Sales, Marketing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact.primaryContact.preferences.preferredContactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Contact Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(ContactMethod).map((method) => (
                              <SelectItem key={method} value={method}>
                                {method.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact.primaryContact.preferences.communicationStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Communication Style</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CommunicationStyle).map((style) => (
                              <SelectItem key={style} value={style}>
                                {style.charAt(0).toUpperCase() + style.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact.primaryContact.preferences.timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input placeholder="UTC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact.primaryContact.preferences.language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Input placeholder="en" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contact.company.legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Legal Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact.company.industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Technology, Healthcare" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact.company.size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CompanySize).map((size) => (
                              <SelectItem key={size} value={size}>
                                {size.charAt(0).toUpperCase() + size.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contact.company.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Address</h4>
                  <FormField
                    control={form.control}
                    name="contact.address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact.address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.address.postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact.address.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relationship" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relationship Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="relationship.status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(ClientStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relationship.tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Tier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(ClientTier).map((tier) => (
                              <SelectItem key={tier} value={tier}>
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="relationship.totalRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Revenue</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relationship.averageProjectValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Project Value</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="relationship.contractDetails.terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Terms</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter contract terms and conditions"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Client'}
          </Button>
        </div>
      </form>
    </Form>
  );
}