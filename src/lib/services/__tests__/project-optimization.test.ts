import { ProjectOptimizationService } from '../project-optimization';
import { Project, ProjectStatus } from '@/types/project';

// Mock project data for testing
const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  description: 'A test project for optimization',
  status: ProjectStatus.ACTIVE,
  timeline: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'), // Long duration project
    milestones: [
      {
        id: 'm1',
        name: 'Test Milestone',
        description: 'A test milestone',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        completed: false,
        dependencies: [],
      },
    ],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1',
        description: 'First phase',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-01'),
        status: 'completed' as const,
        tasks: [],
        progress: 100,
      },
      {
        id: 'p2',
        name: 'Phase 2',
        description: 'Second phase',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-12-31'),
        status: 'in_progress' as const,
        tasks: [],
        progress: 30,
      },
    ],
  },
  resources: [
    {
      id: 'r1',
      type: 'human' as const,
      name: 'Senior Developer',
      allocation: 95, // Over-allocated
      cost: 9000,
      availability: [],
    },
    {
      id: 'r2',
      type: 'human' as const,
      name: 'Junior Developer',
      allocation: 40, // Under-utilized
      cost: 5000,
      availability: [],
    },
  ],
  risks: [
    {
      id: 'risk1',
      title: 'High Risk Item',
      description: 'A high-risk item',
      category: 'technical' as const,
      probability: 0.8,
      impact: 0.9,
      severity: 'high' as const,
      mitigation: 'Test mitigation',
      owner: 'Test Owner',
      status: 'identified' as const,
      identifiedAt: new Date(),
      reviewDate: new Date(),
    },
  ],
  aiInsights: {
    healthScore: 65, // Below optimal
    riskLevel: 'medium' as const,
    completionPrediction: new Date('2024-12-31'),
    budgetVariance: 15, // Over budget
    scheduleVariance: 12, // Behind schedule
    recommendations: [],
    trends: [],
    lastUpdated: new Date(),
  },
  collaborators: ['user1', 'user2'],
  documents: [],
  clientId: 'client1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

