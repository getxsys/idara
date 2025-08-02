import { Client, ClientAIProfile, ClientStatus, EngagementLevel, InteractionType, InteractionOutcome, ActionPriority, InsightType, NextBestAction, ClientInsight } from '../../types/client';

export interface ClientHealthScore {
  overall: number; // 0-100
  factors: {
    engagement: number;
    financial: number;
    communication: number;
    satisfaction: number;
    loyalty: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export interface ChurnPrediction {
  riskScore: number; // 0-1 (0 = low risk, 1 = high risk)
  confidence: number; // 0-1
  riskFactors: ChurnRiskFactor[];
  retentionStrategies: RetentionStrategy[];
  timeToChurn?: number; // days
  lastUpdated: Date;
}

export interface ChurnRiskFactor {
  factor: string;
  impact: number; // 0-1
  description: string;
}

export interface RetentionStrategy {
  strategy: string;
  description: string;
  priority: ActionPriority;
  estimatedEffectiveness: number; // 0-1
  estimatedCost: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface LeadScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  conversionProbability: number; // 0-1
  factors: LeadScoringFactor[];
  priority: ActionPriority;
  lastUpdated: Date;
}

export interface LeadScoringFactor {
  factor: string;
  weight: number; // 0-1
  score: number; // 0-100
  description: string;
}

export interface CommunicationSuggestion {
  type: 'email' | 'call' | 'meeting' | 'proposal' | 'follow_up';
  subject: string;
  content: string;
  timing: Date;
  priority: ActionPriority;
  expectedOutcome: string;
  personalizationFactors: string[];
}

export interface ClientAnalytics {
  healthScore: ClientHealthScore;
  churnPrediction: ChurnPrediction;
  leadScore?: LeadScore; // Only for prospects
  communicationSuggestions: CommunicationSuggestion[];
  insights: ClientInsight[];
  nextBestActions: NextBestAction[];
}

export class ClientAnalyticsService {
  /**
   * Calculate comprehensive client health score
   */
  calculateHealthScore(client: Client): ClientHealthScore {
    const engagementScore = this.calculateEngagementScore(client);
    const financialScore = this.calculateFinancialScore(client);
    const communicationScore = this.calculateCommunicationScore(client);
    const satisfactionScore = client.relationship.satisfactionScore * 10; // Convert 0-10 to 0-100
    const loyaltyScore = client.relationship.loyaltyScore;

    const factors = {
      engagement: engagementScore,
      financial: financialScore,
      communication: communicationScore,
      satisfaction: satisfactionScore,
      loyalty: loyaltyScore,
    };

    // Weighted average of all factors
    const overall = Math.round(
      engagementScore * 0.25 +
      financialScore * 0.25 +
      communicationScore * 0.2 +
      satisfactionScore * 0.15 +
      loyaltyScore * 0.15
    );

    const trend = this.calculateHealthTrend(client);

    return {
      overall,
      factors,
      trend,
      lastUpdated: new Date(),
    };
  }

  /**
   * Predict client churn risk and suggest retention strategies
   */
  predictChurnRisk(client: Client): ChurnPrediction {
    const riskFactors = this.identifyChurnRiskFactors(client);
    const riskScore = this.calculateChurnRiskScore(riskFactors);
    const confidence = this.calculatePredictionConfidence(client);
    const retentionStrategies = this.generateRetentionStrategies(client, riskFactors);
    const timeToChurn = this.estimateTimeToChurn(client, riskScore);

    return {
      riskScore,
      confidence,
      riskFactors,
      retentionStrategies,
      timeToChurn,
      lastUpdated: new Date(),
    };
  }

  /**
   * Score leads for prioritization
   */
  scoreLeads(client: Client): LeadScore | null {
    // Only score prospects
    if (client.relationship.status !== ClientStatus.PROSPECT) {
      return null;
    }

    const factors = this.calculateLeadScoringFactors(client);
    const score = this.calculateLeadScore(factors);
    const grade = this.assignLeadGrade(score);
    const conversionProbability = this.calculateConversionProbability(client, factors);
    const priority = this.assignLeadPriority(score, conversionProbability);

    return {
      score,
      grade,
      conversionProbability,
      factors,
      priority,
      lastUpdated: new Date(),
    };
  }

  /**
   * Generate personalized communication suggestions
   */
  generateCommunicationSuggestions(client: Client): CommunicationSuggestion[] {
    const suggestions: CommunicationSuggestion[] = [];
    const lastInteraction = this.getLastInteraction(client);
    const daysSinceLastContact = this.getDaysSinceLastContact(client);
    const clientPreferences = client.aiProfile.preferences;

    // Follow-up suggestions based on last interaction
    if (lastInteraction && this.needsFollowUp(lastInteraction)) {
      suggestions.push(this.generateFollowUpSuggestion(client, lastInteraction));
    }

    // Regular check-in suggestions
    if (daysSinceLastContact > this.getOptimalContactFrequency(clientPreferences)) {
      suggestions.push(this.generateCheckInSuggestion(client));
    }

    // Opportunity-based suggestions
    const opportunities = this.identifyOpportunities(client);
    opportunities.forEach(opportunity => {
      suggestions.push(this.generateOpportunitySuggestion(client, opportunity));
    });

    // Relationship building suggestions
    if (client.relationship.satisfactionScore < 8) {
      suggestions.push(this.generateRelationshipBuildingSuggestion(client));
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate comprehensive client analytics
   */
  generateClientAnalytics(client: Client): ClientAnalytics {
    const healthScore = this.calculateHealthScore(client);
    const churnPrediction = this.predictChurnRisk(client);
    const leadScore = this.scoreLeads(client);
    const communicationSuggestions = this.generateCommunicationSuggestions(client);
    const insights = this.generateInsights(client, healthScore, churnPrediction);
    const nextBestActions = this.generateNextBestActions(client, healthScore, churnPrediction, communicationSuggestions);

    return {
      healthScore,
      churnPrediction,
      leadScore,
      communicationSuggestions,
      insights,
      nextBestActions,
    };
  }

  // Private helper methods

  private calculateEngagementScore(client: Client): number {
    const recentInteractions = this.getRecentInteractions(client, 30); // Last 30 days
    const interactionFrequency = recentInteractions.length;
    const positiveInteractions = recentInteractions.filter(i => 
      i.outcome === InteractionOutcome.POSITIVE || 
      i.outcome === InteractionOutcome.DEAL_CLOSED
    ).length;

    const frequencyScore = Math.min(interactionFrequency * 10, 50); // Max 50 points
    const qualityScore = recentInteractions.length > 0 ? 
      (positiveInteractions / recentInteractions.length) * 50 : 0; // Max 50 points

    return Math.round(frequencyScore + qualityScore);
  }

  private calculateFinancialScore(client: Client): number {
    const totalRevenue = client.relationship.totalRevenue;
    const averageProjectValue = client.relationship.averageProjectValue;
    const paymentHistory = client.relationship.paymentTerms.paymentHistory;

    // Revenue score (0-40 points)
    const revenueScore = Math.min(totalRevenue / 10000 * 40, 40);

    // Project value score (0-30 points)
    const projectValueScore = Math.min(averageProjectValue / 5000 * 30, 30);

    // Payment reliability score (0-30 points)
    const onTimePayments = paymentHistory.filter(p => 
      p.status === 'paid' && (!p.daysOverdue || p.daysOverdue <= 0)
    ).length;
    const paymentReliabilityScore = paymentHistory.length > 0 ? 
      (onTimePayments / paymentHistory.length) * 30 : 30;

    return Math.round(revenueScore + projectValueScore + paymentReliabilityScore);
  }

  private calculateCommunicationScore(client: Client): number {
    const recentInteractions = this.getRecentInteractions(client, 60); // Last 60 days
    const responseTime = this.calculateAverageResponseTime(client);
    const communicationQuality = this.assessCommunicationQuality(recentInteractions);

    // Response time score (0-50 points)
    const responseTimeScore = responseTime <= 24 ? 50 : Math.max(50 - (responseTime - 24) * 2, 0);

    // Communication quality score (0-50 points)
    const qualityScore = communicationQuality * 50;

    return Math.round(responseTimeScore + qualityScore);
  }

  private calculateHealthTrend(client: Client): 'improving' | 'stable' | 'declining' {
    const recentInteractions = this.getRecentInteractions(client, 30);
    const olderInteractions = this.getInteractionsBetween(client, 60, 30);

    if (recentInteractions.length === 0 && olderInteractions.length === 0) {
      return 'stable';
    }

    const recentPositiveRatio = recentInteractions.length > 0 ? 
      recentInteractions.filter(i => i.sentiment.overall > 0).length / recentInteractions.length : 0;
    const olderPositiveRatio = olderInteractions.length > 0 ? 
      olderInteractions.filter(i => i.sentiment.overall > 0).length / olderInteractions.length : 0;

    if (recentPositiveRatio > olderPositiveRatio + 0.1) return 'improving';
    if (recentPositiveRatio < olderPositiveRatio - 0.1) return 'declining';
    return 'stable';
  }

  private identifyChurnRiskFactors(client: Client): ChurnRiskFactor[] {
    const factors: ChurnRiskFactor[] = [];

    // Low engagement
    const daysSinceLastContact = this.getDaysSinceLastContact(client);
    if (daysSinceLastContact > 30) {
      factors.push({
        factor: 'Low Engagement',
        impact: Math.min(daysSinceLastContact / 90, 1),
        description: `No contact for ${daysSinceLastContact} days`,
      });
    }

    // Declining satisfaction
    if (client.relationship.satisfactionScore < 6) {
      factors.push({
        factor: 'Low Satisfaction',
        impact: (10 - client.relationship.satisfactionScore) / 10,
        description: `Satisfaction score: ${client.relationship.satisfactionScore}/10`,
      });
    }

    // Payment issues
    const overduePayments = client.relationship.paymentTerms.paymentHistory.filter(p => 
      p.status === 'overdue' || (p.daysOverdue && p.daysOverdue > 0)
    );
    if (overduePayments.length > 0) {
      factors.push({
        factor: 'Payment Issues',
        impact: Math.min(overduePayments.length / 5, 1),
        description: `${overduePayments.length} overdue payments`,
      });
    }

    // Negative interactions
    const recentNegativeInteractions = this.getRecentInteractions(client, 30)
      .filter(i => i.outcome === InteractionOutcome.NEGATIVE);
    if (recentNegativeInteractions.length > 0) {
      factors.push({
        factor: 'Negative Interactions',
        impact: Math.min(recentNegativeInteractions.length / 3, 1),
        description: `${recentNegativeInteractions.length} negative interactions in last 30 days`,
      });
    }

    return factors;
  }

  private calculateChurnRiskScore(riskFactors: ChurnRiskFactor[]): number {
    if (riskFactors.length === 0) return 0;

    const totalImpact = riskFactors.reduce((sum, factor) => sum + factor.impact, 0);
    return Math.min(totalImpact / riskFactors.length, 1);
  }

  private calculatePredictionConfidence(client: Client): number {
    const interactionCount = client.interactions.length;
    const dataAge = this.getDaysSinceLastContact(client);

    // More interactions and recent data = higher confidence
    const interactionConfidence = Math.min(interactionCount / 20, 1);
    const recencyConfidence = Math.max(1 - (dataAge / 90), 0.1);

    return Math.round((interactionConfidence * 0.6 + recencyConfidence * 0.4) * 100) / 100;
  }

  private generateRetentionStrategies(client: Client, riskFactors: ChurnRiskFactor[]): RetentionStrategy[] {
    const strategies: RetentionStrategy[] = [];

    riskFactors.forEach(factor => {
      switch (factor.factor) {
        case 'Low Engagement':
          strategies.push({
            strategy: 'Proactive Outreach',
            description: 'Schedule regular check-ins and provide value-added content',
            priority: ActionPriority.HIGH,
            estimatedEffectiveness: 0.7,
            estimatedCost: 'low',
            timeline: '1-2 weeks',
          });
          break;
        case 'Low Satisfaction':
          strategies.push({
            strategy: 'Satisfaction Recovery',
            description: 'Conduct satisfaction survey and address specific concerns',
            priority: ActionPriority.URGENT,
            estimatedEffectiveness: 0.8,
            estimatedCost: 'medium',
            timeline: 'Immediate',
          });
          break;
        case 'Payment Issues':
          strategies.push({
            strategy: 'Payment Plan',
            description: 'Offer flexible payment terms or payment plan',
            priority: ActionPriority.HIGH,
            estimatedEffectiveness: 0.6,
            estimatedCost: 'low',
            timeline: '1 week',
          });
          break;
        case 'Negative Interactions':
          strategies.push({
            strategy: 'Relationship Repair',
            description: 'Executive-level meeting to address concerns and rebuild trust',
            priority: ActionPriority.URGENT,
            estimatedEffectiveness: 0.75,
            estimatedCost: 'high',
            timeline: 'Immediate',
          });
          break;
      }
    });

    return strategies;
  }

  private estimateTimeToChurn(client: Client, riskScore: number): number | undefined {
    if (riskScore < 0.3) return undefined; // Low risk, no estimated churn time

    // High risk clients might churn in 30-90 days
    // Medium risk clients might churn in 90-180 days
    const baseTime = riskScore > 0.7 ? 60 : 135; // days
    const variability = Math.random() * 30 - 15; // ±15 days

    return Math.round(baseTime + variability);
  }

  private calculateLeadScoringFactors(client: Client): LeadScoringFactor[] {
    const factors: LeadScoringFactor[] = [];

    // Company size factor
    const companySizeScore = this.getCompanySizeScore(client.contact.company.size);
    factors.push({
      factor: 'Company Size',
      weight: 0.25,
      score: companySizeScore,
      description: `${client.contact.company.size} company`,
    });

    // Industry factor
    const industryScore = this.getIndustryScore(client.contact.company.industry);
    factors.push({
      factor: 'Industry',
      weight: 0.2,
      score: industryScore,
      description: `${client.contact.company.industry} industry`,
    });

    // Engagement factor
    const engagementScore = this.calculateEngagementScore(client);
    factors.push({
      factor: 'Engagement Level',
      weight: 0.3,
      score: engagementScore,
      description: 'Based on interaction frequency and quality',
    });

    // Budget indicator
    const budgetScore = this.estimateBudgetScore(client);
    factors.push({
      factor: 'Budget Indicator',
      weight: 0.25,
      score: budgetScore,
      description: 'Estimated budget capacity',
    });

    return factors;
  }

  private calculateLeadScore(factors: LeadScoringFactor[]): number {
    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );
    return Math.round(weightedScore);
  }

  private assignLeadGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private calculateConversionProbability(client: Client, factors: LeadScoringFactor[]): number {
    const score = this.calculateLeadScore(factors);
    const engagementLevel = client.aiProfile.engagementLevel;
    
    let baseProbability = score / 100;
    
    // Adjust based on engagement level
    switch (engagementLevel) {
      case EngagementLevel.VERY_HIGH:
        baseProbability *= 1.2;
        break;
      case EngagementLevel.HIGH:
        baseProbability *= 1.1;
        break;
      case EngagementLevel.LOW:
        baseProbability *= 0.8;
        break;
    }

    return Math.min(Math.round(baseProbability * 100) / 100, 1);
  }

  private assignLeadPriority(score: number, conversionProbability: number): ActionPriority {
    const combinedScore = (score + conversionProbability * 100) / 2;
    
    if (combinedScore >= 85) return ActionPriority.URGENT;
    if (combinedScore >= 70) return ActionPriority.HIGH;
    if (combinedScore >= 50) return ActionPriority.MEDIUM;
    return ActionPriority.LOW;
  }

  // Additional helper methods for communication suggestions and insights...

  private getLastInteraction(client: Client) {
    return client.interactions.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  }

  private getDaysSinceLastContact(client: Client): number {
    const lastContact = client.relationship.lastContactDate;
    const now = new Date();
    return Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getRecentInteractions(client: Client, days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return client.interactions.filter(i => i.date >= cutoffDate);
  }

  private getInteractionsBetween(client: Client, startDays: number, endDays: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDays);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - endDays);
    
    return client.interactions.filter(i => i.date >= endDate && i.date <= startDate);
  }

  private calculateAverageResponseTime(client: Client): number {
    // Simplified - would need more complex logic to track actual response times
    return 24; // hours
  }

  private assessCommunicationQuality(interactions: any[]): number {
    if (interactions.length === 0) return 0.5;
    
    const positiveInteractions = interactions.filter(i => i.sentiment.overall > 0);
    return positiveInteractions.length / interactions.length;
  }

  private needsFollowUp(interaction: any): boolean {
    return interaction.followUpRequired && !interaction.followUpDate;
  }

  private getOptimalContactFrequency(preferences: any): number {
    // Convert preference to days
    switch (preferences.communicationFrequency) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'bi_weekly': return 14;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      default: return 30;
    }
  }

  private identifyOpportunities(client: Client): string[] {
    // Simplified opportunity identification
    return ['upsell', 'cross-sell', 'renewal'];
  }

  private getCompanySizeScore(size: string): number {
    const sizeScores: { [key: string]: number } = {
      'startup': 60,
      'small': 70,
      'medium': 80,
      'large': 90,
      'enterprise': 95,
    };
    return sizeScores[size] || 50;
  }

  private getIndustryScore(industry: string): number {
    // Simplified industry scoring - would be based on historical conversion data
    const highValueIndustries = ['technology', 'finance', 'healthcare'];
    return highValueIndustries.includes(industry.toLowerCase()) ? 85 : 70;
  }

  private estimateBudgetScore(client: Client): number {
    // Estimate based on company size and industry
    const sizeMultiplier = this.getCompanySizeScore(client.contact.company.size) / 100;
    const industryMultiplier = this.getIndustryScore(client.contact.company.industry) / 100;
    
    return Math.round((sizeMultiplier + industryMultiplier) / 2 * 100);
  }

  private generateFollowUpSuggestion(client: Client, lastInteraction: any): CommunicationSuggestion {
    return {
      type: 'follow_up',
      subject: `Follow-up on ${lastInteraction.subject}`,
      content: `Hi ${client.contact.primaryContact.firstName}, I wanted to follow up on our recent ${lastInteraction.type}...`,
      timing: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      priority: ActionPriority.HIGH,
      expectedOutcome: 'Maintain engagement and move opportunity forward',
      personalizationFactors: ['last_interaction', 'communication_style'],
    };
  }

  private generateCheckInSuggestion(client: Client): CommunicationSuggestion {
    return {
      type: 'email',
      subject: `Checking in with ${client.contact.company.legalName}`,
      content: `Hi ${client.contact.primaryContact.firstName}, I hope you're doing well. I wanted to check in and see how things are going...`,
      timing: new Date(),
      priority: ActionPriority.MEDIUM,
      expectedOutcome: 'Re-engage client and identify new opportunities',
      personalizationFactors: ['company_updates', 'industry_trends'],
    };
  }

  private generateOpportunitySuggestion(client: Client, opportunity: string): CommunicationSuggestion {
    return {
      type: 'proposal',
      subject: `New opportunity for ${client.contact.company.legalName}`,
      content: `Based on your recent growth, I believe we have an opportunity to help with ${opportunity}...`,
      timing: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      priority: ActionPriority.HIGH,
      expectedOutcome: 'Generate new business opportunity',
      personalizationFactors: ['business_growth', 'past_projects'],
    };
  }

  private generateRelationshipBuildingSuggestion(client: Client): CommunicationSuggestion {
    return {
      type: 'meeting',
      subject: 'Let\'s catch up over coffee',
      content: `Hi ${client.contact.primaryContact.firstName}, I'd love to catch up and hear about what's new with ${client.contact.company.legalName}...`,
      timing: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      priority: ActionPriority.MEDIUM,
      expectedOutcome: 'Strengthen relationship and improve satisfaction',
      personalizationFactors: ['personal_interests', 'meeting_preferences'],
    };
  }

  private generateInsights(client: Client, healthScore: ClientHealthScore, churnPrediction: ChurnPrediction): ClientInsight[] {
    const insights: ClientInsight[] = [];

    // Health trend insight
    if (healthScore.trend === 'declining') {
      insights.push({
        id: `health-decline-${client.id}`,
        type: InsightType.ALERT,
        title: 'Client Health Declining',
        description: `${client.name}'s health score has been declining. Consider proactive outreach.`,
        confidence: 0.8,
        actionable: true,
        createdAt: new Date(),
      });
    }

    // Churn risk insight
    if (churnPrediction.riskScore > 0.6) {
      insights.push({
        id: `churn-risk-${client.id}`,
        type: InsightType.RISK,
        title: 'High Churn Risk',
        description: `${client.name} has a ${Math.round(churnPrediction.riskScore * 100)}% churn risk. Immediate action recommended.`,
        confidence: churnPrediction.confidence,
        actionable: true,
        createdAt: new Date(),
      });
    }

    // Opportunity insight
    if (healthScore.overall > 80 && client.relationship.totalRevenue > 50000) {
      insights.push({
        id: `upsell-opportunity-${client.id}`,
        type: InsightType.OPPORTUNITY,
        title: 'Upsell Opportunity',
        description: `${client.name} is a healthy, high-value client. Consider presenting additional services.`,
        confidence: 0.7,
        actionable: true,
        createdAt: new Date(),
      });
    }

    return insights;
  }

  private generateNextBestActions(
    client: Client, 
    healthScore: ClientHealthScore, 
    churnPrediction: ChurnPrediction,
    communicationSuggestions: CommunicationSuggestion[]
  ): NextBestAction[] {
    const actions: NextBestAction[] = [];

    // Priority action based on churn risk
    if (churnPrediction.riskScore > 0.7) {
      actions.push({
        action: 'Schedule urgent retention meeting',
        reason: 'High churn risk detected',
        priority: ActionPriority.URGENT,
        estimatedImpact: 'High - could prevent client loss',
        suggestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      });
    }

    // Communication action
    if (communicationSuggestions.length > 0) {
      const topSuggestion = communicationSuggestions[0];
      actions.push({
        action: topSuggestion.subject,
        reason: topSuggestion.expectedOutcome,
        priority: topSuggestion.priority,
        estimatedImpact: 'Medium - maintain engagement',
        suggestedDate: topSuggestion.timing,
      });
    }

    // Health improvement action
    if (healthScore.overall < 60) {
      actions.push({
        action: 'Conduct client satisfaction survey',
        reason: 'Low health score indicates potential issues',
        priority: ActionPriority.HIGH,
        estimatedImpact: 'Medium - identify improvement areas',
        suggestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}