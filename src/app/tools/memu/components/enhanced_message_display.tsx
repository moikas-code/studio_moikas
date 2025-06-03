"use client";

import React, { useState } from "react";
import { message } from "../types";
import MessageFormatter from "./message_formatter";
import { ChevronDown, ChevronRight, Brain, Target, CheckCircle, Info } from "lucide-react";

interface enhanced_message_display_props {
  message: message;
  show_debug_info?: boolean;
}

export function EnhancedMessageDisplay({ message, show_debug_info = false }: enhanced_message_display_props) {
  const [show_details, set_show_details] = useState(false);
  
  if (message.role === "user") {
    return (
      <div className="flex gap-3 p-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center text-sm font-medium">
          U
        </div>
        <div className="flex-1">
          <div className="bg-primary text-primary-content rounded-lg p-3 max-w-[80%] ml-auto">
            <MessageFormatter content={message.content} role={message.role} />
          </div>
          <div className="text-xs text-base-content/60 mt-1 text-right">
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  }

  const structured = message.structured_response;
  const has_structured_data = structured && (structured.thinking || structured.objectives || structured.summary);

  return (
    <div className="flex gap-3 p-4">
      <div className="flex-shrink-0 w-8 h-8 bg-secondary text-secondary-content rounded-full flex items-center justify-center text-sm font-medium">
        AI
      </div>
      <div className="flex-1">
        {/* Main Response */}
        <div className="bg-base-200 rounded-lg p-3">
          <MessageFormatter content={message.content} role={message.role} />
          
          {/* Response Type Badge */}
          {structured?.metadata?.response_type && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                structured.metadata.response_type === 'greeting' ? 'bg-green-100 text-green-800' :
                structured.metadata.response_type === 'question' ? 'bg-blue-100 text-blue-800' :
                structured.metadata.response_type === 'task' ? 'bg-purple-100 text-purple-800' :
                structured.metadata.response_type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {structured.metadata.response_type}
              </span>
            </div>
          )}

          {/* Confidence Indicator */}
          {structured?.confidence !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-base-content/60">Confidence:</span>
              <div className="flex-1 bg-base-300 rounded-full h-2 max-w-24">
                <div 
                  className={`h-2 rounded-full ${
                    structured.confidence >= 0.8 ? 'bg-success' :
                    structured.confidence >= 0.6 ? 'bg-warning' :
                    'bg-error'
                  }`}
                  style={{ width: `${(structured.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs text-base-content/60">
                {Math.round(structured.confidence * 100)}%
              </span>
            </div>
          )}

          {/* Suggested Actions */}
          {structured?.metadata?.suggested_actions && structured.metadata.suggested_actions.length > 0 && (
            <div className="mt-3 p-2 bg-info/10 rounded border-l-4 border-info">
              <div className="text-sm font-medium text-info-content mb-1">Suggestions:</div>
              <ul className="text-sm text-base-content/70 space-y-1">
                {structured.metadata.suggested_actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-info mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Debug Information Toggle */}
        {(show_debug_info && has_structured_data) && (
          <div className="mt-2">
            <button
              onClick={() => set_show_details(!show_details)}
              className="flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content transition-colors"
            >
              {show_details ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Debug Information
            </button>
            
            {show_details && (
              <div className="mt-2 space-y-3 text-sm">
                {/* AI Thinking Process */}
                {structured?.thinking && (
                  <div className="bg-base-300/50 rounded p-3">
                    <div className="flex items-center gap-2 mb-2 text-base-content/70">
                      <Brain className="w-4 h-4" />
                      <span className="font-medium">AI Thinking Process</span>
                    </div>
                    <div className="text-base-content/60 whitespace-pre-wrap">
                      {structured.thinking}
                    </div>
                  </div>
                )}

                {/* Identified Objectives */}
                {structured?.objectives && structured.objectives.length > 0 && (
                  <div className="bg-base-300/50 rounded p-3">
                    <div className="flex items-center gap-2 mb-2 text-base-content/70">
                      <Target className="w-4 h-4" />
                      <span className="font-medium">Identified Objectives</span>
                    </div>
                    <ul className="space-y-1">
                      {structured.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2 text-base-content/60">
                          <CheckCircle className="w-3 h-3 mt-1 flex-shrink-0 text-success" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Summary */}
                {structured?.summary && (
                  <div className="bg-base-300/50 rounded p-3">
                    <div className="flex items-center gap-2 mb-2 text-base-content/70">
                      <Info className="w-4 h-4" />
                      <span className="font-medium">Summary</span>
                    </div>
                    <div className="text-base-content/60">
                      {structured.summary}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-base-content/60 mt-1">
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}