'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bot, 
  User, 
  Zap, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Loader2
} from 'lucide-react';

import { ChatMessage } from '@/types/agent';

interface ChatMessageProps {
  message: ChatMessage;
  onActionClick?: (action: string, messageId: string) => void;
  onRetry?: (messageId: string) => void;
  isLatest?: boolean;
}

export default function ChatMessageComponent({ 
  message, 
  onActionClick, 
  onRetry,
}: ChatMessageProps) {
  const handleActionClick = (action: string) => {
    if (onActionClick) {
      onActionClick(action, message.id);
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Format bold text
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <div key={index} className="font-semibold text-base mb-2 mt-3 first:mt-0">
            {line.replace(/\*\*/g, '')}
          </div>
        );
      }
      // Format bullet points
      if (line.startsWith('*')) {
        return (
          <div key={index} className="ml-4 mb-1">
            <span className="text-primary mr-2">•</span>
            {line.substring(1).trim()}
          </div>
        );
      }
      // Regular text
      if (line.trim()) {
        return (
          <div key={index} className="mb-2">
            {line}
          </div>
        );
      }
      return <div key={index} className="h-2" />;
    });
  };

  const getRecommendationIcon = (level?: 'low' | 'medium' | 'high' | 'critical') => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <Zap className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getFunctionStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'pending':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      default:
        return <div className="w-2 h-2 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3 max-w-4xl w-full`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            message.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
          <div className={`${
            message.role === 'assistant' 
              ? 'bg-card border rounded-lg p-4' 
              : 'bg-primary text-primary-foreground rounded-lg p-3 ml-auto max-w-2xl'
          }`}>
            {/* Message Header (for assistant) */}
            {message.role === 'assistant' && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Google Ads AI</span>
                  {getRecommendationIcon(message.metadata?.recommendationLevel)}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {message.metadata?.responseTime && (
                    <span>{message.metadata.responseTime}ms</span>
                  )}
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            {/* Message Text */}
            <div className={`whitespace-pre-wrap ${message.role === 'assistant' ? 'text-sm' : 'text-sm'}`}>
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none">
                  {formatMessageContent(message.content)}
                </div>
              ) : (
                message.content
              )}
            </div>

            {/* Function Calls Display */}
            {message.functionCalls && message.functionCalls.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-muted-foreground">Function Calls:</div>
                {message.functionCalls.map((call, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    {getFunctionStatusIcon(call.status)}
                    <span className="font-mono">{call.name}</span>
                    {call.executionTime && (
                      <span className="text-muted-foreground">({call.executionTime}ms)</span>
                    )}
                    {call.error && (
                      <span className="text-red-600">Error: {call.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {message.actionButtons && message.actionButtons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.actionButtons.map((button) => (
                  <Button
                    key={button.id}
                    variant={button.variant}
                    size={button.size}
                    disabled={button.disabled}
                    onClick={() => handleActionClick(button.action)}
                    className="text-xs"
                  >
                    {button.loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {button.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Data Visualization */}
            {message.dataVisualization && (
              <div className="mt-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs font-medium mb-2">
                      {message.dataVisualization.config?.title || 'Data Visualization'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {message.dataVisualization.type} • {message.dataVisualization.config?.timeframe || 'Current'}
                    </div>
                    {/* Add actual visualization components here based on type */}
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      Visualization data available ({message.dataVisualization.type})
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Metadata (for assistant) */}
            {message.role === 'assistant' && message.metadata && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs text-muted-foreground">
                <div className="flex items-center space-x-3">
                  {message.metadata.confidence && (
                    <span>Confidence: {Math.round(message.metadata.confidence * 100)}%</span>
                  )}
                  {message.metadata.functionCallsCount && message.metadata.functionCallsCount > 0 && (
                    <span>Functions: {message.metadata.functionCallsCount}</span>
                  )}
                  {message.metadata.tokensUsed && (
                    <span>Tokens: {message.metadata.tokensUsed}</span>
                  )}
                  {message.metadata.dataSourcesUsed && message.metadata.dataSourcesUsed.length > 0 && (
                    <span>Sources: {message.metadata.dataSourcesUsed.length}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(message.id)}
                      className="text-xs h-6 px-2"
                    >
                      Retry
                    </Button>
                  )}
                  <Clock className="h-3 w-3" />
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            {/* User message timestamp */}
            {message.role === 'user' && (
              <div className="mt-2 text-xs opacity-75">
                {message.timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}