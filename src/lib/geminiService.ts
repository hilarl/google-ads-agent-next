import { GoogleGenAI } from '@google/genai';
import { 
  GeminiMessage, 
  ProcessedResponse,
  GeminiFunctionCall,
  ModelConfig,
  SystemPromptConfig
} from '../types/gemini';
import { ConversationContext } from '../types/agent';
import { BUSINESS_CONTEXT } from './mockData';

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

interface GeminiRequestConfig {
  model: string;
  contents: GeminiContent[];
  systemInstruction: {
    role: string;
    parts: Array<{ text: string }>;
  };
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };
  tools?: Array<{
    functionDeclarations: FunctionDeclaration[];
  }>;
  toolConfig?: {
    functionCallingConfig: {
      mode: 'AUTO' | 'ANY' | 'NONE';
    };
  };
}

interface GeminiContent {
  role: string;
  parts: Array<{
    text?: string;
    functionCall?: GeminiFunctionCall;
    functionResponse?: {
      name: string;
      response: {
        result: unknown;
        success: boolean;
        error?: string;
      };
    };
  }>;
}

interface GeminiStreamConfig {
  model: string;
  contents: GeminiContent[];
  systemInstruction: {
    role: string;
    parts: Array<{ text: string }>;
  };
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
  tools?: Array<{
    functionDeclarations: FunctionDeclaration[];
  }>;
  toolConfig?: {
    functionCallingConfig: {
      mode: 'AUTO' | 'ANY' | 'NONE';
    };
  };
}

