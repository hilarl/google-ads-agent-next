import { 
  Campaign, 
  BusinessContext, 
  CampaignStatus, 
  CampaignType,
  CampaignInsight,
  InsightType,
  InsightPriority,
  UrgencyLevel,
  InsightCategory,
  ImpactType,
  ConfidenceLevel
} from '../types/googleAds';

export const BUSINESS_CONTEXT: BusinessContext = {
  industry: "Fashion E-commerce",
  companyName: "StylePlus",
  avgOrderValue: 85.50,
  targetROAS: 4.2,
  targetCPA: 22.50,
  seasonality: "Q4 Holiday Peak",
  competitors: ["Nike", "Adidas", "Under Armour", "H&M", "Zara"],
  urgentIssues: [
    "Display campaign burning $45/day at high CPA",
    "Performance Max ready to scale (4.66% conv rate)",
    "Missing competitor keyword opportunities",
    "Mobile conversion rate 15% below desktop"
  ],
  businessGoals: [
    "Scale holiday sales by 40%",
    "Improve overall ROAS to 4.5x",
    "Reduce cost per acquisition",
    "Increase mobile conversions",
    "Capture more competitor traffic"
  ]
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: "camp_001",
    name: "Brand Awareness - StylePlus Fashion",
    status: CampaignStatus.ENABLED,
    type: CampaignType.SEARCH,
    budget: 75,
    dailySpend: 68.50,
    impressions: 15420,
    clicks: 892,
    conversions: 67,
    conversionRate: 3.62,
    costPerConversion: 6.21,
    costPerClick: 1.85,
    clickThroughRate: 5.78,
    qualityScore: 8.2,
    roas: 4.8,
    revenue: 5733.50,
    createdAt: "2024-10-15",
    updatedAt: "2024-12-28",
    targetAudience: ["Fashion enthusiasts", "Young professionals", "Style conscious"],
    keywords: ["stylish clothing", "fashion trends", "professional wear"],
    performance7Day: [
      { date: "2024-12-22", impressions: 2180, clicks: 125, conversions: 9, cost: 231.25, revenue: 769.50, roas: 3.3, costPerConversion: 25.69, conversionRate: 7.2 },
      { date: "2024-12-23", impressions: 2350, clicks: 142, conversions: 11, cost: 262.70, revenue: 940.50, roas: 3.6, costPerConversion: 23.88, conversionRate: 7.7 },
      { date: "2024-12-24", impressions: 1980, clicks: 118, conversions: 8, cost: 218.30, revenue: 684.00, roas: 3.1, costPerConversion: 27.29, conversionRate: 6.8 },
      { date: "2024-12-25", impressions: 1420, clicks: 78, conversions: 5, cost: 144.30, revenue: 427.50, roas: 3.0, costPerConversion: 28.86, conversionRate: 6.4 },
      { date: "2024-12-26", impressions: 2680, clicks: 168, conversions: 14, cost: 310.80, revenue: 1197.00, roas: 3.9, costPerConversion: 22.20, conversionRate: 8.3 },
      { date: "2024-12-27", impressions: 2590, clicks: 155, conversions: 12, cost: 286.75, revenue: 1026.00, roas: 3.6, costPerConversion: 23.90, conversionRate: 7.7 },
      { date: "2024-12-28", impressions: 2220, clicks: 134, conversions: 10, cost: 247.80, revenue: 855.00, roas: 3.4, costPerConversion: 24.78, conversionRate: 7.5 }
    ]
  },
  {
    id: "camp_002",
    name: "Performance Max - Holiday Fashion Sale",
    status: CampaignStatus.ENABLED,
    type: CampaignType.PERFORMANCE_MAX,
    budget: 150,
    dailySpend: 143.20,
    impressions: 28640,
    clicks: 1820,
    conversions: 198,
    conversionRate: 4.66,
    costPerConversion: 6.40,
    costPerClick: 2.12,
    clickThroughRate: 6.35,
    qualityScore: 7.8,
    roas: 5.2,
    revenue: 16929.00,
    createdAt: "2024-11-01",
    updatedAt: "2024-12-28",
    targetAudience: ["Holiday shoppers", "Gift buyers", "Fashion lovers"],
    keywords: ["holiday fashion", "winter sale", "fashion gifts", "holiday outfits"],
    performance7Day: [
      { date: "2024-12-22", impressions: 4180, clicks: 265, conversions: 28, cost: 561.80, revenue: 2394.00, roas: 4.3, costPerConversion: 20.06, conversionRate: 10.6 },
      { date: "2024-12-23", impressions: 4520, clicks: 295, conversions: 32, cost: 625.40, revenue: 2736.00, roas: 4.4, costPerConversion: 19.54, conversionRate: 10.8 },
      { date: "2024-12-24", impressions: 3890, clicks: 248, conversions: 25, cost: 525.76, revenue: 2137.50, roas: 4.1, costPerConversion: 21.03, conversionRate: 10.1 },
      { date: "2024-12-25", impressions: 2980, clicks: 185, conversions: 19, cost: 392.20, revenue: 1624.50, roas: 4.1, costPerConversion: 20.64, conversionRate: 10.3 },
      { date: "2024-12-26", impressions: 5120, clicks: 338, conversions: 38, cost: 716.56, revenue: 3249.00, roas: 4.5, costPerConversion: 18.86, conversionRate: 11.2 },
      { date: "2024-12-27", impressions: 4860, clicks: 312, conversions: 35, cost: 661.44, revenue: 2992.50, roas: 4.5, costPerConversion: 18.90, conversionRate: 11.2 },
      { date: "2024-12-28", impressions: 4090, clicks: 268, conversions: 31, cost: 568.16, revenue: 2652.50, roas: 4.7, costPerConversion: 18.33, conversionRate: 11.6 }
    ]
  },
  {
    id: "camp_003",
    name: "Display Retargeting - Cart Abandoners",
    status: CampaignStatus.PAUSED,
    type: CampaignType.DISPLAY,
    budget: 45,
    dailySpend: 0,
    impressions: 12580,
    clicks: 356,
    conversions: 24,
    conversionRate: 2.70,
    costPerConversion: 18.41,
    costPerClick: 3.24,
    clickThroughRate: 2.83,
    qualityScore: 6.4,
    roas: 2.1,
    revenue: 2052.00,
    createdAt: "2024-09-20",
    updatedAt: "2024-12-26",
    targetAudience: ["Cart abandoners", "Previous visitors", "Product viewers"],
    performance7Day: [
      { date: "2024-12-22", impressions: 0, clicks: 0, conversions: 0, cost: 0, revenue: 0, roas: 0, costPerConversion: 0, conversionRate: 0 },
      { date: "2024-12-23", impressions: 0, clicks: 0, conversions: 0, cost: 0, revenue: 0, roas: 0, costPerConversion: 0, conversionRate: 0 },
      { date: "2024-12-24", impressions: 0, clicks: 0, conversions: 0, cost: 0, revenue: 0, roas: 0, costPerConversion: 0, conversionRate: 0 },
      { date: "2024-12-25", impressions: 0, clicks: 0, conversions: 0, cost: 0, revenue: 0, roas: 0, costPerConversion: 0, conversionRate: 0 },
      { date: "2024-12-26", impressions: 0, clicks: 0, conversions: 0, cost: 0, revenue: 0, roas: 0, costPerConversion: 0, conversionRate: 0 },
      { date: "2024-12-27", impressions: 0, clicks: 0, conversions: 0, cost: 0, revenue: 0, roas: 0, costPerConversion: 0, conversionRate: 0 },
      { date: "2024-12-28", impressions: 0, clicks: 0, conversions: 0, cost: 0, revenue: 0, roas: 0, costPerConversion: 0, conversionRate: 0 }
    ]
  },
  {
    id: "camp_004",
    name: "Competitor Targeting - Nike Keywords",
    status: CampaignStatus.ENABLED,
    type: CampaignType.SEARCH,
    budget: 35,
    dailySpend: 31.80,
    impressions: 8940,
    clicks: 428,
    conversions: 18,
    conversionRate: 4.21,
    costPerConversion: 7.92,
    costPerClick: 1.68,
    clickThroughRate: 4.79,
    qualityScore: 7.1,
    roas: 4.1,
    revenue: 1539.00,
    createdAt: "2024-11-15",
    updatedAt: "2024-12-28",
    targetAudience: ["Nike customers", "Athletic wear buyers", "Competitor traffic"],
    keywords: ["nike alternatives", "athletic wear sale", "sports fashion"],
    performance7Day: [
      { date: "2024-12-22", impressions: 1280, clicks: 62, conversions: 3, cost: 104.16, revenue: 256.50, roas: 2.5, costPerConversion: 34.72, conversionRate: 4.8 },
      { date: "2024-12-23", impressions: 1420, clicks: 69, conversions: 3, cost: 115.92, revenue: 256.50, roas: 2.2, costPerConversion: 38.64, conversionRate: 4.3 },
      { date: "2024-12-24", impressions: 1180, clicks: 54, conversions: 2, cost: 90.72, revenue: 171.00, roas: 1.9, costPerConversion: 45.36, conversionRate: 3.7 },
      { date: "2024-12-25", impressions: 890, clicks: 41, conversions: 2, cost: 68.88, revenue: 171.00, roas: 2.5, costPerConversion: 34.44, conversionRate: 4.9 },
      { date: "2024-12-26", impressions: 1520, clicks: 75, conversions: 4, cost: 126.00, revenue: 342.00, roas: 2.7, costPerConversion: 31.50, conversionRate: 5.3 },
      { date: "2024-12-27", impressions: 1380, clicks: 68, conversions: 3, cost: 114.24, revenue: 256.50, roas: 2.2, costPerConversion: 38.08, conversionRate: 4.4 },
      { date: "2024-12-28", impressions: 1270, clicks: 59, conversions: 3, cost: 99.12, revenue: 256.50, roas: 2.6, costPerConversion: 33.04, conversionRate: 5.1 }
    ]
  },
  {
    id: "camp_005",
    name: "Shopping - Winter Collection",
    status: CampaignStatus.ENABLED,
    type: CampaignType.SHOPPING,
    budget: 90,
    dailySpend: 82.40,
    impressions: 18750,
    clicks: 1250,
    conversions: 89,
    conversionRate: 7.12,
    costPerConversion: 10.34,
    costPerClick: 1.45,
    clickThroughRate: 6.67,
    qualityScore: 7.6,
    roas: 3.8,
    revenue: 7609.50,
    createdAt: "2024-10-01",
    updatedAt: "2024-12-28",
    targetAudience: ["Winter fashion shoppers", "Cold weather clothing", "Seasonal buyers"],
    keywords: ["winter coats", "warm clothing", "winter fashion", "cold weather gear"],
    performance7Day: [
      { date: "2024-12-22", impressions: 2680, clicks: 178, conversions: 13, cost: 258.10, revenue: 1111.50, roas: 4.3, costPerConversion: 19.85, conversionRate: 7.3 },
      { date: "2024-12-23", impressions: 2890, clicks: 195, conversions: 15, cost: 282.75, revenue: 1282.50, roas: 4.5, costPerConversion: 18.85, conversionRate: 7.7 },
      { date: "2024-12-24", impressions: 2420, clicks: 162, conversions: 11, cost: 234.90, revenue: 940.50, roas: 4.0, costPerConversion: 21.35, conversionRate: 6.8 },
      { date: "2024-12-25", impressions: 1890, clicks: 125, conversions: 8, cost: 181.25, revenue: 684.00, roas: 3.8, costPerConversion: 22.66, conversionRate: 6.4 },
      { date: "2024-12-26", impressions: 3120, clicks: 218, conversions: 17, cost: 316.10, revenue: 1453.50, roas: 4.6, costPerConversion: 18.59, conversionRate: 7.8 },
      { date: "2024-12-27", impressions: 2980, clicks: 205, conversions: 16, cost: 297.25, revenue: 1368.00, roas: 4.6, costPerConversion: 18.58, conversionRate: 7.8 },
      { date: "2024-12-28", impressions: 2770, clicks: 187, conversions: 14, cost: 271.15, revenue: 1197.00, roas: 4.4, costPerConversion: 19.37, conversionRate: 7.5 }
    ]
  }
];

