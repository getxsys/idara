import { ProjectRepository } from '../project';
import { UserRepository } from '../user';
import { ProjectStatus, UserRole } from '../../../generated/prisma';
import { prisma } from '../../connection';

describe('ProjectRepository', () => {
  let projectRepository: ProjectRepository;
  let userRepository: UserRepository;
  let testProjectId: string;
  let testUserId: string;

  beforeAll(async () => {
    projectRepository = new ProjectRepository();
    userRepository = new UserRepository();

    // Create a test user for project ownership
    const testUser = await userRepository.create({
      email: `project-test-${Date.now()}@example.com`,
      password: 'hashedpassword123',
      firstName: 'Project',
      lastName: 'Tester',
      role: UserRole.USER,
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testProjectId) {
      try {
        await prisma.project.delete({ where: { id: testProjectId } });
      } catch (error) {
        // Project might not exist, ignore error
      }
    }
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
    it('should create a new project', async () => {
      const projectData = {
        name: `Test Project ${Date.now()}`,
        description: 'A test project for integration testing',
        status: ProjectStatus.PLANNING,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        aiInsights: {
          healthScore: 85,
          riskLevel: 'LOW',
          recommendations: ['Test recommendation'],
        },
      };

      const project = await projectRepository.create(projectData);
      testProjectId = project.id;

      expect(project).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.description).toBe(projectData.description);
      expect(project.status).toBe(projectData.status);
      expect(project.id).toBeDefined();
      expect(project.createdAt).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find project by id', async () => {
      if (!testProjectId) {
        throw new Error('Test project not created');
      }

      const project = await projectRepository.findById(testProjectId);

      expect(project).toBeDefined();
      expect(project?.id).toBe(testProjectId);
    });

    it('should return null for non-existent project', async () => {
      const project = await projectRepository.findById('non-existent-id');
      expect(project).toBeNull();
    });
  });

  describe('update', () => {
    it('should update project data', async () => {
      if (!testProjectId) {
        throw new Error('Test project not created');
      }

      const updateData = {
        name: 'Updated Project Name',
        status: ProjectStatus.IN_PROGRESS,
        aiInsights: {
          healthScore: 90,
          riskLevel: 'LOW',
          recommendations: ['Updated recommendation'],
        },
      };

      const updatedProject = await projectRepository.update(testProjectId, updateData);

      expect(updatedProject.name).toBe(updateData.name);
      expect(updatedProject.status).toBe(updateData.status);
    });
  });

  describe('findByStatus', () => {
    it('should find projects by status', async () => {
      const projects = await projectRepository.findByStatus(ProjectStatus.PLANNING);

      expect(Array.isArray(projects)).toBe(true);
      projects.forEach(project => {
        expect(project.status).toBe(ProjectStatus.PLANNING);
      });
    });
  });

  describe('addMember', () => {
    it('should add member to project', async () => {
      if (!testProjectId || !testUserId) {
        throw new Error('Test project or user not created');
      }

      await projectRepository.addMember({
        userId: testUserId,
        projectId: testProjectId,
        role: 'MEMBER',
      });

      // Verify member was added
      const projectWithMembers = await projectRepository.findManyWithRelations({
        where: { id: testProjectId },
      });

      expect(projectWithMembers[0]?.members).toBeDefined();
      expect(projectWithMembers[0]?.members?.length).toBeGreaterThan(0);
    });
  });

  describe('findMany', () => {
    it('should return array of projects', async () => {
      const projects = await projectRepository.findMany({ take: 10 });

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('count', () => {
    it('should return project count', async () => {
      const count = await projectRepository.count();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});