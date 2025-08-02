import { PrismaClient, UserRole, ProjectStatus, DocumentType, AccessLevel, InteractionType } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      preferences: JSON.stringify({
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
        },
        dashboard: {
          layout: 'grid',
          widgets: ['kpi', 'projects', 'clients'],
        },
      }),
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password: managerPassword,
      firstName: 'John',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      preferences: JSON.stringify({
        theme: 'light',
        notifications: {
          email: true,
          push: false,
        },
      }),
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.USER,
    },
  });

  console.log('✅ Users created');

  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { id: 'client1' }, // Use a fixed ID for upsert to prevent duplicates on re-run
    update: {
      name: 'Acme Corp',
      email: 'contact@acmecorp.com',
      phone: '+15551234567',
      companyLegalName: 'Acme Corporation Inc.',
      streetAddress: '123 Main St',
      ownerId: admin.id, // Assign to the admin user
    },
    create: {
      id: 'client1',
      name: 'Acme Corp',
      email: 'contact@acmecorp.com',
      phone: '+15551234567',
      companyLegalName: 'Acme Corporation Inc.',
      streetAddress: '123 Main St',
      ownerId: admin.id, // Assign to the admin user
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client2' },
    update: {
      name: 'Globex Inc.',
      email: 'info@globex.net',
      phone: '+15559876543',
      companyLegalName: 'Globex Incorporated',
      streetAddress: '456 Oak Ave',
      ownerId: manager.id, // Assign to the manager user
    },
    create: {
      id: 'client2',
      name: 'Globex Inc.',
      email: 'info@globex.net',
      phone: '+15559876543',
      companyLegalName: 'Globex Incorporated',
      streetAddress: '456 Oak Ave',
      ownerId: manager.id, // Assign to the manager user
    },
  });

  console.log('✅ Sample clients created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Clients: ${await prisma.client.count()}`);
  console.log(`- Projects: ${await prisma.project.count()}`);
  console.log(`- Documents: ${await prisma.document.count()}`);
  console.log(`- Interactions: ${await prisma.interaction.count()}`);
  console.log(`- Project Members: ${await prisma.projectMember.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