export const CAMPAIGN_INSIGHTS: CampaignInsight[] = [
  {
    type: InsightType.OPPORTUNITY,
    priority: InsightPriority.CRITICAL,
    title: "Q4 Holiday Revenue Acceleration",
    description: "Performance Max campaign shows exceptional performance metrics, ready for immediate scaling during peak holiday shopping period",
    recommendation: "Increase Performance Max budget from $150 to $225/day to capture remaining holiday traffic. Expected additional revenue: $2,800-3,500",
    estimatedImpact: {
      type: ImpactType.REVENUE_INCREASE,
      value: 3200,
      confidence: ConfidenceLevel.HIGH,
      timeframe: "Next 7 days"
    },
    urgency: UrgencyLevel.IMMEDIATE,
    category: InsightCategory.OPPORTUNITY
  },
  {
    type: InsightType.COMPETITIVE,
    priority: InsightPriority.HIGH,
    title: "Competitor Keyword Gap",
    description: "Missing visibility on high-value competitor keywords during holiday season when competitor traffic is 40% higher",
    recommendation: "Launch expanded competitor targeting campaigns for Adidas and Under Armour keywords with $25/day budget each",
    estimatedImpact: {
      type: ImpactType.TRAFFIC_INCREASE,
      value: 25,
      confidence: ConfidenceLevel.MEDIUM,
      timeframe: "Weekly increase"
    },
    urgency: UrgencyLevel.THIS_WEEK,
    category: InsightCategory.OPPORTUNITY
  },
  {
    type: InsightType.BUDGET,
    priority: InsightPriority.MEDIUM,
    title: "Budget Reallocation Opportunity",
    description: "Paused Display campaign budget ($45/day) can be reallocated to high-performing campaigns for better ROI",
    recommendation: "Redistribute Display budget: $30 to Performance Max, $15 to Competitor Targeting for optimal holiday performance",
    estimatedImpact: {
      type: ImpactType.ROAS_IMPROVEMENT,
      value: 1.2,
      confidence: ConfidenceLevel.HIGH,
      timeframe: "Immediate"
    },
    urgency: UrgencyLevel.THIS_WEEK,
    category: InsightCategory.OPTIMIZATION
  },
  {
    type: InsightType.CREATIVE,
    priority: InsightPriority.MEDIUM,
    title: "Mobile Conversion Optimization",
    description: "Mobile conversion rates 15% below desktop across all campaigns, indicating creative or landing page issues",
    recommendation: "Implement mobile-optimized landing pages and test mobile-specific ad creatives with stronger calls-to-action",
    estimatedImpact: {
      type: ImpactType.CONVERSION_INCREASE,
      value: 18,
      confidence: ConfidenceLevel.MEDIUM,
      timeframe: "2-3 weeks"
    },
    urgency: UrgencyLevel.THIS_MONTH,
    category: InsightCategory.OPTIMIZATION
  },
  {
    type: InsightType.SEASONAL,
    priority: InsightPriority.HIGH,
    title: "Holiday Season Urgency",
    description: "Only 4 days remaining in peak holiday shopping period. Current performance trends show opportunity for 40% revenue increase",
    recommendation: "Execute emergency scaling plan: increase total daily budget from $350 to $475 across top-performing campaigns",
    estimatedImpact: {
      type: ImpactType.REVENUE_INCREASE,
      value: 4200,
      confidence: ConfidenceLevel.HIGH,
      timeframe: "Remaining holiday period"
    },
    urgency: UrgencyLevel.IMMEDIATE,
    category: InsightCategory.ALERT
  }
];

