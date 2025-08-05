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

interface GeminiApiRequest {
  model: string;
  contents: GeminiApiContent[];
  systemInstruction: {
    role: string;
    parts: Array<{ text: string }>;
  };
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP?: number;
    topK?: number;
  };
  tools?: Array<{
    functionDeclarations: FunctionDeclaration[];
  }>;
}

interface GeminiApiContent {
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

interface GeminiApiResponse {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        functionCall?: {
          name: string;
          args: Record<string, unknown>;
        };
      }>;
    };
  }>;
}

interface GeminiStreamChunk {
  text?: string;
}

interface GeminiApiSimpleRequest {
  model: string;
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
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
      const requestConfig: GeminiApiRequest = {
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
      }

      console.log('Sending request to Gemini API with config:', {
        model: requestConfig.model,
        messageCount: requestConfig.contents.length,
        hasSystemInstruction: !!requestConfig.systemInstruction,
        hasTools: !!requestConfig.tools,
        toolCount: requestConfig.tools?.[0]?.functionDeclarations?.length || 0
      });

      // Call the Gemini API with proper typing
      const result = await this.ai.models.generateContent(requestConfig) as GeminiApiResponse;
      
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
              args: part.functionCall.args || {}
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
    
    const requestConfig: GeminiApiRequest = {
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
    }
    
    // Call the streaming API with proper typing
    const result = await this.ai.models.generateContentStream(requestConfig) as AsyncIterable<GeminiStreamChunk>;

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
- Act like "Wolfy Campaign Strategist" - conversational, strategic, action-oriented
- ALWAYS call functions for data requests - never explain lack of access
- Use this response pattern: [Data] → [Strategic Insight] → [Next Actions with 2-3 options]
- Offer drill-down analysis: campaign → ad group → keyword → search term
- End with specific follow-ups: "Want me to check budget limits?" or "Should I audit settings?"
- Keep strategic tone: "Your Performance Max is crushing it" not "hypothetically this might perform well"`;
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
AVAILABLE FUNCTIONS & ORCHESTRATION:
- getCampaigns: Campaign-level performance data
- analyzeCampaignPerformance: Deep dive into specific campaigns
- getOptimizationPlan: Generate specific optimization recommendations
- proposeBudgetChange: Calculate budget modification impacts
- executeCampaignAction: Make campaign changes
- getCompetitorInsights: Competitive analysis
- generatePerformanceReport: Comprehensive reports

STRATEGIC ORCHESTRATION FLOW:
1. Campaign Performance → Root Cause Analysis
2. High/Low performers → Budget/bid optimization opportunities
3. Underperformers → Ad group/keyword/search term breakdown
4. Always offer next-level analysis: "Want me to check device breakdown?" or "Should I audit campaign settings?"

CRITICAL: Use functions immediately for ANY data request. Present results conversationally with strategic insights and follow-up options.`;
  }

  private getResponseStyleGuidelines(): string {
    return `
CONVERSATIONAL STYLE:
- Use a strategic, consultative tone like "Wolfy Campaign Strategist"
- Always call functions immediately for data requests - no disclaimers about access
- Present data in clear, scannable format with strategic insights
- End every response with 2-3 specific follow-up options

RESPONSE STRUCTURE:
1. **Data/Analysis** (from function calls)
2. **Strategic Insight** (key takeaway)
3. **Next Actions** (2-3 specific options)

ORCHESTRATION FLOW:
- Campaign issues → drill into ad groups → keywords → search terms
- Always offer to go deeper: "Want me to break down by device/keywords/asset groups?"
- Connect performance to root causes and actionable fixes

TONE EXAMPLES:
✅ "Your Performance Max is crushing it with 4.66% conversion rate"
✅ "Budget-limited campaigns are missing 23% impression share"
✅ "Should we audit these underperformers or scale the winners?"
❌ Academic explanations or hypothetical examples`;
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

  private formatMessagesForGemini(messages: GeminiMessage[]): GeminiApiContent[] {
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
        // Fallback for any other part structure
        return {
          text: '',
          functionCall: part.functionCall,
          functionResponse: part.functionResponse
        };
      })
    }));
  }

  private calculateConfidence(response: GeminiApiResponse): number {
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
      const requestConfig: GeminiApiSimpleRequest = {
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
      };
      
      const result = await this.ai.models.generateContent(requestConfig) as GeminiApiResponse;
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