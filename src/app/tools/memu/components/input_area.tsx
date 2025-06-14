import React from "react";
import { Send } from "lucide-react";
import TokenUsageDisplay from "./token_usage_display";
import Token_count_display from "@/components/TokenCountDisplay";

interface InputAreaProps {
  input: string;
  loading: boolean;
  plan: string | null;
  text_area_ref: React.RefObject<HTMLTextAreaElement>;
  set_input: (value: string) => void;
  handle_submit: (e: React.FormEvent) => Promise<void>;
  handle_key_down: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function InputArea({
  input,
  loading,
  plan,
  text_area_ref,
  set_input,
  handle_submit,
  handle_key_down
}: InputAreaProps) {
  return (
    <form onSubmit={(e) => {
      console.log("📤 Form onSubmit triggered");
      handle_submit(e);
    }} className="p-4 border-t bg-base-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <textarea
            ref={text_area_ref}
            value={input}
            onChange={(e) => {
              console.log("📝 Input changed:", e.target.value);
              set_input(e.target.value);
            }}
            onKeyDown={(e) => {
              console.log("⌨️ Key down in textarea:", e.key);
              handle_key_down(e);
            }}
            placeholder="Type your message..."
            className="textarea textarea-bordered flex-1 resize-none"
            rows={2}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
            onClick={() => console.log("🖱️ Button clicked")}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-base-content/60 mt-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>
              {plan === "free" ? "10 messages/minute" : "60 messages/minute"} • 1 MP per 3000 tokens (min 1 MP)
            </span>
            {/* Show detailed token info on mobile where header compact display is hidden */}
            <div className="sm:hidden">
              <Token_count_display />
            </div>
          </div>
          <TokenUsageDisplay input={input} show_details={true} />
        </div>
      </div>
    </form>
  );
}