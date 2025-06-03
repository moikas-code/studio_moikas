"use client";
import React from 'react';
import type { ChatMessage } from '@/types/session';

interface MessageDisplayProps {
  messages: ChatMessage[];
  loading?: boolean;
}

export default function MessageDisplay({ messages, loading }: MessageDisplayProps) {
  const format_time = (date_string: string) => {
    return new Date(date_string).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="max-w-md">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-base-content/60 text-sm">
            Start a conversation by uploading a file or entering a topic below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`
            flex gap-3
            ${message.role === 'user' ? 'justify-end' : 'justify-start'}
          `}
        >
          <div
            className={`
              max-w-[80%] rounded-lg p-4
              ${message.role === 'user' 
                ? 'bg-primary text-primary-content' 
                : 'bg-base-200'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${message.role === 'user' 
                  ? 'bg-primary-content/20 text-primary-content' 
                  : 'bg-primary/20 text-primary'
                }
              `}>
                {message.role === 'user' ? 'U' : 'AI'}
              </div>
              <span className={`
                text-xs 
                ${message.role === 'user' ? 'text-primary-content/70' : 'text-base-content/60'}
              `}>
                {format_time(message.created_at)}
              </span>
              {message.metadata?.feature && typeof message.metadata.feature === 'string' ? (
                <span className={`
                  text-xs px-2 py-1 rounded-full
                  ${message.role === 'user' 
                    ? 'bg-primary-content/20 text-primary-content' 
                    : 'bg-primary/20 text-primary'
                  }
                `}>
                  {(message.metadata.feature as string).replace('_', ' ')}
                </span>
              ) : null}
            </div>
            
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {message.content}
              </pre>
            </div>

            {/* File info */}
            {message.metadata?.file_name && (
              <div className={`
                mt-2 text-xs p-2 rounded
                ${message.role === 'user' 
                  ? 'bg-primary-content/20 text-primary-content' 
                  : 'bg-base-300 text-base-content/70'
                }
              `}>
                📄 {message.metadata.file_name}
              </div>
            )}

            {/* Token usage */}
            {message.metadata?.tokens_used && (
              <div className={`
                mt-2 text-xs
                ${message.role === 'user' ? 'text-primary-content/70' : 'text-base-content/50'}
              `}>
                {message.metadata.tokens_used} tokens used
              </div>
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-start">
          <div className="bg-base-200 rounded-lg p-4 flex items-center gap-2">
            <span className="loading loading-dots loading-sm"></span>
            <span className="text-sm text-base-content/60">AI is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
}