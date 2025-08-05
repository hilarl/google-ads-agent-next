export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  type: CampaignType;
  budget: number;
  dailySpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  costPerConversion: number;
  costPerClick: number;
  clickThroughRate: number;
  qualityScore: number;
  roas: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
  targetAudience?: string[];
  keywords?: string[];
  adGroups?: AdGroup[];
  performance7Day?: PerformanceMetric[];
  insights?: CampaignInsight[];
}

export interface AdGroup {
  id: string;
  name: string;
  campaignId: string;
  status: AdGroupStatus;
  budget: number;
  keywords: Keyword[];
  ads: Ad[];
  targetCPA?: number;
  targetROAS?: number;
}

export interface Keyword {
  id: string;
  text: string;
  matchType: KeywordMatchType;
  status: KeywordStatus;
  bidAmount: number;
  qualityScore: number;
  impressions: number;
  clicks: number;
  conversions: number;
  costPerClick: number;
  searchVolume?: number;
  competition?: Competition;
}

export interface Ad {
  id: string;
  adGroupId: string;
  type: AdType;
  status: AdStatus;
  headline1: string;
  headline2?: string;
  headline3?: string;
  description1: string;
  description2?: string;
  finalUrl: string;
  displayUrl?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
}

export interface PerformanceMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  roas: number;
  costPerConversion: number;
  conversionRate: number;
}

export interface CampaignInsight {
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  recommendation: string;
  estimatedImpact: EstimatedImpact;
  urgency: UrgencyLevel;
  category: InsightCategory;
}

export interface EstimatedImpact {
  type: ImpactType;
  value: number;
  confidence: ConfidenceLevel;
  timeframe: string;
}

export interface BudgetProposal {
  campaignId: string;
  currentBudget: number;
  proposedBudget: number;
  reason: string;
  estimatedImpact: EstimatedImpact;
  riskLevel: RiskLevel;
  timeframe: string;
}

export interface OptimizationPlan {
  campaignId: string;
  priority: OptimizationPriority;
  actions: OptimizationAction[];
  estimatedImpact: EstimatedImpact;
  implementationComplexity: ComplexityLevel;
  timeline: string;
}

export interface OptimizationAction {
  type: ActionType;
  description: string;
  currentValue?: string | number;
  recommendedValue: string | number;
  reason: string;
  risk: RiskLevel;
}

export interface BusinessContext {
  industry: string;
  companyName: string;
  avgOrderValue: number;
  targetROAS: number;
  targetCPA: number;
  seasonality: string;
  competitors: string[];
  urgentIssues: string[];
  businessGoals: string[];
  budgetConstraints?: BudgetConstraint[];
}

export interface BudgetConstraint {
  type: ConstraintType;
  value: number;
  period: TimePeriod;
  flexibility: FlexibilityLevel;
}

// Enums
export enum CampaignStatus {
  ENABLED = 'ENABLED',
  PAUSED = 'PAUSED',
  REMOVED = 'REMOVED',
  ENDED = 'ENDED'
}

export enum CampaignType {
  SEARCH = 'SEARCH',
  DISPLAY = 'DISPLAY',
  SHOPPING = 'SHOPPING',
  VIDEO = 'VIDEO',
  PERFORMANCE_MAX = 'PERFORMANCE_MAX',
  APP = 'APP',
  DISCOVERY = 'DISCOVERY',
  LOCAL = 'LOCAL'
}

export enum AdGroupStatus {
  ENABLED = 'ENABLED',
  PAUSED = 'PAUSED',
  REMOVED = 'REMOVED'
}

export enum KeywordMatchType {
  EXACT = 'EXACT',
  PHRASE = 'PHRASE',
  BROAD = 'BROAD',
  BROAD_MODIFIED = 'BROAD_MODIFIED'
}

export enum KeywordStatus {
  ENABLED = 'ENABLED',
  PAUSED = 'PAUSED',
  REMOVED = 'REMOVED'
}

export enum Competition {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum AdType {
  TEXT = 'TEXT',
  RESPONSIVE_SEARCH = 'RESPONSIVE_SEARCH',
  EXPANDED_TEXT = 'EXPANDED_TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  SHOPPING = 'SHOPPING',
  APP = 'APP'
}

export enum AdStatus {
  ENABLED = 'ENABLED',
  PAUSED = 'PAUSED',
  REMOVED = 'REMOVED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DISAPPROVED = 'DISAPPROVED'
}

export enum InsightType {
  PERFORMANCE = 'PERFORMANCE',
  BUDGET = 'BUDGET',
  TARGETING = 'TARGETING',
  CREATIVE = 'CREATIVE',
  KEYWORD = 'KEYWORD',
  AUDIENCE = 'AUDIENCE',
  SEASONAL = 'SEASONAL',
  COMPETITIVE = 'COMPETITIVE',
  OPPORTUNITY = 'OPPORTUNITY',
  ALERT = 'ALERT'
}

export enum InsightPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum UrgencyLevel {
  IMMEDIATE = 'IMMEDIATE',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  NEXT_QUARTER = 'NEXT_QUARTER'
}

export enum InsightCategory {
  OPTIMIZATION = 'OPTIMIZATION',
  ALERT = 'ALERT',
  OPPORTUNITY = 'OPPORTUNITY',
  WARNING = 'WARNING'
}

export enum ImpactType {
  REVENUE_INCREASE = 'REVENUE_INCREASE',
  COST_REDUCTION = 'COST_REDUCTION',
  CONVERSION_INCREASE = 'CONVERSION_INCREASE',
  ROAS_IMPROVEMENT = 'ROAS_IMPROVEMENT',
  TRAFFIC_INCREASE = 'TRAFFIC_INCREASE'
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum OptimizationPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum ActionType {
  BUDGET_INCREASE = 'BUDGET_INCREASE',
  BUDGET_DECREASE = 'BUDGET_DECREASE',
  BID_ADJUSTMENT = 'BID_ADJUSTMENT',
  KEYWORD_ADD = 'KEYWORD_ADD',
  KEYWORD_REMOVE = 'KEYWORD_REMOVE',
  AD_CREATIVE_UPDATE = 'AD_CREATIVE_UPDATE',
  AUDIENCE_ADJUSTMENT = 'AUDIENCE_ADJUSTMENT',
  CAMPAIGN_PAUSE = 'CAMPAIGN_PAUSE',
  CAMPAIGN_ENABLE = 'CAMPAIGN_ENABLE',
  LANDING_PAGE_UPDATE = 'LANDING_PAGE_UPDATE'
}

export enum ComplexityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ConstraintType {
  DAILY_BUDGET = 'DAILY_BUDGET',
  MONTHLY_BUDGET = 'MONTHLY_BUDGET',
  QUARTERLY_BUDGET = 'QUARTERLY_BUDGET',
  ANNUAL_BUDGET = 'ANNUAL_BUDGET'
}

export enum TimePeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY'
}

export enum FlexibilityLevel {
  STRICT = 'STRICT',
  MODERATE = 'MODERATE',
  FLEXIBLE = 'FLEXIBLE'
}