"use client";
import React, { useContext } from "react";
import { MpContext } from "@/context/mp_context";
import { Zap } from "lucide-react";

interface CompactTokenDisplayProps {
  show_breakdown?: boolean;
  className?: string;
}

function CompactTokenDisplay({ 
  show_breakdown = false,
  className = ""
}: CompactTokenDisplayProps) {
  const { mp_tokens, renewable_tokens, permanent_tokens, is_loading_tokens, token_error } = useContext(MpContext);

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      <Zap className="w-3 h-3 text-primary" />
      {is_loading_tokens ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : token_error ? (
        <span className="text-error">Error</span>
      ) : (
        <div className="flex items-center gap-1">
          <span className="font-mono font-medium">{mp_tokens}</span>
          {show_breakdown && (
            <span className="text-xs text-base-content/60">
              ({renewable_tokens}r + {permanent_tokens}p)
            </span>
          )}
          <span className="text-xs text-base-content/60">MP</span>
        </div>
      )}
    </div>
  );
}

export default CompactTokenDisplay;