import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.create({
    data: {
     
    email: 'mezioud@getx.ma',
    password: 'aaaaa',
    firstName: 'baba',
    lastName: 'safa',
    avatar: null,
    role: 'USER',
    isActive: true,
    mfaEnabled: false,
    mfaSecret: null,

    createdAt: new Date(),
    updatedAt: new Date(),

    },
  });
  console.log(users);
}

main();