interface GeminiAPIResponse {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        functionCall?: {
          name?: string;
          args?: Record<string, unknown>;
        };
      }>;
    };
  }>;
}

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string;
  private config: ModelConfig;

  constructor(apiKey: string) {
    console.log('Creating GeminiService with API key:', apiKey.slice(0, 10) + '...');
    try {
      // Use the new @google/genai SDK
      this.ai = new GoogleGenAI({
        apiKey: apiKey
      });
      this.model = 'gemini-2.5-flash';
      this.config = {
        model: this.model,
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40
      };
      console.log('GeminiService created successfully');
    } catch (error) {
      console.error('Error creating GeminiService:', error);
      throw error;
    }
  }

  async generateResponse(
    messages: GeminiMessage[], 
    context: ConversationContext,
    functions?: FunctionDeclaration[]
  ): Promise<ProcessedResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Build the request configuration
      const requestConfig: GeminiRequestConfig = {
        model: this.model,
        contents: this.formatMessagesForGemini(messages),
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
          topP: this.config.topP,
          topK: this.config.topK
        }
      };

      // Add tools if functions are provided
      if (functions && functions.length > 0) {
        requestConfig.tools = [{
          functionDeclarations: functions
        }];
        // CRITICAL: Force the model to call functions when available
        requestConfig.toolConfig = {
          functionCallingConfig: {
            mode: 'ANY'
          }
        };
      }

      console.log('Sending request to Gemini API with config:', {
        model: requestConfig.model,
        messageCount: requestConfig.contents.length,
        hasSystemInstruction: !!requestConfig.systemInstruction,
        hasTools: !!requestConfig.tools,
        toolCount: requestConfig.tools?.[0]?.functionDeclarations?.length || 0,
        functionCallingMode: requestConfig.toolConfig?.functionCallingConfig?.mode || 'NONE'
      });

      // Type assertion for the Gemini API call
      const result = await this.ai.models.generateContent(requestConfig as unknown as Parameters<typeof this.ai.models.generateContent>[0]);
      
      console.log('Received response from Gemini API:', {
        hasText: !!result.text,
        textLength: result.text?.length || 0
      });

      // Extract function calls if present
      const functionCalls: GeminiFunctionCall[] = [];
      
      // Check for function calls in the response
      if (result.candidates && result.candidates[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.functionCall && part.functionCall.name) {
            functionCalls.push({
              name: part.functionCall.name,
              args: (part.functionCall.args as Record<string, unknown>) || {}
            });
          }
        }
      }

      const text = result.text || '';
      const processingTime = Date.now() - startTime;

      console.log('Processed response:', {
        textLength: text.length,
        functionCallsCount: functionCalls.length,
        processingTime
      });

      return {
        text,
        functionCalls,
        needsFollowUp: functionCalls.length > 0,
        confidence: this.calculateConfidence(result),
        responseType: functionCalls.length > 0 ? 'function_call' : text ? 'text' : 'mixed',
        metadata: {
          processingTime,
          modelUsed: this.model,
          tokensUsed: this.estimateTokenUsage(messages, text)
        }
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStreamingResponse(
    messages: GeminiMessage[],
    context: ConversationContext,
    functions?: FunctionDeclaration[]
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const systemPrompt = this.buildSystemPrompt(context);
    
    const requestConfig: GeminiStreamConfig = {
      model: this.model,
      contents: this.formatMessagesForGemini(messages),
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens
      }
    };

    if (functions && functions.length > 0) {
      requestConfig.tools = [{
        functionDeclarations: functions
      }];
      // CRITICAL: Force the model to call functions when available
      requestConfig.toolConfig = {
        functionCallingConfig: {
          mode: 'ANY'
        }
      };
    }
    
    // Type assertion for the Gemini API call
    const result = await this.ai.models.generateContentStream(requestConfig as unknown as Parameters<typeof this.ai.models.generateContentStream>[0]);

    async function* streamGenerator() {
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          yield chunkText;
        }
      }
    }

    return streamGenerator();
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const config: SystemPromptConfig = {
      basePersonality: `You are an expert Google Ads manager for ${BUSINESS_CONTEXT.companyName}, a ${BUSINESS_CONTEXT.industry} business.`,
      businessContext: this.formatBusinessContext(),
      availableFunctions: this.formatAvailableFunctions(),
      responseStyle: this.getResponseStyleGuidelines(),
      urgencyLevel: this.getUrgencyGuidelines(),
      expertiseLevel: this.getExpertiseGuidelines()
    };

    // Safely handle context properties that might be undefined
    const conversationHistory = context.conversationHistory || [];
    const mentionedCampaigns = context.mentionedCampaigns || [];
    const userPreferences = context.userPreferences;
    const actionsTaken = context.actionsTaken || [];

    // Format user preferences object into readable string
    const formatUserPreferences = (prefs: typeof userPreferences) => {
      if (!prefs) return 'Standard analysis';
      const prefStrings = [];
      if (prefs.communicationStyle) prefStrings.push(`Communication: ${prefs.communicationStyle}`);
      if (prefs.dataVisualizationPreference) prefStrings.push(`Visualization: ${prefs.dataVisualizationPreference}`);
      if (prefs.notificationLevel) prefStrings.push(`Notifications: ${prefs.notificationLevel}`);
      if (prefs.preferredMetrics && Array.isArray(prefs.preferredMetrics)) prefStrings.push(`Metrics: ${prefs.preferredMetrics.join(', ')}`);
      return prefStrings.length > 0 ? prefStrings.join('; ') : 'Standard analysis';
    };

    return `${config.basePersonality}

BUSINESS CONTEXT:
${config.businessContext}

CONVERSATION CONTEXT:
- Previous queries discussed: ${conversationHistory.length > 0 ? 
  conversationHistory.slice(-3).map(msg => msg.role === 'user' ? 'User asked about: ' + msg.parts[0].text?.slice(0, 100) : '').filter(Boolean).join(', ') : 'None'}
- Recently mentioned campaigns: ${mentionedCampaigns.join(', ') || 'None'}
- User preferences: ${formatUserPreferences(userPreferences)}
- Actions taken this session: ${actionsTaken.join(', ') || 'None'}

${config.availableFunctions}

RESPONSE GUIDELINES:
${config.responseStyle}

URGENCY CONTEXT:
${config.urgencyLevel}

EXPERTISE LEVEL:
${config.expertiseLevel}

CRITICAL INSTRUCTIONS:
- You MUST call the appropriate functions for ANY campaign-related questions
- When user asks "How is my Performance Max campaign doing?" - IMMEDIATELY call getCampaigns function
- When user asks about "campaigns", "performance", "budget", "optimization" - CALL FUNCTIONS FIRST
- You have access to real StylePlus campaign data through functions - USE IT
- NEVER say "I don't have access" or ask users for data you can get from functions
- Always start with function calls, then provide analysis based on the actual data
- Use this pattern: [CALL FUNCTIONS IMMEDIATELY] → [ANALYZE REAL DATA] → [STRATEGIC RECOMMENDATIONS]
- Act like "Wolfy Campaign Strategist" - strategic, data-driven, action-oriented
- End with specific next steps based on actual performance data`;
  }

  private formatBusinessContext(): string {
    return `
- Industry: ${BUSINESS_CONTEXT.industry}
- Company: ${BUSINESS_CONTEXT.companyName}
- Current Season: ${BUSINESS_CONTEXT.seasonality} (URGENT - Limited time remaining!)
- Target ROAS: ${BUSINESS_CONTEXT.targetROAS}x
- Average Order Value: $${BUSINESS_CONTEXT.avgOrderValue}
- Target CPA: $${BUSINESS_CONTEXT.targetCPA}
- Key Competitors: ${BUSINESS_CONTEXT.competitors.join(', ')}

CURRENT URGENT ISSUES:
${BUSINESS_CONTEXT.urgentIssues.map(issue => `• ${issue}`).join('\n')}

BUSINESS GOALS:
${BUSINESS_CONTEXT.businessGoals.map(goal => `• ${goal}`).join('\n')}`;
  }

  private formatAvailableFunctions(): string {
    return `
AVAILABLE FUNCTIONS - YOU MUST USE THESE:
- getCampaigns: Get all campaign performance data - CALL THIS FOR ANY CAMPAIGN QUESTIONS
- analyzeCampaignPerformance: Deep dive analysis - USE AFTER getCampaigns
- getOptimizationPlan: Generate optimization recommendations
- proposeBudgetChange: Calculate budget modification impacts
- executeCampaignAction: Make campaign changes
- getCompetitorInsights: Competitive analysis
- generatePerformanceReport: Comprehensive reports

MANDATORY FUNCTION USAGE - NO EXCEPTIONS:
1. User asks "How is my Performance Max doing?" → IMMEDIATELY call getCampaigns
2. User asks about "campaigns", "performance", "budget" → IMMEDIATELY call getCampaigns
3. User asks "should I increase budget" → call getCampaigns AND proposeBudgetChange
4. User asks about "competitors" → call getCompetitorInsights
5. You HAVE access to StylePlus campaign data - NEVER claim you don't
6. ALWAYS call functions first, then analyze the real data

FUNCTION CALLING IS MANDATORY - NO GENERIC RESPONSES ALLOWED
When user asks campaign questions, you MUST call the appropriate functions immediately.`;
  }

  private getResponseStyleGuidelines(): string {
    return `
RESPONSE STRUCTURE (MANDATORY):
1. **IMMEDIATELY CALL FUNCTIONS** when user asks about campaigns/performance/budget
2. **ANALYZE THE REAL DATA** from function results
3. **PROVIDE STRATEGIC INSIGHTS** based on actual StylePlus performance
4. **GIVE SPECIFIC RECOMMENDATIONS** with concrete next steps

TONE: Strategic consultant who has access to live campaign data (because you do via functions)

CRITICAL: NEVER say "I don't have access to your Google Ads account" - you DO have access via functions.
Always use real StylePlus campaign data from function calls.`;
  }

  private getUrgencyGuidelines(): string {
    return `
- Q4 Holiday Peak: Only days remaining in peak shopping season
- Revenue urgency: Every day of delay costs potential revenue
- Competitor pressure: Fashion industry is highly competitive during holidays
- Seasonality factor: Fashion e-commerce sees 40% higher conversion rates in final week
- Budget optimization: Paused campaigns represent missed opportunities
- Performance Max: Ready to scale immediately for maximum holiday impact`;
  }

  private getExpertiseGuidelines(): string {
    return `
- Provide expert-level Google Ads knowledge
- Understand fashion e-commerce seasonality and trends
- Calculate ROI and impact with precision
- Recognize optimization opportunities immediately
- Understand the urgency of Q4 holiday timing
- Provide strategic thinking beyond basic optimization
- Consider mobile vs desktop performance differences
- Factor in competitor activity and market conditions`;
  }

  private formatMessagesForGemini(messages: GeminiMessage[]): GeminiContent[] {
    return messages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts.map(part => {
        if (part.text) {
          return { text: part.text };
        }
        if (part.functionCall) {
          return { 
            functionCall: {
              name: part.functionCall.name,
              args: part.functionCall.args
            }
          };
        }
        if (part.functionResponse) {
          return {
            functionResponse: {
              name: part.functionResponse.name,
              response: part.functionResponse.response
            }
          };
        }
        return part as {
          text?: string;
          functionCall?: GeminiFunctionCall;
          functionResponse?: {
            name: string;
            response: {
              result: unknown;
              success: boolean;
              error?: string;
            };
          };
        };
      })
    }));  
  }

  private calculateConfidence(response: GeminiAPIResponse): number {
    // Simple confidence calculation based on response characteristics
    const text = response.text || '';
    const hasSpecificData = text.includes('$') || text.includes('%');
    const hasRecommendations = text.toLowerCase().includes('recommend') || 
                              text.toLowerCase().includes('suggest');
    const hasFunctionCalls = response.candidates?.[0]?.content?.parts?.some((part) => part.functionCall);
    
    let confidence = 0.5; // Base confidence
    
    if (hasSpecificData) confidence += 0.2;
    if (hasRecommendations) confidence += 0.2;
    if (hasFunctionCalls) confidence += 0.3;
    
    return Math.min(confidence, 1.0);
  }

  private estimateTokenUsage(messages: GeminiMessage[], response: string): number {
    // Rough token estimation (1 token ≈ 4 characters)
    const inputText = messages.map(msg => 
      msg.parts.map(part => part.text || '').join('')
    ).join('');
    
    const totalChars = inputText.length + response.length;
    return Math.ceil(totalChars / 4);
  }

  // Update conversation context based on new messages
  updateContext(
    context: ConversationContext, 
    userMessage: string, 
    assistantResponse: string,
    functionCalls?: GeminiFunctionCall[]
  ): ConversationContext {
    const updatedContext = { ...context };
    
    // Ensure arrays exist
    if (!updatedContext.conversationHistory) {
      updatedContext.conversationHistory = [];
    }
    if (!updatedContext.mentionedCampaigns) {
      updatedContext.mentionedCampaigns = [];
    }
    if (!updatedContext.actionsTaken) {
      updatedContext.actionsTaken = [];
    }
    if (!updatedContext.previousQueries) {
      updatedContext.previousQueries = [];
    }
    if (!updatedContext.businessGoals) {
      updatedContext.businessGoals = [];
    }
    
    // Add to conversation history
    updatedContext.conversationHistory.push(
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: [{ text: assistantResponse }] }
    );
    
    // Keep only last 10 messages to avoid token limits
    if (updatedContext.conversationHistory.length > 10) {
      updatedContext.conversationHistory = updatedContext.conversationHistory.slice(-10);
    }
    
    // Extract and store mentioned campaigns
    const campaignMentions = this.extractCampaignMentions(userMessage + ' ' + assistantResponse);
    updatedContext.mentionedCampaigns = [
      ...new Set([...updatedContext.mentionedCampaigns, ...campaignMentions])
    ].slice(-5); // Keep last 5 mentioned campaigns
    
    // Track function calls as actions taken
    if (functionCalls && functionCalls.length > 0) {
      const actions = functionCalls.map(call => `${call.name}(${Object.keys(call.args).join(', ')})`);
      updatedContext.actionsTaken = [...updatedContext.actionsTaken, ...actions].slice(-10);
    }
    
    // Extract user preferences from conversation and update the preferences object
    const newPreferences = this.extractUserPreferences(userMessage);
    if (Object.keys(newPreferences).length > 0) {
      updatedContext.userPreferences = {
        ...updatedContext.userPreferences,
        ...newPreferences
      };
    }
    
    return updatedContext;
  }

  private extractCampaignMentions(text: string): string[] {
    const campaignKeywords = [
      'Performance Max', 'Brand Awareness', 'Display Retargeting', 
      'Competitor Targeting', 'Shopping', 'Holiday Fashion', 'Winter Collection'
    ];
    
    return campaignKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private extractUserPreferences(userMessage: string): Partial<ConversationContext['userPreferences']> {
    const preferences: Partial<ConversationContext['userPreferences']> = {};
    const lowerMessage = userMessage.toLowerCase();
    
    // Extract communication style preferences
    if (lowerMessage.includes('quick') || lowerMessage.includes('summary') || lowerMessage.includes('brief')) {
      preferences.communicationStyle = 'concise';
    } else if (lowerMessage.includes('detail') || lowerMessage.includes('explain') || lowerMessage.includes('thorough')) {
      preferences.communicationStyle = 'detailed';
    } else if (lowerMessage.includes('technical') || lowerMessage.includes('deep dive')) {
      preferences.communicationStyle = 'technical';
    }
    
    // Extract visualization preferences
    if (lowerMessage.includes('chart') || lowerMessage.includes('graph')) {
      preferences.dataVisualizationPreference = 'charts';
    } else if (lowerMessage.includes('table') || lowerMessage.includes('spreadsheet')) {
      preferences.dataVisualizationPreference = 'tables';
    } else if (lowerMessage.includes('card') || lowerMessage.includes('summary card')) {
      preferences.dataVisualizationPreference = 'cards';
    }
    
    // Extract notification level preferences
    if (lowerMessage.includes('urgent') || lowerMessage.includes('critical') || lowerMessage.includes('immediate')) {
      preferences.notificationLevel = 'critical-only';
    } else if (lowerMessage.includes('all') || lowerMessage.includes('everything')) {
      preferences.notificationLevel = 'all';
    } else if (lowerMessage.includes('minimal') || lowerMessage.includes('less')) {
      preferences.notificationLevel = 'minimal';
    }
    
    return preferences;
  }

  // Validate connection by testing with a simple request
  async validateConnection(): Promise<boolean> {
    try {
      console.log('Validating connection to Gemini API...');
      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
      } as unknown as Parameters<typeof this.ai.models.generateContent>[0]);
      const hasResponse = !!(result && result.text);
      console.log('Connection validation result:', hasResponse);
      return hasResponse;
    } catch (error) {
      console.error('Connection validation failed:', error);
      return false;
    }
  }

  // Get model capabilities and limits
  getModelInfo(): ModelConfig {
    return this.config;
  }

  // Update model configuration
  updateConfig(newConfig: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Cleanup method for long-running sessions
  cleanup(): void {
    // Cleanup any resources if needed
  }
}