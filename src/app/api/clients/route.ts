import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';
import { createClientSchema } from '@/lib/validations/client';

export async function POST(request: NextRequest) {
  try {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return NextResponse.json({ error: 'No users found in database. Please create a user first.' }, { status: 400 });
    }
    const userId = firstUser.id;

    const body = await request.json();
    const validation = createClientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.formErrors }, { status: 400 });
    }

    const { contact, relationship, ...restOfData } = validation.data;

    const newClient = await prisma.client.create({
      data: {
        ...restOfData,
        ownerId: userId,
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
        companyLegalName: contact.company.legalName,
        industry: contact.company.industry,
        companySize: contact.company.size,
        website: contact.company.website,
        streetAddress: contact.address.street,
        city: contact.address.city,
        stateProvince: contact.address.state,
        postalCode: contact.address.postalCode,
        country: contact.address.country,
        clientStatus: relationship.status,
        clientTier: relationship.tier,
        totalRevenue: relationship.totalRevenue,
        averageProjectValue: relationship.averageProjectValue,
        contractTerms: relationship.contractDetails.terms,
      },
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}
