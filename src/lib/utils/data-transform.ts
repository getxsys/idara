import { z } from 'zod';
import type {
  Project,
  Client,
  Document,
  User,
} from '@/types';
import {
  ProjectStatus,
  ClientStatus,
  DocumentType,
  AccessLevel,
} from '@/types';

// Generic transformation utilities
export class DataTransformer {
  /**
   * Safely parse and validate data using a Zod schema
   */
  static safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: string[];
  } {
    try {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Transform API response to include computed fields
   */
  static enrichProject(project: Project): Project & {
    computedFields: {
      completionPercentage: number;
      isOverdue: boolean;
      riskScore: number;
      daysRemaining: number;
    };
  } {
    const now = new Date();
    const endDate = new Date(project.timeline.endDate);
    const startDate = new Date(project.timeline.startDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate completion percentage based on phases
    const totalPhases = project.timeline.phases.length;
    const completedPhases = project.timeline.phases.filter(phase => phase.status === 'completed').length;
    const completionPercentage = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

    // Calculate risk score based on various factors
    const scheduleRisk = daysRemaining < 0 ? 1 : Math.max(0, 1 - (daysRemaining / totalDays));
    const budgetRisk = Math.abs(project.aiInsights.budgetVariance) / 100;
    const qualityRisk = project.risks.filter(risk => risk.severity === 'high' || risk.severity === 'critical').length / Math.max(1, project.risks.length);
    const riskScore = Math.min(1, (scheduleRisk + budgetRisk + qualityRisk) / 3);

    return {
      ...project,
      computedFields: {
        completionPercentage: Math.round(completionPercentage),
        isOverdue: daysRemaining < 0,
        riskScore: Math.round(riskScore * 100),
        daysRemaining,
      },
    };
  }

  /**
   * Transform client data to include computed metrics
   */
  static enrichClient(client: Client): Client & {
    computedFields: {
      totalInteractions: number;
      lastInteractionDays: number;
      averageResponseTime: number;
      engagementTrend: 'up' | 'down' | 'stable';
      revenueGrowth: number;
    };
  } {
    const now = new Date();
    const lastContact = new Date(client.relationship.lastContactDate);
    const lastInteractionDays = Math.ceil((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate average response time from interactions
    const responseInteractions = client.interactions.filter(i => i.duration && i.duration > 0);
    const averageResponseTime = responseInteractions.length > 0
      ? responseInteractions.reduce((sum, i) => sum + (i.duration || 0), 0) / responseInteractions.length
      : 0;

    // Calculate engagement trend (simplified)
    const recentInteractions = client.interactions
      .filter(i => new Date(i.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .length;
    const previousInteractions = client.interactions
      .filter(i => {
        const date = new Date(i.date);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        return date <= thirtyDaysAgo && date > sixtyDaysAgo;
      })
      .length;

    let engagementTrend: 'up' | 'down' | 'stable' = 'stable';
    if (recentInteractions > previousInteractions * 1.2) {
      engagementTrend = 'up';
    } else if (recentInteractions < previousInteractions * 0.8) {
      engagementTrend = 'down';
    }

    // Calculate revenue growth (simplified - would need historical data)
    const revenueGrowth = client.relationship.totalRevenue > 0 ? 15 : 0; // Placeholder

    return {
      ...client,
      computedFields: {
        totalInteractions: client.interactions.length,
        lastInteractionDays,
        averageResponseTime: Math.round(averageResponseTime),
        engagementTrend,
        revenueGrowth,
      },
    };
  }

  /**
   * Transform document data for search and display
   */
  static enrichDocument(document: Document): Document & {
    computedFields: {
      readingTime: number; // in minutes
      wordCount: number;
      isStale: boolean;
      relevanceScore: number;
      securityLevel: number;
    };
  } {
    const wordCount = document.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    const now = new Date();
    const lastUpdated = new Date(document.updatedAt);
    const daysSinceUpdate = Math.ceil((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    const isStale = daysSinceUpdate > 90; // Consider stale after 90 days

    // Calculate relevance score based on various factors
    const recentnessScore = Math.max(0, 1 - (daysSinceUpdate / 365));
    const qualityScore = document.aiAnalysis.qualityScore / 100;
    const relevanceScore = (recentnessScore + qualityScore) / 2;

    // Map access level to security level (0-5)
    const securityLevelMap: Record<AccessLevel, number> = {
      [AccessLevel.PUBLIC]: 0,
      [AccessLevel.INTERNAL]: 1,
      [AccessLevel.CONFIDENTIAL]: 3,
      [AccessLevel.RESTRICTED]: 4,
      [AccessLevel.TOP_SECRET]: 5,
    };

    return {
      ...document,
      computedFields: {
        readingTime,
        wordCount,
        isStale,
        relevanceScore: Math.round(relevanceScore * 100),
        securityLevel: securityLevelMap[document.accessLevel],
      },
    };
  }

  /**
   * Convert database timestamps to Date objects
   */
  static normalizeDates<T extends Record<string, any>>(
    data: T,
    dateFields: (keyof T)[]
  ): T {
    const normalized = { ...data };
    
    dateFields.forEach(field => {
      if (normalized[field] && typeof normalized[field] === 'string') {
        normalized[field] = new Date(normalized[field] as string) as T[keyof T];
      }
    });

    return normalized;
  }

  /**
   * Sanitize data for API responses (remove sensitive fields)
   */
  static sanitizeForAPI<T extends Record<string, unknown>>(
    data: T,
    sensitiveFields: (keyof T)[]
  ): Omit<T, keyof T> {
    const sanitized = { ...data };
    
    sensitiveFields.forEach(field => {
      delete sanitized[field];
    });

    return sanitized;
  }

  /**
   * Transform search results with highlighting
   */
  static highlightSearchResults(
    content: string,
    searchTerms: string[],
    maxLength: number = 200
  ): {
    snippet: string;
    highlights: Array<{ start: number; end: number; term: string }>;
  } {
    const highlights: Array<{ start: number; end: number; term: string }> = [];
    let snippet = content;

    // Find all matches
    searchTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          term: match[0],
        });
      }
    });

    // Sort highlights by position
    highlights.sort((a, b) => a.start - b.start);

    // Create snippet around first highlight
    if (highlights.length > 0) {
      const firstHighlight = highlights[0];
      const start = Math.max(0, firstHighlight.start - maxLength / 2);
      const end = Math.min(content.length, start + maxLength);
      snippet = content.substring(start, end);
      
      // Adjust highlight positions for snippet
      highlights.forEach(highlight => {
        highlight.start -= start;
        highlight.end -= start;
      });
    } else {
      // No highlights, just truncate
      snippet = content.substring(0, maxLength);
    }

    return { snippet, highlights };
  }

  /**
   * Aggregate data for dashboard metrics
   */
  static aggregateMetrics(data: {
    projects: Project[];
    clients: Client[];
    documents: Document[];
  }): {
    projectMetrics: {
      total: number;
      active: number;
      completed: number;
      overdue: number;
      averageHealth: number;
    };
    clientMetrics: {
      total: number;
      active: number;
      highValue: number;
      atRisk: number;
      averageSatisfaction: number;
    };
    documentMetrics: {
      total: number;
      indexed: number;
      stale: number;
      averageQuality: number;
    };
  } {
    const projectMetrics = {
      total: data.projects.length,
      active: data.projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
      completed: data.projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
      overdue: data.projects.filter(p => {
        const enriched = this.enrichProject(p);
        return enriched.computedFields.isOverdue;
      }).length,
      averageHealth: data.projects.length > 0
        ? Math.round(data.projects.reduce((sum, p) => sum + p.aiInsights.healthScore, 0) / data.projects.length)
        : 0,
    };

    const clientMetrics = {
      total: data.clients.length,
      active: data.clients.filter(c => c.relationship.status === ClientStatus.ACTIVE).length,
      highValue: data.clients.filter(c => c.relationship.totalRevenue > 100000).length,
      atRisk: data.clients.filter(c => c.aiProfile.churnRisk > 0.7).length,
      averageSatisfaction: data.clients.length > 0
        ? Math.round(data.clients.reduce((sum, c) => sum + c.relationship.satisfactionScore, 0) / data.clients.length)
        : 0,
    };

    const documentMetrics = {
      total: data.documents.length,
      indexed: data.documents.filter(d => d.lastIndexed).length,
      stale: data.documents.filter(d => {
        const enriched = this.enrichDocument(d);
        return enriched.computedFields.isStale;
      }).length,
      averageQuality: data.documents.length > 0
        ? Math.round(data.documents.reduce((sum, d) => sum + d.aiAnalysis.qualityScore, 0) / data.documents.length)
        : 0,
    };

    return { projectMetrics, clientMetrics, documentMetrics };
  }
}

// Export utility functions
export const {
  safeValidate,
  enrichProject,
  enrichClient,
  enrichDocument,
  normalizeDates,
  sanitizeForAPI,
  highlightSearchResults,
  aggregateMetrics,
} = DataTransformer;