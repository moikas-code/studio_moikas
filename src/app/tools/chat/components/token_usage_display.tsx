import React, { useState } from "react";
import { Info, Zap } from "lucide-react";
import { use_token_estimation } from "@/lib/token_estimation";

interface token_usage_display_props {
  input: string;
  show_details?: boolean;
}

export default function token_usage_display({ 
  input, 
  show_details = false 
}: token_usage_display_props) {
  const [show_tooltip, set_show_tooltip] = useState(false);
  const token_estimate = use_token_estimation(input);

  if (!input) return null;

  const get_cost_color = () => {
    if (token_estimate.estimated_cost <= 1) return "text-success";
    if (token_estimate.estimated_cost <= 5) return "text-warning";
    return "text-error";
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 ${get_cost_color()}`}>
        <Zap className="w-3 h-3" />
        <span className="text-xs font-medium">
          {token_estimate.formatted_estimate}
        </span>
      </div>

      {show_details && (
        <div className="relative">
          <button
            onMouseEnter={() => set_show_tooltip(true)}
            onMouseLeave={() => set_show_tooltip(false)}
            className="btn btn-ghost btn-xs p-0 w-4 h-4"
          >
            <Info className="w-3 h-3" />
          </button>

          {show_tooltip && (
            <div className="absolute bottom-full right-0 mb-2 p-2 bg-base-100 border border-base-300 rounded-lg shadow-lg text-xs whitespace-nowrap z-10">
              <div className="space-y-1">
                <div>Characters: {token_estimate.character_count.toLocaleString()}</div>
                <div>Words: {token_estimate.word_count.toLocaleString()}</div>
                <div>Est. Tokens: ~{token_estimate.estimated_tokens.toLocaleString()}</div>
                <div>Cost: {token_estimate.estimated_cost} MP</div>
              </div>
              <div className="text-xs text-base-content/60 mt-1 pt-1 border-t border-base-300">
                ~4 chars per token estimate
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 