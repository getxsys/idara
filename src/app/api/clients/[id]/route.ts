import { NextResponse } from 'next/server';
import { clientRepository } from '@/lib/database/repository/client';
import { createClientSchema } from '@/lib/validations/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientRepository.findById(params.id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error(`Error fetching client ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = createClientSchema.safeParse(body);

    if (!validation.success) {
      console.error('Validation errors:', validation.error.formErrors);
      return NextResponse.json({ error: 'Invalid input', details: validation.error.formErrors }, { status: 400 });
    }

    const { contact, relationship, ...restOfData } = validation.data;

    const updateData = {
      name: restOfData.name,
      firstName: contact.primaryContact.firstName,
      lastName: contact.primaryContact.lastName,
      email: contact.primaryContact.email,
      phone: contact.primaryContact.phone,
      role: contact.primaryContact.role,
      department: contact.primaryContact.department,
      preferredContactMethod: contact.primaryContact.preferences.preferredContactMethod,
      communicationStyle: contact.primaryContact.preferences.communicationStyle,
      timezone: contact.primaryContact.preferences.timezone,
      language: contact.primaryContact.preferences.language,
      // Temporarily comment out other sections to isolate the issue
      /*
      companyLegalName: contact.company.legalName,
      industry: contact.company.industry,
      companySize: contact.company.size,
      website: contact.company.website,
      taxId: contact.company.taxId,
      registrationNumber: contact.company.registrationNumber,
      foundedYear: contact.company.foundedYear,
      streetAddress: contact.address.street,
      city: contact.address.city,
      stateProvince: contact.address.state,
      postalCode: contact.address.postalCode,
      country: contact.address.country,
      clientStatus: relationship.status,
      clientTier: relationship.tier,
      totalRevenue: relationship.totalRevenue,
      averageProjectValue: relationship.averageProjectValue,
      paymentMethod: relationship.paymentTerms.method,
      paymentTerms: relationship.paymentTerms.terms,
      currency: relationship.paymentTerms.currency,
      creditLimit: relationship.paymentTerms.creditLimit,
      contractType: relationship.contractDetails.type,
      contractStartDate: relationship.contractDetails.startDate,
      contractEndDate: relationship.contractDetails.endDate,
      contractRenewalDate: relationship.contractDetails.renewalDate,
      contractTerms: relationship.contractDetails.terms,
      contractValue: relationship.contractDetails.value,
      contractStatus: relationship.contractDetails.status,
      satisfactionScore: relationship.satisfactionScore,
      loyaltyScore: relationship.loyaltyScore,
      */
    };

    const updatedClient = await clientRepository.update(params.id, updateData);
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error(`Error updating client ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await clientRepository.delete(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting client ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
