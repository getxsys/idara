import { describe, it, expect } from '@jest/globals';
import {
  projectSchema,
  createProjectSchema,
  updateProjectSchema,
  taskSchema,
  riskSchema,
  milestoneSchema,
  timelineSchema,
} from '../project';
import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  RiskCategory,
  RiskSeverity,
  RiskStatus,
  RiskLevel,
  RecommendationType,
  RecommendationPriority,
} from '@/types/project';

describe('Project Validation Schemas', () => {
  describe('milestoneSchema', () => {
    it('should validate a valid milestone', () => {
      const validMilestone = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Project Kickoff',
        description: 'Initial project meeting',
        dueDate: new Date('2024-12-31'),
        completed: false,
        dependencies: [],
      };

      const result = milestoneSchema.safeParse(validMilestone);
      expect(result.success).toBe(true);
    });

    it('should reject milestone with invalid UUID', () => {
      const invalidMilestone = {
        id: 'invalid-uuid',
        name: 'Project Kickoff',
        dueDate: new Date('2024-12-31'),
        completed: false,
        dependencies: [],
      };

      const result = milestoneSchema.safeParse(invalidMilestone);
      expect(result.success).toBe(false);
    });

    it('should reject milestone with empty name', () => {
      const invalidMilestone = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        dueDate: new Date('2024-12-31'),
        completed: false,
        dependencies: [],
      };

      const result = milestoneSchema.safeParse(invalidMilestone);
      expect(result.success).toBe(false);
    });
  });

  describe('taskSchema', () => {
    it('should validate a valid task', () => {
      const validTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Implement user authentication',
        description: 'Add login and registration functionality',
        assigneeId: '123e4567-e89b-12d3-a456-426614174001',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-12-31'),
        estimatedHours: 40,
        tags: ['backend', 'security'],
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = taskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should reject task with negative estimated hours', () => {
      const invalidTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Implement user authentication',
        assigneeId: '123e4567-e89b-12d3-a456-426614174001',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-12-31'),
        estimatedHours: -10,
        tags: [],
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should set default values for optional fields', () => {
      const minimalTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test task',
        assigneeId: '123e4567-e89b-12d3-a456-426614174001',
        dueDate: new Date('2024-12-31'),
        estimatedHours: 8,
      };

      const result = taskSchema.safeParse(minimalTask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(TaskStatus.TODO);
        expect(result.data.priority).toBe(TaskPriority.MEDIUM);
        expect(result.data.tags).toEqual([]);
        expect(result.data.dependencies).toEqual([]);
      }
    });
  });

  describe('riskSchema', () => {
    it('should validate a valid risk', () => {
      const validRisk = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Budget overrun risk',
        description: 'Project may exceed allocated budget',
        category: RiskCategory.BUDGET,
        probability: 0.3,
        impact: 0.8,
        severity: RiskSeverity.HIGH,
        mitigation: 'Regular budget reviews and cost tracking',
        owner: 'John Doe',
        status: RiskStatus.IDENTIFIED,
        reviewDate: new Date('2024-12-31'),
      };

      const result = riskSchema.safeParse(validRisk);
      expect(result.success).toBe(true);
    });

    it('should reject risk with probability outside 0-1 range', () => {
      const invalidRisk = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Budget overrun risk',
        description: 'Project may exceed allocated budget',
        category: RiskCategory.BUDGET,
        probability: 1.5,
        impact: 0.8,
        severity: RiskSeverity.HIGH,
        mitigation: 'Regular budget reviews',
        owner: 'John Doe',
        reviewDate: new Date('2024-12-31'),
      };

      const result = riskSchema.safeParse(invalidRisk);
      expect(result.success).toBe(false);
    });
  });

  describe('timelineSchema', () => {
    it('should validate a valid timeline', () => {
      const validTimeline = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        milestones: [],
        phases: [],
      };

      const result = timelineSchema.safeParse(validTimeline);
      expect(result.success).toBe(true);
    });

    it('should reject timeline with end date before start date', () => {
      const invalidTimeline = {
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
        milestones: [],
        phases: [],
      };

      const result = timelineSchema.safeParse(invalidTimeline);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('End date must be after start date');
      }
    });
  });

  describe('projectSchema', () => {
    it('should validate a complete project', () => {
      const validProject = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'E-commerce Platform',
        description: 'Build a modern e-commerce platform',
        status: ProjectStatus.ACTIVE,
        timeline: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          milestones: [],
          phases: [],
        },
        resources: [],
        risks: [],
        aiInsights: {
          healthScore: 85,
          riskLevel: RiskLevel.LOW,
          completionPrediction: new Date('2024-12-15'),
          budgetVariance: 5,
          scheduleVariance: -2,
          recommendations: [],
          trends: [],
          lastUpdated: new Date(),
        },
        collaborators: [],
        documents: [],
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = projectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('should reject project with empty name', () => {
      const invalidProject = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        description: 'Build a modern e-commerce platform',
        status: ProjectStatus.ACTIVE,
        timeline: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          milestones: [],
          phases: [],
        },
        resources: [],
        risks: [],
        aiInsights: {
          healthScore: 85,
          riskLevel: RiskLevel.LOW,
          completionPrediction: new Date('2024-12-15'),
          budgetVariance: 5,
          scheduleVariance: -2,
          recommendations: [],
          trends: [],
          lastUpdated: new Date(),
        },
        collaborators: [],
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = projectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });
  });

  describe('createProjectSchema', () => {
    it('should validate project creation data', () => {
      const createData = {
        name: 'New Project',
        description: 'A new project description',
        status: ProjectStatus.PLANNING,
        timeline: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          milestones: [],
          phases: [],
        },
        resources: [],
        risks: [],
        collaborators: [],
        documents: [],
      };

      const result = createProjectSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });

    it('should accept creation data without id field', () => {
      const createData = {
        name: 'New Project',
        description: 'A new project description',
        timeline: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          milestones: [],
          phases: [],
        },
        resources: [],
        risks: [],
        collaborators: [],
        documents: [],
      };

      const result = createProjectSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateProjectSchema', () => {
    it('should validate partial project update data', () => {
      const updateData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Project Name',
        status: ProjectStatus.ON_HOLD,
      };

      const result = updateProjectSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should require id field for updates', () => {
      const updateData = {
        name: 'Updated Project Name',
        status: ProjectStatus.ON_HOLD,
      };

      const result = updateProjectSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });
  });
});