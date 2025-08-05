import {
  Campaign,
  CampaignInsight,
  OptimizationPlan,
  BudgetProposal,
  PerformanceMetric,
  BusinessContext,
  CampaignStatus,
  CampaignType,
  OptimizationAction,
  ActionType,
  RiskLevel,
  ImpactType,
  ConfidenceLevel,
  OptimizationPriority,
  ComplexityLevel,
  InsightType,
  InsightPriority,
  UrgencyLevel,
  InsightCategory
} from '../types/googleAds';
import {
  CAMPAIGNS,
  BUSINESS_CONTEXT,
  CAMPAIGN_INSIGHTS,
  getCampaignById,
  getCampaignsByStatus,
  getTopPerformingCampaigns,
  getCriticalInsights,
  calculateTotalSpend,
  calculateTotalRevenue,
  calculateOverallROAS
} from './mockData';

interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  minROAS?: number;
  maxCPA?: number;
}

interface PerformanceReportResult {
  summary: string;
  campaigns: Campaign[];
  insights: CampaignInsight[];
  recommendations: string[];
  metrics: Record<string, number>;
}

interface CampaignAnalysisResult {
  summary: string;
  metrics: Record<string, number | string>;
  insights: CampaignInsight[];
  recommendations: string[];
}

interface CompetitorInsights {
  opportunities: string[];
  threats: string[];
  recommendations: string[];
  marketShare: Record<string, number>;
}

export class GoogleAdsService {
  private campaigns: Campaign[];
  private businessContext: BusinessContext;
  private insights: CampaignInsight[];

  constructor() {
    this.campaigns = [...CAMPAIGNS];
    this.businessContext = { ...BUSINESS_CONTEXT };
    this.insights = [...CAMPAIGN_INSIGHTS];
  }

  // Campaign Data Retrieval
  async getCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
    let filteredCampaigns = [...this.campaigns];

    if (filters) {
      if (filters.status) {
        filteredCampaigns = filteredCampaigns.filter(c => c.status === filters.status);
      }
      if (filters.type) {
        filteredCampaigns = filteredCampaigns.filter(c => c.type === filters.type);
      }
      if (typeof filters.minROAS === 'number') {
        filteredCampaigns = filteredCampaigns.filter(c => c.roas >= filters.minROAS!);
      }
      if (typeof filters.maxCPA === 'number') {
        filteredCampaigns = filteredCampaigns.filter(c => c.costPerConversion <= filters.maxCPA!);
      }
    }

