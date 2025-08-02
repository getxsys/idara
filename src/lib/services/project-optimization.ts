'use client';

import { Project, ProjectPhase, Resource, Risk, Recommendation, RecommendationType, RecommendationPriority } from '@/types/project';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  phases: Omit<ProjectPhase, 'id' | 'tasks'>[];
  estimatedDuration: number; // in days
  recommendedResources: Omit<Resource, 'id'>[];
  commonRisks: Omit<Risk, 'id' | 'identifiedAt' | 'reviewDate'>[];
  successRate: number; // 0-1
  averageBudget: number;
  tags: string[];
}

export interface OptimizationSuggestion {
  type: 'resource' | 'timeline' | 'risk' | 'budget';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  estimatedSavings?: {
    time?: number; // days
    cost?: number; // dollars
    risk?: number; // 0-1 reduction
  };
  implementation: string[];
}

export interface RiskPrediction {
  riskId: string;
  title: string;
  description: string;
  category: string;
  predictedProbability: number;
  predictedImpact: number;
  confidence: number; // 0-1
  mitigationStrategies: string[];
  earlyWarningSignals: string[];
}

export interface ResourceOptimization {
  resourceId: string;
  currentAllocation: number;
  recommendedAllocation: number;
  reasoning: string;
  impact: string;
  alternatives?: {
    name: string;
    cost: number;
    availability: string;
  }[];
}

// Mock project templates based on historical data
const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'ecommerce-redesign',
    name: 'E-commerce Platform Redesign',
    description: 'Complete overhaul of e-commerce platform with modern UI/UX',
    category: 'Web Development',
    phases: [
      {
        name: 'Discovery & Research',
        description: 'User research, competitor analysis, and requirements gathering',
        startDate: new Date(),
        endDate: new Date(),
        status: 'not_started' as const,
        progress: 0,
      },
      {
        name: 'Design & Prototyping',
        description: 'UI/UX design, wireframes, and interactive prototypes',
        startDate: new Date(),
        endDate: new Date(),
        status: 'not_started' as const,
        progress: 0,
      },
      {
        name: 'Development',
        description: 'Frontend and backend development',
        startDate: new Date(),
        endDate: new Date(),
        status: 'not_started' as const,
        progress: 0,
      },
      {
        name: 'Testing & Launch',
        description: 'QA testing, performance optimization, and deployment',
        startDate: new Date(),
        endDate: new Date(),
        status: 'not_started' as const,
        progress: 0,
      },
    ],
    estimatedDuration: 120,
    recommendedResources: [
      {
        type: 'human' as const,
        name: 'UX Designer',
        allocation: 75,
        cost: 6000,
        availability: [],
      },
      {
        type: 'human' as const,
        name: 'Frontend Developer',
        allocation: 100,
        cost: 8000,
        availability: [],
      },
      {
        type: 'human' as const,
        name: 'Backend Developer',
        allocation: 100,
        cost: 8500,
        availability: [],
      },
    ],
    commonRisks: [
      {
        title: 'Third-party Integration Issues',
        description: 'Payment gateway or shipping API integration challenges',
        category: 'technical' as const,
        probability: 0.4,
        impact: 0.6,
        severity: 'medium' as const,
        mitigation: 'Early integration testing and fallback options',
        owner: 'Tech Lead',
        status: 'identified' as const,
      },
    ],
    successRate: 0.85,
    averageBudget: 45000,
    tags: ['web', 'ecommerce', 'redesign', 'ui/ux'],
  },
  {
    id: 'mobile-app-development',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android',
    category: 'Mobile Development',
    phases: [
      {
        name: 'Planning & Architecture',
        description: 'Technical architecture and project planning',
        startDate: new Date(),
        endDate: new Date(),
        status: 'not_started' as const,
        progress: 0,
      },
      {
        name: 'UI/UX Design',
        description: 'Mobile-first design and user experience',
        startDate: new Date(),
        endDate: new Date(),
        status: 'not_started' as const,
        progress: 0,
      },
      {
        name: 'Development',
        description: 'Native app development for both platforms',
        startDate: new Date(),
        endDate: new Date(),
        status: 'not_started' as const,
        progress: 0,
      },
      {
        name: 'Testing & Deployment',
        description: 'Testing, app store submission, and launch',
        startDate: new Date(),
        endDate: new Date(),
        status: 'not_started' as const,
        progress: 0,
      },
    ],
    estimatedDuration: 180,
    recommendedResources: [
      {
        type: 'human' as const,
        name: 'Mobile Designer',
        allocation: 60,
        cost: 5500,
        availability: [],
      },
      {
        type: 'human' as const,
        name: 'iOS Developer',
        allocation: 100,
        cost: 9000,
        availability: [],
      },
      {
        type: 'human' as const,
        name: 'Android Developer',
        allocation: 100,
        cost: 8500,
        availability: [],
      },
    ],
    commonRisks: [
      {
        title: 'App Store Approval Delays',
        description: 'Potential delays in app store review process',
        category: 'external' as const,
        probability: 0.3,
        impact: 0.4,
        severity: 'medium' as const,
        mitigation: 'Submit early beta versions and follow guidelines strictly',
        owner: 'Project Manager',
        status: 'identified' as const,
      },
    ],
    successRate: 0.78,
    averageBudget: 65000,
    tags: ['mobile', 'ios', 'android', 'native'],
  },
];

