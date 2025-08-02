export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  timeline: Timeline;
  resources: Resource[];
  risks: Risk[];
  aiInsights: ProjectInsights;
  collaborators: User[];
  documents: Document[];
  clientId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  phases: ProjectPhase[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  dependencies: string[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: PhaseStatus;
  tasks: Task[];
  progress: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  estimatedHours: number;
  actualHours?: number;
  tags: string[];
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  allocation: number; // percentage
  cost: number;
  availability: ResourceAvailability[];
}

export interface ResourceAvailability {
  startDate: Date;
  endDate: Date;
  availableHours: number;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: number; // 0-1
  impact: number; // 0-1
  severity: RiskSeverity;
  mitigation: string;
  owner: string;
  status: RiskStatus;
  identifiedAt: Date;
  reviewDate: Date;
}

export interface ProjectInsights {
  healthScore: number; // 0-100
  riskLevel: RiskLevel;
  completionPrediction: Date;
  budgetVariance: number;
  scheduleVariance: number;
  recommendations: Recommendation[];
  trends: ProjectTrend[];
  lastUpdated: Date;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  actionRequired: boolean;
  estimatedImpact: string;
  createdAt: Date;
}

export interface ProjectTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
  significance: 'low' | 'medium' | 'high';
}

// Enums
export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ResourceType {
  HUMAN = 'human',
  EQUIPMENT = 'equipment',
  SOFTWARE = 'software',
  BUDGET = 'budget',
}

export enum RiskCategory {
  TECHNICAL = 'technical',
  SCHEDULE = 'schedule',
  BUDGET = 'budget',
  RESOURCE = 'resource',
  EXTERNAL = 'external',
  QUALITY = 'quality',
}

export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskStatus {
  IDENTIFIED = 'identified',
  ANALYZING = 'analyzing',
  MITIGATING = 'mitigating',
  MONITORING = 'monitoring',
  CLOSED = 'closed',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RecommendationType {
  SCHEDULE_OPTIMIZATION = 'schedule_optimization',
  RESOURCE_ALLOCATION = 'resource_allocation',
  RISK_MITIGATION = 'risk_mitigation',
  BUDGET_ADJUSTMENT = 'budget_adjustment',
  QUALITY_IMPROVEMENT = 'quality_improvement',
  PROCESS_OPTIMIZATION = 'process_optimization',
}

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Import User and Document types (will be defined in their respective files)
import type { User } from './auth';
import type { Document } from './document';