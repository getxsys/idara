import { z } from 'zod';
import {
  ProjectStatus,
  PhaseStatus,
  TaskStatus,
  TaskPriority,
  ResourceType,
  RiskCategory,
  RiskSeverity,
  RiskStatus,
  RiskLevel,
  RecommendationType,
  RecommendationPriority,
} from '@/types/project';

// Base schemas
export const milestoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Milestone name is required').max(100),
  description: z.string().max(500).optional(),
  dueDate: z.date(),
  completed: z.boolean().default(false),
  completedAt: z.date().optional(),
  dependencies: z.array(z.string().uuid()).default([]),
});

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(1000).optional(),
  assigneeId: z.string().uuid(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.date(),
  estimatedHours: z.number().min(0).max(1000),
  actualHours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).default([]),
  dependencies: z.array(z.string().uuid()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const projectPhaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Phase name is required').max(100),
  description: z.string().max(500).optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.nativeEnum(PhaseStatus).default(PhaseStatus.NOT_STARTED),
  tasks: z.array(taskSchema).default([]),
  progress: z.number().min(0).max(100).default(0),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const timelineSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  milestones: z.array(milestoneSchema).default([]),
  phases: z.array(projectPhaseSchema).default([]),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const resourceAvailabilitySchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  availableHours: z.number().min(0).max(24),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const resourceSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(ResourceType),
  name: z.string().min(1, 'Resource name is required').max(100),
  allocation: z.number().min(0).max(100),
  cost: z.number().min(0),
  availability: z.array(resourceAvailabilitySchema).default([]),
});

export const riskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Risk title is required').max(200),
  description: z.string().max(1000),
  category: z.nativeEnum(RiskCategory),
  probability: z.number().min(0).max(1),
  impact: z.number().min(0).max(1),
  severity: z.nativeEnum(RiskSeverity),
  mitigation: z.string().max(1000),
  owner: z.string().min(1, 'Risk owner is required'),
  status: z.nativeEnum(RiskStatus).default(RiskStatus.IDENTIFIED),
  identifiedAt: z.date().default(() => new Date()),
  reviewDate: z.date(),
});

export const recommendationSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(RecommendationType),
  title: z.string().min(1, 'Recommendation title is required').max(200),
  description: z.string().max(1000),
  priority: z.nativeEnum(RecommendationPriority),
  actionRequired: z.boolean().default(false),
  estimatedImpact: z.string().max(500),
  createdAt: z.date().default(() => new Date()),
});

export const projectTrendSchema = z.object({
  metric: z.string().min(1, 'Metric name is required'),
  direction: z.enum(['up', 'down', 'stable']),
  change: z.number(),
  period: z.string().min(1, 'Period is required'),
  significance: z.enum(['low', 'medium', 'high']),
});

export const projectInsightsSchema = z.object({
  healthScore: z.number().min(0).max(100),
  riskLevel: z.nativeEnum(RiskLevel),
  completionPrediction: z.date(),
  budgetVariance: z.number(),
  scheduleVariance: z.number(),
  recommendations: z.array(recommendationSchema).default([]),
  trends: z.array(projectTrendSchema).default([]),
  lastUpdated: z.date().default(() => new Date()),
});

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(2000),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  timeline: timelineSchema,
  resources: z.array(resourceSchema).default([]),
  risks: z.array(riskSchema).default([]),
  aiInsights: projectInsightsSchema,
  collaborators: z.array(z.string().uuid()).default([]),
  documents: z.array(z.string().uuid()).default([]),
  clientId: z.string().uuid().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create project schema (for API endpoints)
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(2000),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  timeline: z.object({
    startDate: z.date(),
    endDate: z.date(),
    milestones: z.array(milestoneSchema.omit({ id: true })).default([]),
    phases: z.array(projectPhaseSchema.omit(['id', 'tasks'])).default([]),
  }).refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
  resources: z.array(resourceSchema.omit({ id: true })).default([]),
  risks: z.array(riskSchema.omit({ id: true })).default([]),
  collaborators: z.array(z.string().uuid()).default([]),
  documents: z.array(z.string().uuid()).default([]),
  clientId: z.string().uuid().optional(),
});

// Update project schema
export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});

// Project query schema
export const projectQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'status', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.nativeEnum(ProjectStatus).optional(),
  clientId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
});

// Task management schemas
export const createTaskSchema = taskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

export const taskQuerySchema = z.object({
  projectId: z.string().uuid(),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.date().optional(),
});

// Risk management schemas
export const createRiskSchema = riskSchema.omit({
  id: true,
  identifiedAt: true,
});

export const updateRiskSchema = createRiskSchema.partial().extend({
  id: z.string().uuid(),
});

// Type exports
export type ProjectData = z.infer<typeof projectSchema>;
export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type ProjectQueryData = z.infer<typeof projectQuerySchema>;
export type TaskData = z.infer<typeof taskSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type TaskQueryData = z.infer<typeof taskQuerySchema>;
export type RiskData = z.infer<typeof riskSchema>;
export type CreateRiskData = z.infer<typeof createRiskSchema>;
export type UpdateRiskData = z.infer<typeof updateRiskSchema>;