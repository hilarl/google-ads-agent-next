import { GoogleAdsService } from './googleAdsService';
import { 
  GeminiFunctionCall, 
  FunctionCallResult,
  GeminiFunctionResponse 
} from '../types/gemini';
import { 
  CampaignStatus, 
  CampaignType 
} from '../types/googleAds';

// Function declaration interface for the new @google/genai SDK
interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, FunctionParameter>;
    required?: string[];
  };
}

interface FunctionParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: FunctionParameter;
  properties?: Record<string, FunctionParameter>;
}

export class FunctionCallHandler {
  private googleAdsService: GoogleAdsService;

  constructor() {
    this.googleAdsService = new GoogleAdsService();
  }

  // Define all available functions for Gemini
  getFunctionDeclarations(): FunctionDeclaration[] {
    return [
      {
        name: 'getCampaigns',
        description: 'Retrieve all Google Ads campaigns with performance metrics and insights',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by campaign status',
              enum: ['ENABLED', 'PAUSED', 'REMOVED', 'ENDED']
            },
            type: {
              type: 'string',
              description: 'Filter by campaign type',
              enum: ['SEARCH', 'DISPLAY', 'SHOPPING', 'VIDEO', 'PERFORMANCE_MAX', 'APP', 'DISCOVERY', 'LOCAL']
            },
            minROAS: {
              type: 'number',
              description: 'Minimum ROAS threshold for filtering'
            },
            maxCPA: {
              type: 'number',
              description: 'Maximum cost per acquisition for filtering'
            }
          }
        }
      },
      {
        name: 'analyzeCampaignPerformance',
        description: 'Analyze performance metrics for specific campaign or entire portfolio',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Specific campaign ID to analyze (optional - if not provided, analyzes all campaigns)'
            }
          }
        }
      },
      {
        name: 'getOptimizationPlan',
        description: 'Generate specific optimization recommendations for a campaign',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID to generate optimization plan for'
            }
          },
          required: ['campaignId']
        }
      },
      {
        name: 'proposeBudgetChange',
        description: 'Calculate impact and propose budget changes for campaigns',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID to modify budget for'
            },
            newBudget: {
              type: 'number',
              description: 'Proposed new daily budget amount'
            },
            reason: {
              type: 'string',
              description: 'Reason for budget change'
            }
          },
          required: ['campaignId', 'newBudget', 'reason']
        }
      },
      {
        name: 'executeCampaignAction',
        description: 'Execute campaign management actions (enable, pause, remove)',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID to perform action on'
            },
            action: {
              type: 'string',
              description: 'Action to perform',
              enum: ['enable', 'pause', 'remove']
            },
            reason: {
              type: 'string',
              description: 'Reason for the action'
            }
          },
          required: ['campaignId', 'action']
        }
      },
      {
        name: 'getCompetitorInsights',
        description: 'Analyze competitor landscape and identify opportunities',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'generatePerformanceReport',
        description: 'Generate comprehensive performance report for specified timeframe',
        parameters: {
          type: 'object',
          properties: {
            timeframe: {
              type: 'string',
              description: 'Report timeframe',
              enum: ['7d', '14d', '30d']
            },
            campaignIds: {
              type: 'array',
              description: 'Specific campaign IDs to include (optional)',
              items: {
                type: 'string',
                description: 'Campaign ID string'
              }
            }
          }
        }
      },
      {
        name: 'getCampaignPerformance',
        description: 'Get detailed performance metrics for a specific campaign over time',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID to get performance data for'
            },
            days: {
              type: 'number',
              description: 'Number of days of historical data to retrieve (default: 7)'
            }
          },
          required: ['campaignId']
        }
      },
      {
        name: 'executeBudgetChange',
        description: 'Execute approved budget changes for campaigns',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID to update budget for'
            },
            newBudget: {
              type: 'number',
              description: 'New daily budget amount'
            }
          },
          required: ['campaignId', 'newBudget']
        }
      }
    ];
  }

  // Execute function calls from Gemini
  async executeFunctionCall(functionCall: GeminiFunctionCall): Promise<FunctionCallResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Executing function call: ${functionCall.name} with args:`, functionCall.args);
      
      let result: unknown;
      
      switch (functionCall.name) {
        case 'getCampaigns':
          result = await this.handleGetCampaigns(functionCall.args);
          break;
          
        case 'analyzeCampaignPerformance':
          result = await this.handleAnalyzeCampaignPerformance(functionCall.args);
          break;
          
        case 'getOptimizationPlan':
          result = await this.handleGetOptimizationPlan(functionCall.args);
          break;
          
        case 'proposeBudgetChange':
          result = await this.handleProposeBudgetChange(functionCall.args);
          break;
          
        case 'executeCampaignAction':
          result = await this.handleExecuteCampaignAction(functionCall.args);
          break;
          
        case 'getCompetitorInsights':
          result = await this.handleGetCompetitorInsights();
          break;
          
        case 'generatePerformanceReport':
          result = await this.handleGeneratePerformanceReport(functionCall.args);
          break;
          
        case 'getCampaignPerformance':
          result = await this.handleGetCampaignPerformance(functionCall.args);
          break;
          
        case 'executeBudgetChange':
          result = await this.handleExecuteBudgetChange(functionCall.args);
          break;
          
        default:
          throw new Error(`Unknown function: ${functionCall.name}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      console.log(`Function ${functionCall.name} executed successfully in ${executionTime}ms`);
      
      return {
        success: true,
        data: result,
        executionTime,
        metadata: {
          functionName: functionCall.name,
          argumentsProvided: Object.keys(functionCall.args),
          dataType: typeof result
        }
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`Function call failed: ${functionCall.name}`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime,
        metadata: {
          functionName: functionCall.name,
          argumentsProvided: Object.keys(functionCall.args),
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      };
    }
  }

  // Convert function call result to Gemini function response format
  createFunctionResponse(
    functionCall: GeminiFunctionCall, 
    result: FunctionCallResult
  ): GeminiFunctionResponse {
    return {
      name: functionCall.name,
      response: {
        result: result.data,
        success: result.success,
        error: result.error
      }
    };
  }

  // Individual function handlers with business logic
  private async handleGetCampaigns(args: Record<string, unknown>) {
    const filters: {
      status?: CampaignStatus;
      type?: CampaignType;
      minROAS?: number;
      maxCPA?: number;
    } = {};
    
    if (args.status && typeof args.status === 'string') {
      filters.status = args.status as CampaignStatus;
    }
    
    if (args.type && typeof args.type === 'string') {
      filters.type = args.type as CampaignType;
    }
    
    if (args.minROAS && typeof args.minROAS === 'number') {
      filters.minROAS = args.minROAS;
    }
    
    if (args.maxCPA && typeof args.maxCPA === 'number') {
      filters.maxCPA = args.maxCPA;
    }
    
    const campaigns = await this.googleAdsService.getCampaigns(filters);
    
    return {
      campaigns,
      totalCampaigns: campaigns.length,
      appliedFilters: filters,
      summary: `Retrieved ${campaigns.length} campaigns${Object.keys(filters).length > 0 ? ' with applied filters' : ''}`
    };
  }

  private async handleAnalyzeCampaignPerformance(args: Record<string, unknown>) {
    const campaignId = args.campaignId as string | undefined;
    return await this.googleAdsService.analyzeCampaignPerformance(campaignId);
  }

  private async handleGetOptimizationPlan(args: Record<string, unknown>) {
    const campaignId = args.campaignId as string;
    if (!campaignId) {
      throw new Error('Campaign ID is required for optimization plan');
    }
    
    return await this.googleAdsService.getOptimizationPlan(campaignId);
  }

  private async handleProposeBudgetChange(args: Record<string, unknown>) {
    const campaignId = args.campaignId as string;
    const newBudget = args.newBudget as number;
    const reason = args.reason as string;
    
    if (!campaignId || !newBudget || !reason) {
      throw new Error('Campaign ID, new budget, and reason are required');
    }
    
    return await this.googleAdsService.proposeBudgetChange(campaignId, newBudget, reason);
  }

  private async handleExecuteCampaignAction(args: Record<string, unknown>) {
    const campaignId = args.campaignId as string;
    const action = args.action as 'enable' | 'pause' | 'remove';
    const reason = args.reason as string | undefined;
    
    if (!campaignId || !action) {
      throw new Error('Campaign ID and action are required');
    }
    
    const success = await this.googleAdsService.executeCampaignAction(campaignId, action);
    
    return {
      success,
      campaignId,
      action,
      reason,
      message: success ? 
        `Successfully ${action}d campaign ${campaignId}` : 
        `Failed to ${action} campaign ${campaignId}`
    };
  }

  private async handleGetCompetitorInsights() {
    return await this.googleAdsService.getCompetitorInsights();
  }

  private async handleGeneratePerformanceReport(args: Record<string, unknown>) {
    const timeframe = (args.timeframe as '7d' | '14d' | '30d') || '7d';
    const campaignIds = args.campaignIds as string[] | undefined;
    
    return await this.googleAdsService.generatePerformanceReport(timeframe, campaignIds);
  }

  private async handleGetCampaignPerformance(args: Record<string, unknown>) {
    const campaignId = args.campaignId as string;
    const days = (args.days as number) || 7;
    
    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }
    
    const performance = await this.googleAdsService.getCampaignPerformance(campaignId, days);
    
    return {
      campaignId,
      days,
      performance,
      dataPoints: performance.length,
      summary: `${performance.length} days of performance data for campaign ${campaignId}`
    };
  }

  private async handleExecuteBudgetChange(args: Record<string, unknown>) {
    const campaignId = args.campaignId as string;
    const newBudget = args.newBudget as number;
    
    if (!campaignId || !newBudget) {
      throw new Error('Campaign ID and new budget are required');
    }
    
    const success = await this.googleAdsService.executeBudgetChange(campaignId, newBudget);
    
    return {
      success,
      campaignId,
      newBudget,
      message: success ? 
        `Successfully updated budget for campaign ${campaignId} to $${newBudget}/day` : 
        `Failed to update budget for campaign ${campaignId}`
    };
  }

  // Batch function execution for multiple calls
  async executeBatchFunctionCalls(functionCalls: GeminiFunctionCall[]): Promise<FunctionCallResult[]> {
    const promises = functionCalls.map(call => this.executeFunctionCall(call));
    return Promise.all(promises);
  }

  // Validate function call arguments
  validateFunctionCall(functionCall: GeminiFunctionCall): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const declarations = this.getFunctionDeclarations();
    const declaration = declarations.find(d => d.name === functionCall.name);
    
    if (!declaration) {
      errors.push(`Unknown function: ${functionCall.name}`);
      return { valid: false, errors };
    }
    
    // Check required parameters
    const required = declaration.parameters.required || [];
    for (const requiredParam of required) {
      if (!(requiredParam in functionCall.args)) {
        errors.push(`Missing required parameter: ${requiredParam}`);
      }
    }
    
    // Check parameter types
    const properties = declaration.parameters.properties || {};
    for (const [param, value] of Object.entries(functionCall.args)) {
      const propDef = properties[param];
      if (propDef) {
        const expectedType = propDef.type;
        const actualType = typeof value;
        
        if (expectedType === 'number' && actualType !== 'number') {
          errors.push(`Parameter ${param} should be a number, got ${actualType}`);
        } else if (expectedType === 'string' && actualType !== 'string') {
          errors.push(`Parameter ${param} should be a string, got ${actualType}`);
        } else if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Parameter ${param} should be an array, got ${actualType}`);
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Get function usage statistics
  getUsageStats(): {
    functionsAvailable: number;
    mostUsedFunctions: string[];
    averageExecutionTime: Record<string, number>;
  } {
    // In a real implementation, you'd track this data
    return {
      functionsAvailable: this.getFunctionDeclarations().length,
      mostUsedFunctions: ['getCampaigns', 'analyzeCampaignPerformance', 'proposeBudgetChange'],
      averageExecutionTime: {
        'getCampaigns': 150,
        'analyzeCampaignPerformance': 300,
        'getOptimizationPlan': 250,
        'proposeBudgetChange': 200
      }
    };
  }
}