    // Add business intelligence insights to each campaign
    return filteredCampaigns.map(campaign => ({
      ...campaign,
      insights: this.generateCampaignSpecificInsights(campaign)
    }));
  }

  async getCampaignById(campaignId: string): Promise<Campaign | null> {
    const campaign = getCampaignById(campaignId);
    if (!campaign) return null;

    return {
      ...campaign,
      insights: this.generateCampaignSpecificInsights(campaign)
    };
  }

  async getCampaignPerformance(campaignId: string, days: number = 7): Promise<PerformanceMetric[]> {
    const campaign = getCampaignById(campaignId);
    if (!campaign || !campaign.performance7Day) return [];

    return campaign.performance7Day.slice(-days);
  }

  // Performance Analysis
  async analyzeCampaignPerformance(campaignId?: string): Promise<CampaignAnalysisResult> {
    if (campaignId) {
      return this.analyzeSingleCampaign(campaignId);
    }

    return this.analyzeAllCampaigns();
  }

  private async analyzeSingleCampaign(campaignId: string): Promise<CampaignAnalysisResult> {
    const campaign = getCampaignById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const performance7Day = campaign.performance7Day || [];
    const avgDailyRevenue = performance7Day.reduce((sum, day) => sum + day.revenue, 0) / Math.max(performance7Day.length, 1);
    const trendDirection = this.calculateTrend(performance7Day.map(d => d.roas));

    return {
      summary: this.generateCampaignSummary(campaign, trendDirection),
      metrics: {
        currentROAS: campaign.roas,
        targetROAS: this.businessContext.targetROAS,
        conversionRate: campaign.conversionRate,
        costPerConversion: campaign.costPerConversion,
        targetCPA: this.businessContext.targetCPA,
        qualityScore: campaign.qualityScore,
        avgDailyRevenue: Math.round(avgDailyRevenue),
        trend: trendDirection,
        status: campaign.status,
        budget: campaign.budget,
        dailySpend: campaign.dailySpend
      },
      insights: this.generateCampaignSpecificInsights(campaign),
      recommendations: this.generateCampaignRecommendations(campaign)
    };
  }

  private async analyzeAllCampaigns(): Promise<CampaignAnalysisResult> {
    const activeCampaigns = getCampaignsByStatus(CampaignStatus.ENABLED);
    const totalSpend = calculateTotalSpend();
    const totalRevenue = calculateTotalRevenue();
    const overallROAS = calculateOverallROAS();
    const topPerformers = getTopPerformingCampaigns(3);
    const topPerformer = topPerformers[0];

    return {
      summary: `Portfolio Analysis: ${activeCampaigns.length} active campaigns generating $${totalRevenue.toLocaleString()} revenue with ${overallROAS.toFixed(1)}x ROAS. Q4 holiday performance shows strong momentum with top performer (${topPerformer?.name || 'N/A'}) achieving ${topPerformer?.roas || 0}x ROAS.`,
      metrics: {
        activeCampaigns: activeCampaigns.length,
        totalDailySpend: totalSpend,
        totalRevenue: Math.round(totalRevenue),
        overallROAS: Math.round(overallROAS * 10) / 10,
        targetROAS: this.businessContext.targetROAS,
        avgConversionRate: Math.round((activeCampaigns.reduce((sum, c) => sum + c.conversionRate, 0) / Math.max(activeCampaigns.length, 1)) * 100) / 100,
        topPerformerROAS: topPerformer?.roas || 0,
        urgentIssuesCount: this.businessContext.urgentIssues.length,
        holidayDaysRemaining: this.calculateHolidayDaysRemaining()
      },
      insights: getCriticalInsights(),
      recommendations: this.generatePortfolioRecommendations()
    };
  }

  // Optimization Planning
  async getOptimizationPlan(campaignId: string): Promise<OptimizationPlan> {
    const campaign = getCampaignById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const actions = this.generateOptimizationActions(campaign);
    const estimatedImpact = this.calculateOptimizationImpact(campaign, actions);

    return {
      campaignId,
      priority: this.determineOptimizationPriority(campaign),
      actions,
      estimatedImpact,
      implementationComplexity: this.assessImplementationComplexity(actions),
      timeline: this.generateOptimizationTimeline(actions)
    };
  }

  // Budget Management
  async proposeBudgetChange(
    campaignId: string,
    newBudget: number,
    reason: string
  ): Promise<BudgetProposal> {
    const campaign = getCampaignById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const budgetChange = newBudget - campaign.budget;
    const estimatedImpact = this.calculateBudgetImpact(campaign, budgetChange);

    return {
      campaignId,
      currentBudget: campaign.budget,
      proposedBudget: newBudget,
      reason,
      estimatedImpact,
      riskLevel: this.assessBudgetRisk(campaign, budgetChange),
      timeframe: this.determineBudgetTimeframe(campaign, budgetChange)
    };
  }

  async executeBudgetChange(campaignId: string, newBudget: number): Promise<boolean> {
    const campaignIndex = this.campaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) return false;

    // Simulate budget change
    this.campaigns[campaignIndex] = {
      ...this.campaigns[campaignIndex],
      budget: newBudget,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    return true;
  }

  // Campaign Actions
  async executeCampaignAction(
    campaignId: string,
    action: 'enable' | 'pause' | 'remove',
  ): Promise<boolean> {
    const campaignIndex = this.campaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) return false;

    let newStatus: CampaignStatus;
    switch (action) {
      case 'enable':
        newStatus = CampaignStatus.ENABLED;
        break;
      case 'pause':
        newStatus = CampaignStatus.PAUSED;
        break;
      case 'remove':
        newStatus = CampaignStatus.REMOVED;
        break;
      default:
        return false;
    }

    this.campaigns[campaignIndex] = {
      ...this.campaigns[campaignIndex],
      status: newStatus,
      dailySpend: newStatus === CampaignStatus.ENABLED ? this.campaigns[campaignIndex].dailySpend : 0,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    return true;
  }

  // Insights and Recommendations
  async getCompetitorInsights(): Promise<CompetitorInsights> {
    return {
      opportunities: [
        "Nike keyword gaps identified: 'nike alternatives', 'better than nike' showing 2,400 monthly searches",
        "Adidas winter collection keywords underutilized during peak season",
        "Under Armour fitness targeting opportunity with 35% lower competition",
        "H&M fast fashion keywords available at 40% lower cost per click"
      ],
      threats: [
        "Nike increasing spend on 'athletic fashion' keywords by 60% this month",
        "Adidas launching aggressive retargeting campaign for cart abandoners",
        "Zara capturing mobile traffic with improved mobile ad formats",
        "Under Armour targeting holiday gift buyers with expanded budgets"
      ],
      recommendations: [
        "Launch 'Nike Alternative' campaign with $25/day budget targeting dissatisfied Nike customers",
        "Increase competitor targeting budget by $40/day during final holiday week",
        "Implement dynamic keyword insertion for competitor comparison ads",
        "Create comparison landing pages highlighting StylePlus advantages over competitors"
      ],
      marketShare: {
        "Nike": 28.5,
        "Adidas": 22.1,
        "Under Armour": 15.8,
        "H&M": 12.3,
        "Zara": 11.2,
        "StylePlus": 4.8,
        "Others": 5.3
      }
    };
  }

  // Reporting
  async generatePerformanceReport(
    timeframe: '7d' | '14d' | '30d' = '7d',
    campaignIds?: string[]
  ): Promise<PerformanceReportResult> {
    const campaigns = campaignIds ? 
      campaignIds.map(id => getCampaignById(id)).filter((campaign): campaign is Campaign => campaign !== null) :
      this.campaigns;

    const activeCampaigns = campaigns.filter(c => c.status === CampaignStatus.ENABLED);
    const totalSpend = activeCampaigns.reduce((sum, c) => sum + c.dailySpend, 0);
    const totalRevenue = activeCampaigns.reduce((sum, c) => sum + c.revenue, 0);
    const timeframeDays = this.getTimeframeDays(timeframe);
    const totalCostForPeriod = totalSpend * timeframeDays;
    const overallROAS = totalCostForPeriod > 0 ? totalRevenue / totalCostForPeriod : 0;

    return {
      summary: `Performance Report (${timeframe}): ${activeCampaigns.length} active campaigns with $${totalSpend.toFixed(2)}/day spend generating $${totalRevenue.toLocaleString()} revenue. Q4 holiday performance trending ${this.calculatePortfolioTrend()}.`,
      campaigns: activeCampaigns,
      insights: this.insights,
      recommendations: this.generatePortfolioRecommendations(),
      metrics: {
        totalSpend,
        totalRevenue,
        overallROAS: Math.round(overallROAS * 100) / 100,
        avgConversionRate: activeCampaigns.length > 0 ? 
          Math.round((activeCampaigns.reduce((sum, c) => sum + c.conversionRate, 0) / activeCampaigns.length) * 100) / 100 : 0,
        avgCostPerConversion: activeCampaigns.length > 0 ? 
          Math.round((activeCampaigns.reduce((sum, c) => sum + c.costPerConversion, 0) / activeCampaigns.length) * 100) / 100 : 0,
        totalConversions: activeCampaigns.reduce((sum, c) => sum + c.conversions, 0)
      }
    };
  }

  // Helper Methods
  private generateCampaignSpecificInsights(campaign: Campaign): CampaignInsight[] {
    const insights: CampaignInsight[] = [];

    // Performance insights
    if (campaign.roas > this.businessContext.targetROAS * 1.2) {
      insights.push({
        type: InsightType.PERFORMANCE,
        priority: InsightPriority.HIGH,
        title: "Scale Opportunity",
        description: `Campaign exceeding target ROAS (${campaign.roas}x vs ${this.businessContext.targetROAS}x target)`,
        recommendation: `Increase budget by 50-100% to capture more volume at this performance level`,
        estimatedImpact: {
          type: ImpactType.REVENUE_INCREASE,
          value: campaign.revenue * 0.5,
          confidence: ConfidenceLevel.HIGH,
          timeframe: "Next 7 days"
        },
        urgency: UrgencyLevel.THIS_WEEK,
        category: InsightCategory.OPPORTUNITY
      });
    }

    // Quality score insights
    if (campaign.qualityScore >= 8) {
      insights.push({
        type: InsightType.PERFORMANCE,
        priority: InsightPriority.MEDIUM,
        title: "Quality Score Excellence",
        description: `High quality score of ${campaign.qualityScore} indicates strong ad relevance`,
        recommendation: "Use this campaign structure as template for other campaigns",
        estimatedImpact: {
          type: ImpactType.COST_REDUCTION,
          value: 15,
          confidence: ConfidenceLevel.HIGH,
          timeframe: "Ongoing"
        },
        urgency: UrgencyLevel.THIS_MONTH,
        category: InsightCategory.OPTIMIZATION
      });
    }

    // Cost efficiency insights
    if (campaign.costPerConversion > this.businessContext.targetCPA * 1.5) {
      insights.push({
        type: InsightType.PERFORMANCE,
        priority: InsightPriority.HIGH,
        title: "High Cost Per Conversion",
        description: `CPA of $${campaign.costPerConversion} exceeds target of $${this.businessContext.targetCPA}`,
        recommendation: "Optimize targeting, improve ad copy, or pause underperforming keywords",
        estimatedImpact: {
          type: ImpactType.COST_REDUCTION,
          value: (campaign.costPerConversion - this.businessContext.targetCPA) * campaign.conversions,
          confidence: ConfidenceLevel.MEDIUM,
          timeframe: "2-3 weeks"
        },
        urgency: UrgencyLevel.THIS_WEEK,
        category: InsightCategory.WARNING
      });
    }

    return insights;
  }

  private generateCampaignRecommendations(campaign: Campaign): string[] {
    const recommendations: string[] = [];

    if (campaign.status === CampaignStatus.PAUSED) {
      recommendations.push(`Reactivate ${campaign.name} with optimized targeting to capture holiday traffic`);
    }

    if (campaign.roas > this.businessContext.targetROAS) {
      recommendations.push(`Scale ${campaign.name} budget by $${Math.round(campaign.budget * 0.5)} to maximize profitable traffic`);
    }

    if (campaign.conversionRate > 5) {
      recommendations.push(`Expand ${campaign.name} audience targeting to similar demographics`);
    }

    if (campaign.qualityScore < 7) {
      recommendations.push(`Improve ${campaign.name} ad copy and landing page relevance to boost quality score`);
    }

    return recommendations;
  }

  private generatePortfolioRecommendations(): string[] {
    return [
      "Scale Performance Max budget immediately - showing 4.66% conversion rate with strong holiday momentum",
      "Reallocate paused Display budget ($45/day) to top-performing campaigns",
      "Launch competitor keyword campaigns targeting Nike and Adidas during final holiday week",
      "Implement mobile conversion optimization - 15% performance gap vs desktop needs addressing",
      "Set up automated bid adjustments for remaining holiday shopping days",
      "Create urgency-focused ad copy highlighting limited-time holiday offers"
    ];
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / Math.max(secondHalf.length, 1);
    
    const change = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private generateCampaignSummary(campaign: Campaign, trend: string): string {
    const performanceLevel = campaign.roas > this.businessContext.targetROAS ? 'exceeding' : 
                           campaign.roas > this.businessContext.targetROAS * 0.8 ? 'meeting' : 'below';
    
    return `${campaign.name} is ${performanceLevel} targets with ${campaign.roas}x ROAS (${trend} trend). Converting at ${campaign.conversionRate}% with $${campaign.costPerConversion} CPA. ${campaign.status === CampaignStatus.ENABLED ? 'Active' : 'Paused'} with $${campaign.budget}/day budget.`;
  }

  private generateOptimizationActions(campaign: Campaign): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    if (campaign.roas > this.businessContext.targetROAS * 1.2) {
      actions.push({
        type: ActionType.BUDGET_INCREASE,
        description: "Increase daily budget to scale profitable performance",
        currentValue: campaign.budget,
        recommendedValue: campaign.budget * 1.5,
        reason: `ROAS of ${campaign.roas}x significantly exceeds target of ${this.businessContext.targetROAS}x`,
        risk: RiskLevel.LOW
      });
    }

    if (campaign.costPerConversion > this.businessContext.targetCPA * 1.3) {
      actions.push({
        type: ActionType.BID_ADJUSTMENT,
        description: "Reduce bids to improve cost efficiency",
        currentValue: "Current bid strategy",
        recommendedValue: "Target CPA bidding",
        reason: `Cost per conversion ($${campaign.costPerConversion}) exceeds target ($${this.businessContext.targetCPA})`,
        risk: RiskLevel.MEDIUM
      });
    }

    return actions;
  }

  private calculateOptimizationImpact(campaign: Campaign, actions: OptimizationAction[]) {
    let estimatedRevenue = 0;
    
    actions.forEach(action => {
      if (action.type === ActionType.BUDGET_INCREASE && typeof action.recommendedValue === 'number' && typeof action.currentValue === 'number') {
        const budgetIncrease = action.recommendedValue - action.currentValue;
        estimatedRevenue += budgetIncrease * campaign.roas;
      }
    });

    return {
      type: ImpactType.REVENUE_INCREASE,
      value: estimatedRevenue,
      confidence: ConfidenceLevel.MEDIUM,
      timeframe: "Next 7 days"
    };
  }

  private calculateBudgetImpact(campaign: Campaign, budgetChange: number) {
    const impactValue = Math.abs(budgetChange * campaign.roas);
    
    return {
      type: budgetChange > 0 ? ImpactType.REVENUE_INCREASE : ImpactType.COST_REDUCTION,
      value: impactValue,
      confidence: ConfidenceLevel.MEDIUM,
      timeframe: "Next 7 days"
    };
  }

  private calculateHolidayDaysRemaining(): number {
    const today = new Date();
    const newYear = new Date(today.getFullYear() + 1, 0, 1);
    const diffTime = newYear.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculatePortfolioTrend(): string {
    const activeCampaigns = getCampaignsByStatus(CampaignStatus.ENABLED);
    const avgROAS = activeCampaigns.length > 0 ? 
      activeCampaigns.reduce((sum, c) => sum + c.roas, 0) / activeCampaigns.length : 0;
    
    return avgROAS > this.businessContext.targetROAS ? 'positively' : 'below expectations';
  }

  private determineOptimizationPriority(campaign: Campaign): OptimizationPriority {
    if (campaign.roas > this.businessContext.targetROAS * 1.3) return OptimizationPriority.CRITICAL;
    if (campaign.costPerConversion > this.businessContext.targetCPA * 1.5) return OptimizationPriority.HIGH;
    return OptimizationPriority.MEDIUM;
  }

  private assessImplementationComplexity(actions: OptimizationAction[]): ComplexityLevel {
    const budgetActions = actions.filter(a => a.type === ActionType.BUDGET_INCREASE || a.type === ActionType.BUDGET_DECREASE);
    const bidActions = actions.filter(a => a.type === ActionType.BID_ADJUSTMENT);
    
    if (bidActions.length > 2) return ComplexityLevel.HIGH;
    if (budgetActions.length > 1) return ComplexityLevel.MEDIUM;
    return ComplexityLevel.LOW;
  }

  private generateOptimizationTimeline(actions: OptimizationAction[]): string {
    const immediateActions = actions.filter(a => a.risk === RiskLevel.LOW).length;
    const complexActions = actions.filter(a => a.risk === RiskLevel.HIGH).length;
    
    if (complexActions > 1) return "2-3 weeks implementation";
    if (immediateActions > 2) return "1 week implementation";
    return "3-5 days implementation";
  }

  private assessBudgetRisk(campaign: Campaign, budgetChange: number): RiskLevel {
    const changePercent = Math.abs(budgetChange) / campaign.budget;
    
    if (changePercent > 1) return RiskLevel.HIGH;
    if (changePercent > 0.5) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private determineBudgetTimeframe(campaign: Campaign, budgetChange: number): string {
    if (budgetChange > 0 && campaign.roas > this.businessContext.targetROAS) {
      return "Immediate - capturing profitable traffic";
    }
    return "Next budget cycle";
  }

  private getTimeframeDays(timeframe: '7d' | '14d' | '30d'): number {
    switch (timeframe) {
      case '7d': return 7;
      case '14d': return 14;
      case '30d': return 30;
      default: return 7;
    }
  }
}