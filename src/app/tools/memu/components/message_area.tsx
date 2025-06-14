import React from "react";
import Image from "next/image";
import { Bot, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { message } from "../types";
import MessageFormatter from "./message_formatter";

interface MessageAreaProps {
  messages: message[];
  loading: boolean;
  selected_workflow: string | null;
  messages_end_ref: React.RefObject<HTMLDivElement>;
}

function MessageArea({ 
  messages, 
  loading, 
  selected_workflow,
  messages_end_ref 
}: MessageAreaProps) {
  const { user } = useUser();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-base-content/60">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm mt-2">
              {selected_workflow 
                ? "Using custom workflow"
                : "Ask anything or create a workflow to get started"}
            </p>
          </div>
        )}
        
        {messages.map(message => (
          <div
            key={message.id}
            className={`chat ${message.role === "user" ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-image avatar">
              <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center overflow-hidden relative">
                {message.role === "user" ? (
                  user?.hasImage ? (
                    <Image 
                      src={user.imageUrl} 
                      alt={user.fullName || user.firstName || "User"} 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )
                ) : (
                  <Bot className="w-6 h-6" />
                )}
              </div>
            </div>
            <div className={`chat-bubble ${message.role === "user" ? "chat-bubble-primary" : ""} ${message.role === "assistant" ? "max-w-none" : ""}`}>
              <MessageFormatter content={message.content} role={message.role} />
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="w-10 rounded-full bg-base-300 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
            </div>
            <div className="chat-bubble">
              <span className="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}
        
        <div ref={messages_end_ref} />
      </div>
    </div>
  );
}

export default MessageArea;