export class ProjectOptimizationService {
  /**
   * Suggest project templates based on project description and requirements
   */
  static async suggestTemplates(
    projectDescription: string,
    requirements: string[],
    budget?: number,
    timeline?: number
  ): Promise<ProjectTemplate[]> {
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple keyword matching for demo - in real implementation, this would use NLP
    const keywords = projectDescription.toLowerCase().split(' ');
    
    let scoredTemplates = PROJECT_TEMPLATES.map(template => {
      let score = 0;
      
      // Match keywords with template tags and description
      keywords.forEach(keyword => {
        if (template.tags.some(tag => tag.includes(keyword))) {
          score += 2;
        }
        if (template.description.toLowerCase().includes(keyword)) {
          score += 1;
        }
      });
      
      // Budget matching
      if (budget && template.averageBudget) {
        const budgetDiff = Math.abs(budget - template.averageBudget) / template.averageBudget;
        if (budgetDiff < 0.2) score += 3;
        else if (budgetDiff < 0.5) score += 1;
      }
      
      // Timeline matching
      if (timeline && template.estimatedDuration) {
        const timelineDiff = Math.abs(timeline - template.estimatedDuration) / template.estimatedDuration;
        if (timelineDiff < 0.2) score += 3;
        else if (timelineDiff < 0.5) score += 1;
      }
      
      // Success rate bonus
      score += template.successRate * 2;
      
      return { ...template, score };
    });
    
    // Sort by score and return top matches
    return scoredTemplates
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score, ...template }) => template);
  }

  /**
   * Detect potential risks based on project data and historical patterns
   */
  static async detectRisks(project: Project): Promise<RiskPrediction[]> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const predictions: RiskPrediction[] = [];
    
    // Analyze timeline risks
    const projectDuration = (project.timeline.endDate.getTime() - project.timeline.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (projectDuration > 180) {
      predictions.push({
        riskId: 'long-duration-risk',
        title: 'Extended Timeline Risk',
        description: 'Projects longer than 6 months have higher risk of scope creep and team turnover',
        category: 'schedule',
        predictedProbability: 0.6,
        predictedImpact: 0.7,
        confidence: 0.8,
        mitigationStrategies: [
          'Break project into smaller phases with clear deliverables',
          'Implement regular milestone reviews',
          'Consider parallel development streams',
        ],
        earlyWarningSignals: [
          'Milestone delays exceeding 10%',
          'Increasing scope change requests',
          'Team member availability conflicts',
        ],
      });
    }
    
    // Analyze resource risks
    const humanResources = project.resources.filter(r => r.type === 'human');
    const overAllocatedResources = humanResources.filter(r => r.allocation > 90);
    if (overAllocatedResources.length > 0) {
      predictions.push({
        riskId: 'resource-overallocation',
        title: 'Resource Over-allocation Risk',
        description: 'Team members allocated at >90% capacity are at risk of burnout and quality issues',
        category: 'resource',
        predictedProbability: 0.7,
        predictedImpact: 0.6,
        confidence: 0.9,
        mitigationStrategies: [
          'Reduce allocation to 80% maximum',
          'Add buffer resources for critical roles',
          'Implement workload monitoring',
        ],
        earlyWarningSignals: [
          'Decreased code quality metrics',
          'Increased sick days or time off requests',
          'Missed deadlines or deliverables',
        ],
      });
    }
    
    // Analyze budget risks
    const totalCost = project.resources.reduce((sum, r) => sum + r.cost, 0);
    if (project.aiInsights.budgetVariance > 10) {
      predictions.push({
        riskId: 'budget-overrun',
        title: 'Budget Overrun Risk',
        description: 'Current budget variance indicates potential for significant cost overruns',
        category: 'budget',
        predictedProbability: 0.8,
        predictedImpact: 0.8,
        confidence: 0.85,
        mitigationStrategies: [
          'Implement stricter budget controls',
          'Review and optimize resource allocation',
          'Consider scope reduction for non-critical features',
        ],
        earlyWarningSignals: [
          'Monthly budget variance >5%',
          'Unplanned resource additions',
          'Scope creep without budget adjustments',
        ],
      });
    }
    
    return predictions;
  }

  /**
   * Generate optimization suggestions for the project
   */
  static async generateOptimizations(project: Project): Promise<OptimizationSuggestion[]> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const suggestions: OptimizationSuggestion[] = [];
    
    // Timeline optimization
    const phases = project.timeline.phases;
    const sequentialPhases = phases.filter((phase, index) => {
      if (index === 0) return false;
      const prevPhase = phases[index - 1];
      return phase.startDate.getTime() >= prevPhase.endDate.getTime();
    });
    
    if (sequentialPhases.length > 1) {
      suggestions.push({
        type: 'timeline',
        title: 'Parallel Phase Execution',
        description: 'Some project phases can be executed in parallel to reduce overall timeline',
        impact: 'high',
        effort: 'medium',
        estimatedSavings: {
          time: Math.floor(sequentialPhases.length * 15), // 15 days per parallelizable phase
        },
        implementation: [
          'Identify dependencies between phases',
          'Create parallel work streams for independent tasks',
          'Adjust resource allocation to support parallel execution',
          'Update project timeline and milestones',
        ],
      });
    }
    
    // Resource optimization
    const underUtilizedResources = project.resources.filter(r => 
      r.type === 'human' && r.allocation < 60
    );
    
    if (underUtilizedResources.length > 0) {
      suggestions.push({
        type: 'resource',
        title: 'Resource Utilization Optimization',
        description: 'Some team members are under-utilized and could take on additional responsibilities',
        impact: 'medium',
        effort: 'low',
        estimatedSavings: {
          cost: underUtilizedResources.reduce((sum, r) => sum + (r.cost * 0.2), 0),
        },
        implementation: [
          'Review current task assignments',
          'Redistribute work to balance team utilization',
          'Consider cross-training for skill development',
          'Adjust resource allocation percentages',
        ],
      });
    }
    
    // Risk mitigation
    const highRisks = project.risks.filter(r => 
      r.severity === 'high' || r.severity === 'critical'
    );
    
    if (highRisks.length > 0) {
      suggestions.push({
        type: 'risk',
        title: 'Proactive Risk Mitigation',
        description: 'Implement early mitigation strategies for high-impact risks',
        impact: 'high',
        effort: 'medium',
        estimatedSavings: {
          risk: 0.4, // 40% risk reduction
          cost: highRisks.length * 5000, // Estimated cost savings per risk
        },
        implementation: [
          'Develop detailed mitigation plans for each high-risk item',
          'Allocate contingency resources',
          'Implement early warning systems',
          'Schedule regular risk review meetings',
        ],
      });
    }
    
    // Budget optimization
    const expensiveResources = project.resources
      .filter(r => r.cost > 8000)
      .sort((a, b) => b.cost - a.cost);
    
    if (expensiveResources.length > 0) {
      suggestions.push({
        type: 'budget',
        title: 'Cost-Effective Resource Alternatives',
        description: 'Consider alternative resources or approaches to reduce project costs',
        impact: 'medium',
        effort: 'medium',
        estimatedSavings: {
          cost: expensiveResources.reduce((sum, r) => sum + (r.cost * 0.15), 0),
        },
        implementation: [
          'Evaluate junior-senior resource mix',
          'Consider offshore or remote team members',
          'Explore automation opportunities',
          'Negotiate better rates with existing resources',
        ],
      });
    }
    
    return suggestions;
  }

  /**
   * Optimize resource allocation based on project requirements and constraints
   */
  static async optimizeResources(project: Project): Promise<ResourceOptimization[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const optimizations: ResourceOptimization[] = [];
    
    project.resources.forEach(resource => {
      let recommendedAllocation = resource.allocation;
      let reasoning = '';
      let impact = '';
      
      // Over-allocation optimization
      if (resource.allocation > 90) {
        recommendedAllocation = 80;
        reasoning = 'Reducing allocation to prevent burnout and maintain quality';
        impact = 'Improved work quality and team sustainability';
      }
      
      // Under-utilization optimization
      else if (resource.allocation < 50 && resource.type === 'human') {
        recommendedAllocation = 70;
        reasoning = 'Increasing utilization to maximize resource efficiency';
        impact = 'Better cost efficiency and faster project delivery';
      }
      
      // Skill-based optimization
      else if (resource.name.toLowerCase().includes('senior') && resource.allocation < 70) {
        recommendedAllocation = Math.min(85, resource.allocation + 20);
        reasoning = 'Senior resources should be utilized more effectively for complex tasks';
        impact = 'Improved technical quality and mentorship for junior team members';
      }
      
      if (recommendedAllocation !== resource.allocation) {
        optimizations.push({
          resourceId: resource.id,
          currentAllocation: resource.allocation,
          recommendedAllocation,
          reasoning,
          impact,
          alternatives: resource.type === 'human' ? [
            {
              name: `Junior ${resource.name}`,
              cost: resource.cost * 0.7,
              availability: 'Available in 2 weeks',
            },
            {
              name: `Freelance ${resource.name}`,
              cost: resource.cost * 1.2,
              availability: 'Available immediately',
            },
          ] : undefined,
        });
      }
    });
    
    return optimizations;
  }

  /**
   * Generate AI-powered recommendations for project improvement
   */
  static async generateRecommendations(project: Project): Promise<Recommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const recommendations: Recommendation[] = [];
    
    // Analyze project health and generate recommendations
    const healthScore = project.aiInsights.healthScore;
    
    if (healthScore < 70) {
      recommendations.push({
        id: `rec-health-${Date.now()}`,
        type: RecommendationType.PROCESS_OPTIMIZATION,
        title: 'Improve Project Health Score',
        description: 'Project health is below optimal. Consider reviewing team performance, timeline adherence, and risk management.',
        priority: RecommendationPriority.HIGH,
        actionRequired: true,
        estimatedImpact: 'Could improve health score by 15-20 points',
        createdAt: new Date(),
      });
    }
    
    // Schedule optimization
    if (project.aiInsights.scheduleVariance > 10) {
      recommendations.push({
        id: `rec-schedule-${Date.now()}`,
        type: RecommendationType.SCHEDULE_OPTIMIZATION,
        title: 'Address Schedule Delays',
        description: 'Project is significantly behind schedule. Consider resource reallocation or scope adjustment.',
        priority: RecommendationPriority.URGENT,
        actionRequired: true,
        estimatedImpact: 'Could reduce schedule variance by 50%',
        createdAt: new Date(),
      });
    }
    
    // Resource optimization
    const totalAllocation = project.resources
      .filter(r => r.type === 'human')
      .reduce((sum, r) => sum + r.allocation, 0);
    
    if (totalAllocation > project.collaborators.length * 80) {
      recommendations.push({
        id: `rec-resource-${Date.now()}`,
        type: RecommendationType.RESOURCE_ALLOCATION,
        title: 'Optimize Team Allocation',
        description: 'Team appears over-allocated. Consider adding resources or adjusting workload distribution.',
        priority: RecommendationPriority.MEDIUM,
        actionRequired: false,
        estimatedImpact: 'Improved team productivity and reduced burnout risk',
        createdAt: new Date(),
      });
    }
    
    // Quality improvement
    const completedPhases = project.timeline.phases.filter(p => p.status === 'completed');
    const avgPhaseProgress = completedPhases.length > 0 
      ? completedPhases.reduce((sum, p) => sum + p.progress, 0) / completedPhases.length 
      : 0;
    
    if (avgPhaseProgress < 95 && completedPhases.length > 0) {
      recommendations.push({
        id: `rec-quality-${Date.now()}`,
        type: RecommendationType.QUALITY_IMPROVEMENT,
        title: 'Enhance Quality Assurance',
        description: 'Completed phases show room for improvement. Consider implementing stricter QA processes.',
        priority: RecommendationPriority.MEDIUM,
        actionRequired: false,
        estimatedImpact: 'Higher quality deliverables and reduced rework',
        createdAt: new Date(),
      });
    }
    
    return recommendations;
  }

  /**
   * Automated progress tracking with milestone alerts
   */
  static async trackProgress(project: Project): Promise<{
    alerts: Array<{
      type: 'milestone' | 'phase' | 'risk' | 'budget';
      severity: 'info' | 'warning' | 'critical';
      title: string;
      description: string;
      actionRequired: boolean;
    }>;
    insights: string[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const alerts = [];
    const insights = [];
    
    // Check milestone alerts
    const upcomingMilestones = project.timeline.milestones.filter(m => {
      const daysUntilDue = (m.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return !m.completed && daysUntilDue <= 7 && daysUntilDue > 0;
    });
    
    upcomingMilestones.forEach(milestone => {
      const daysUntilDue = Math.ceil((milestone.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        type: 'milestone',
        severity: daysUntilDue <= 3 ? 'critical' : 'warning',
        title: `Milestone Due Soon: ${milestone.name}`,
        description: `Milestone "${milestone.name}" is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
        actionRequired: daysUntilDue <= 3,
      });
    });
    
    // Check overdue milestones
    const overdueMilestones = project.timeline.milestones.filter(m => {
      return !m.completed && m.dueDate.getTime() < new Date().getTime();
    });
    
    overdueMilestones.forEach(milestone => {
      const daysOverdue = Math.ceil((new Date().getTime() - milestone.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        type: 'milestone',
        severity: 'critical',
        title: `Overdue Milestone: ${milestone.name}`,
        description: `Milestone "${milestone.name}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
        actionRequired: true,
      });
    });
    
    // Check phase progress
    const inProgressPhases = project.timeline.phases.filter(p => p.status === 'in_progress');
    inProgressPhases.forEach(phase => {
      const phaseProgress = phase.progress;
      const phaseDuration = (phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysElapsed = (new Date().getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24);
      const expectedProgress = Math.min(100, (daysElapsed / phaseDuration) * 100);
      
      if (phaseProgress < expectedProgress - 20) {
        alerts.push({
          type: 'phase',
          severity: 'warning',
          title: `Phase Behind Schedule: ${phase.name}`,
          description: `Phase "${phase.name}" is ${Math.round(expectedProgress - phaseProgress)}% behind expected progress`,
          actionRequired: true,
        });
      }
    });
    
    // Generate insights
    const completionRate = project.timeline.phases.filter(p => p.status === 'completed').length / project.timeline.phases.length;
    if (completionRate > 0.5) {
      insights.push('Project is past the halfway point with good momentum');
    }
    
    const activeRisks = project.risks.filter(r => r.status !== 'closed').length;
    if (activeRisks === 0) {
      insights.push('No active risks detected - project is on track');
    } else if (activeRisks > 3) {
      insights.push(`${activeRisks} active risks require attention`);
    } else if (activeRisks > 0) {
      insights.push(`${activeRisks} active risk${activeRisks > 1 ? 's' : ''} being monitored`);
    }
    
    if (project.aiInsights.healthScore > 80) {
      insights.push('Project health score is excellent');
    } else if (project.aiInsights.healthScore < 60) {
      insights.push('Project health score indicates need for intervention');
    } else {
      insights.push('Project health score is within acceptable range');
    }
    
    // Always provide at least one insight
    if (insights.length === 0) {
      insights.push('Project monitoring is active and tracking progress');
    }
    
    return { alerts, insights };
  }
}