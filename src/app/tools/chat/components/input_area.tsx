import React from "react";
import { Send } from "lucide-react";
import Token_usage_display from "./token_usage_display";

interface input_area_props {
  input: string;
  loading: boolean;
  plan: string;
  text_area_ref: React.RefObject<HTMLTextAreaElement>;
  set_input: (value: string) => void;
  handle_submit: (e: React.FormEvent) => Promise<void>;
  handle_key_down: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function input_area({
  input,
  loading,
  plan,
  text_area_ref,
  set_input,
  handle_submit,
  handle_key_down
}: input_area_props) {
  return (
    <form onSubmit={handle_submit} className="p-4 border-t bg-base-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <textarea
            ref={text_area_ref}
            value={input}
            onChange={(e) => set_input(e.target.value)}
            onKeyDown={handle_key_down}
            placeholder="Type your message..."
            className="textarea textarea-bordered flex-1 resize-none"
            rows={2}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-base-content/60 mt-2 flex justify-between items-center">
          <span>
            {plan === "free" ? "10 messages/minute" : "60 messages/minute"} • 1 MP per 3000 tokens (min 1 MP)
          </span>
          <Token_usage_display input={input} show_details={true} />
        </div>
      </div>
    </form>
  );
}