export const QUICK_ACTIONS = [
  {
    id: "scale_pmax",
    label: "Scale Performance Max",
    description: "Increase Performance Max budget by $50/day",
    category: "optimization" as const,
    estimatedTime: "2 minutes"
  },
  {
    id: "reallocate_budget",
    label: "Reallocate Display Budget",
    description: "Move paused Display budget to performing campaigns",
    category: "management" as const,
    estimatedTime: "5 minutes"
  },
  {
    id: "competitor_analysis",
    label: "Competitor Analysis",
    description: "Analyze competitor keyword opportunities",
    category: "analysis" as const,
    estimatedTime: "10 minutes"
  },
  {
    id: "mobile_optimization",
    label: "Mobile Conversion Report",
    description: "Generate mobile performance analysis report",
    category: "reporting" as const,
    estimatedTime: "3 minutes"
  }
];

// Helper functions for data manipulation
export function getCampaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find(campaign => campaign.id === id);
}

export function getCampaignsByStatus(status: CampaignStatus): Campaign[] {
  return CAMPAIGNS.filter(campaign => campaign.status === status);
}

export function getCampaignsByType(type: CampaignType): Campaign[] {
  return CAMPAIGNS.filter(campaign => campaign.type === type);
}

export function getTopPerformingCampaigns(limit: number = 3): Campaign[] {
  return CAMPAIGNS
    .filter(campaign => campaign.status === CampaignStatus.ENABLED)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, limit);
}

export function getCriticalInsights(): CampaignInsight[] {
  return CAMPAIGN_INSIGHTS.filter(insight => 
    insight.priority === InsightPriority.CRITICAL || 
    insight.urgency === UrgencyLevel.IMMEDIATE
  );
}

export function calculateTotalSpend(): number {
  return CAMPAIGNS.reduce((total, campaign) => total + campaign.dailySpend, 0);
}

export function calculateTotalRevenue(): number {
  return CAMPAIGNS.reduce((total, campaign) => total + campaign.revenue, 0);
}

export function calculateOverallROAS(): number {
  const totalRevenue = calculateTotalRevenue();
  const totalSpend = CAMPAIGNS.reduce((total, campaign) => 
    total + (campaign.dailySpend * 30), 0 // Approximate monthly spend
  );
  return totalRevenue / totalSpend;
}