describe('ProjectOptimizationService', () => {
  describe('suggestTemplates', () => {
    it('should suggest relevant project templates', async () => {
      const templates = await ProjectOptimizationService.suggestTemplates(
        'e-commerce platform redesign',
        ['web', 'ui/ux'],
        50000,
        120
      );

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.length).toBeLessThanOrEqual(3);

      // Check that templates have required properties
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('phases');
        expect(template).toHaveProperty('estimatedDuration');
        expect(template).toHaveProperty('successRate');
      });
    });

    it('should return templates sorted by relevance', async () => {
      const templates = await ProjectOptimizationService.suggestTemplates(
        'mobile app development',
        ['mobile', 'ios', 'android']
      );

      expect(templates.length).toBeGreaterThan(0);
      // First template should be most relevant (mobile app template)
      expect(templates[0].name.toLowerCase()).toContain('mobile');
    });
  });

  describe('detectRisks', () => {
    it('should detect risks based on project data', async () => {
      const risks = await ProjectOptimizationService.detectRisks(mockProject);

      expect(risks).toBeDefined();
      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);

      // Should detect long duration risk
      const longDurationRisk = risks.find(r => r.riskId === 'long-duration-risk');
      expect(longDurationRisk).toBeDefined();
      expect(longDurationRisk?.predictedProbability).toBeGreaterThan(0);
      expect(longDurationRisk?.confidence).toBeGreaterThan(0);

      // Should detect resource over-allocation risk
      const overAllocationRisk = risks.find(r => r.riskId === 'resource-overallocation');
      expect(overAllocationRisk).toBeDefined();

      // Should detect budget overrun risk
      const budgetRisk = risks.find(r => r.riskId === 'budget-overrun');
      expect(budgetRisk).toBeDefined();
    });

    it('should provide mitigation strategies for detected risks', async () => {
      const risks = await ProjectOptimizationService.detectRisks(mockProject);

      risks.forEach(risk => {
        expect(risk.mitigationStrategies).toBeDefined();
        expect(Array.isArray(risk.mitigationStrategies)).toBe(true);
        expect(risk.mitigationStrategies.length).toBeGreaterThan(0);
        expect(risk.earlyWarningSignals).toBeDefined();
        expect(Array.isArray(risk.earlyWarningSignals)).toBe(true);
      });
    });
  });

  describe('generateOptimizations', () => {
    it('should generate optimization suggestions', async () => {
      const optimizations = await ProjectOptimizationService.generateOptimizations(mockProject);

      expect(optimizations).toBeDefined();
      expect(Array.isArray(optimizations)).toBe(true);
      expect(optimizations.length).toBeGreaterThan(0);

      optimizations.forEach(optimization => {
        expect(optimization).toHaveProperty('type');
        expect(optimization).toHaveProperty('title');
        expect(optimization).toHaveProperty('description');
        expect(optimization).toHaveProperty('impact');
        expect(optimization).toHaveProperty('effort');
        expect(optimization).toHaveProperty('implementation');
        expect(Array.isArray(optimization.implementation)).toBe(true);
      });
    });

    it('should suggest resource utilization optimization for under-utilized resources', async () => {
      const optimizations = await ProjectOptimizationService.generateOptimizations(mockProject);

      const resourceOptimization = optimizations.find(o => o.type === 'resource');
      expect(resourceOptimization).toBeDefined();
      expect(resourceOptimization?.title).toContain('Resource Utilization');
    });

    it('should suggest risk mitigation for high-risk projects', async () => {
      const optimizations = await ProjectOptimizationService.generateOptimizations(mockProject);

      const riskOptimization = optimizations.find(o => o.type === 'risk');
      expect(riskOptimization).toBeDefined();
      expect(riskOptimization?.title).toContain('Risk Mitigation');
    });

    it('should include estimated savings when available', async () => {
      const optimizations = await ProjectOptimizationService.generateOptimizations(mockProject);

      const optimizationsWithSavings = optimizations.filter(o => o.estimatedSavings);
      expect(optimizationsWithSavings.length).toBeGreaterThan(0);

      optimizationsWithSavings.forEach(optimization => {
        const savings = optimization.estimatedSavings!;
        if (savings.time) expect(savings.time).toBeGreaterThan(0);
        if (savings.cost) expect(savings.cost).toBeGreaterThan(0);
        if (savings.risk) expect(savings.risk).toBeGreaterThan(0);
      });
    });
  });

  describe('optimizeResources', () => {
    it('should optimize resource allocation', async () => {
      const optimizations = await ProjectOptimizationService.optimizeResources(mockProject);

      expect(optimizations).toBeDefined();
      expect(Array.isArray(optimizations)).toBe(true);
      expect(optimizations.length).toBeGreaterThan(0);

      optimizations.forEach(optimization => {
        expect(optimization).toHaveProperty('resourceId');
        expect(optimization).toHaveProperty('currentAllocation');
        expect(optimization).toHaveProperty('recommendedAllocation');
        expect(optimization).toHaveProperty('reasoning');
        expect(optimization).toHaveProperty('impact');
      });
    });

    it('should reduce over-allocation', async () => {
      const optimizations = await ProjectOptimizationService.optimizeResources(mockProject);

      const overAllocatedResource = optimizations.find(o => o.resourceId === 'r1');
      expect(overAllocatedResource).toBeDefined();
      expect(overAllocatedResource?.recommendedAllocation).toBeLessThan(overAllocatedResource?.currentAllocation);
      expect(overAllocatedResource?.recommendedAllocation).toBeLessThanOrEqual(80);
    });

    it('should increase under-utilization', async () => {
      const optimizations = await ProjectOptimizationService.optimizeResources(mockProject);

      const underUtilizedResource = optimizations.find(o => o.resourceId === 'r2');
      expect(underUtilizedResource).toBeDefined();
      expect(underUtilizedResource?.recommendedAllocation).toBeGreaterThan(underUtilizedResource?.currentAllocation);
    });

    it('should provide alternatives for human resources', async () => {
      const optimizations = await ProjectOptimizationService.optimizeResources(mockProject);

      const humanResourceOptimization = optimizations.find(o => {
        const resource = mockProject.resources.find(r => r.id === o.resourceId);
        return resource?.type === 'human';
      });

      expect(humanResourceOptimization?.alternatives).toBeDefined();
      expect(Array.isArray(humanResourceOptimization?.alternatives)).toBe(true);
      if (humanResourceOptimization?.alternatives) {
        expect(humanResourceOptimization.alternatives.length).toBeGreaterThan(0);
        humanResourceOptimization.alternatives.forEach(alt => {
          expect(alt).toHaveProperty('name');
          expect(alt).toHaveProperty('cost');
          expect(alt).toHaveProperty('availability');
        });
      }
    });
  });

  describe('generateRecommendations', () => {
    it('should generate AI-powered recommendations', async () => {
      const recommendations = await ProjectOptimizationService.generateRecommendations(mockProject);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('actionRequired');
        expect(rec).toHaveProperty('estimatedImpact');
        expect(rec).toHaveProperty('createdAt');
      });
    });

    it('should recommend health score improvement for low-health projects', async () => {
      const recommendations = await ProjectOptimizationService.generateRecommendations(mockProject);

      const healthRecommendation = recommendations.find(r => r.title.includes('Health Score'));
      expect(healthRecommendation).toBeDefined();
      expect(healthRecommendation?.actionRequired).toBe(true);
    });

    it('should recommend schedule optimization for delayed projects', async () => {
      const recommendations = await ProjectOptimizationService.generateRecommendations(mockProject);

      const scheduleRecommendation = recommendations.find(r => r.title.includes('Schedule'));
      expect(scheduleRecommendation).toBeDefined();
      expect(scheduleRecommendation?.priority).toBe('urgent');
    });
  });

  describe('trackProgress', () => {
    it('should track project progress and generate alerts', async () => {
      const tracking = await ProjectOptimizationService.trackProgress(mockProject);

      expect(tracking).toBeDefined();
      expect(tracking).toHaveProperty('alerts');
      expect(tracking).toHaveProperty('insights');
      expect(Array.isArray(tracking.alerts)).toBe(true);
      expect(Array.isArray(tracking.insights)).toBe(true);
    });

    it('should generate milestone alerts for upcoming milestones', async () => {
      const tracking = await ProjectOptimizationService.trackProgress(mockProject);

      const milestoneAlerts = tracking.alerts.filter(a => a.type === 'milestone');
      expect(milestoneAlerts.length).toBeGreaterThan(0);

      milestoneAlerts.forEach(alert => {
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('description');
        expect(alert).toHaveProperty('actionRequired');
        expect(['info', 'warning', 'critical']).toContain(alert.severity);
      });
    });

    it('should provide project insights', async () => {
      const tracking = await ProjectOptimizationService.trackProgress(mockProject);

      expect(tracking.insights.length).toBeGreaterThan(0);
      tracking.insights.forEach(insight => {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      });
    });

    it('should detect phase progress issues', async () => {
      // Create a project with a phase that's behind schedule
      const behindScheduleProject = {
        ...mockProject,
        timeline: {
          ...mockProject.timeline,
          phases: [
            {
              id: 'p1',
              name: 'Behind Schedule Phase',
              description: 'A phase that is behind schedule',
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Ends in 30 days
              status: 'in_progress' as const,
              tasks: [],
              progress: 20, // Only 20% complete after 30 days (should be ~50%)
            },
          ],
        },
      };

      const tracking = await ProjectOptimizationService.trackProgress(behindScheduleProject);
      const phaseAlerts = tracking.alerts.filter(a => a.type === 'phase');
      
      expect(phaseAlerts.length).toBeGreaterThan(0);
      expect(phaseAlerts[0].title).toContain('Behind Schedule');
    });
  });
});