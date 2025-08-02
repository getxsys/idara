import { UserRepository } from '../user';
import { UserRole } from '../../../generated/prisma';
import { prisma } from '../../connection';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let testUserId: string;

  beforeAll(async () => {
    userRepository = new UserRepository();
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
      } catch (error) {
        // User might not exist, ignore error
      }
    }
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'hashedpassword123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      };

      const user = await userRepository.create(userData);
      testUserId = user.id;

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }

      const user = await userRepository.findById(testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
    });

    it('should return null for non-existent user', async () => {
      const user = await userRepository.findById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }

      const createdUser = await userRepository.findById(testUserId);
      if (!createdUser) {
        throw new Error('Created user not found');
      }

      const user = await userRepository.findByEmail(createdUser.email);

      expect(user).toBeDefined();
      expect(user?.email).toBe(createdUser.email);
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        preferences: {
          theme: 'light',
          notifications: false,
        },
      };

      const updatedUser = await userRepository.update(testUserId, updateData);

      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
    });
  });

  describe('findMany', () => {
    it('should return array of users', async () => {
      const users = await userRepository.findMany({ take: 10 });

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('count', () => {
    it('should return user count', async () => {
      const count = await userRepository.count();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const users = await userRepository.findByRole(UserRole.USER);

      expect(Array.isArray(users)).toBe(true);
      users.forEach(user => {
        expect(user.role).toBe(UserRole.USER);
      });
    });
  });
});