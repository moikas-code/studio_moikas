import React from "react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface MessageFormatterProps {
  content: string;
  role: "user" | "assistant" | "system";
}

function MessageFormatter({ content, role }: MessageFormatterProps) {
  const [copied_blocks, set_copied_blocks] = useState<Set<number>>(new Set());

  const copy_to_clipboard = async (text: string, block_index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      set_copied_blocks(prev => new Set(prev).add(block_index));
      setTimeout(() => {
        set_copied_blocks(prev => {
          const new_set = new Set(prev);
          new_set.delete(block_index);
          return new_set;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const format_content = (text: string) => {
    const parts: React.ReactNode[] = [];
    let current_index = 0;
    let block_index = 0;

    // Regular expressions for different formatting
    const code_block_regex = /```(\w+)?\n([\s\S]*?)```/g;
    // Inline formatting patterns are handled in format_inline_text

    // Process code blocks first (they take precedence)
    let match;
    const processed_ranges: Array<{ start: number; end: number }> = [];

    // Find all code blocks
    code_block_regex.lastIndex = 0;
    while ((match = code_block_regex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      const language = match[1] || "text";
      const code = match[2];

      // Add text before code block
      if (start > current_index) {
        const before_text = text.slice(current_index, start);
        parts.push(
          <span key={`text-${current_index}`}>
            {format_inline_text(before_text)}
          </span>
        );
      }

      // Add code block with copy button
      parts.push(
        <div key={`code-${block_index}`} className="my-3 relative group">
          <div className="bg-base-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-base-300 border-b border-base-300">
              <span className="text-xs font-mono text-base-content/70">{language}</span>
              <button
                onClick={() => copy_to_clipboard(code, block_index)}
                className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy code"
              >
                {copied_blocks.has(block_index) ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono">{code}</code>
            </pre>
          </div>
        </div>
      );

      processed_ranges.push({ start, end });
      current_index = end;
      block_index++;
    }

    // Add remaining text after last code block
    if (current_index < text.length) {
      const remaining_text = text.slice(current_index);
      parts.push(
        <span key={`text-${current_index}`}>
          {format_inline_text(remaining_text)}
        </span>
      );
    }

    return parts;
  };

  const format_inline_text = (text: string) => {
    const parts: React.ReactNode[] = [];
    let current_index = 0;

    // Process inline formatting in order of precedence
    const patterns = [
      {
        regex: /`([^`]+)`/g,
        render: (match: string, content: string, key: string) => (
          <code key={key} className="bg-base-200 px-1.5 py-0.5 rounded text-sm font-mono">
            {content}
          </code>
        )
      },
      {
        regex: /\*\*(.*?)\*\*/g,
        render: (match: string, content: string, key: string) => (
          <strong key={key} className="font-semibold">{content}</strong>
        )
      },
      {
        regex: /\*(.*?)\*/g,
        render: (match: string, content: string, key: string) => (
          <em key={key} className="italic">{content}</em>
        )
      },
      {
        regex: /\[([^\]]+)\]\(([^)]+)\)/g,
        render: (match: string, link_text: string, key: string, url?: string) => (
          <a 
            key={key} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="link link-primary"
          >
            {link_text}
          </a>
        )
      }
    ];

    // Find all matches and sort by position
    const all_matches: Array<{
      start: number;
      end: number;
      match: string;
      groups: string[];
      pattern_index: number;
    }> = [];

    patterns.forEach((pattern, pattern_index) => {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        all_matches.push({
          start: match.index,
          end: match.index + match[0].length,
          match: match[0],
          groups: Array.from(match).slice(1),
          pattern_index
        });
      }
    });

    // Sort matches by start position
    all_matches.sort((a, b) => a.start - b.start);

    // Process matches without overlaps
    let key_counter = 0;
    for (const match of all_matches) {
      // Skip if this match overlaps with already processed text
      if (match.start < current_index) continue;

      // Add text before this match
      if (match.start > current_index) {
        const before_text = text.slice(current_index, match.start);
        parts.push(before_text);
      }

      // Add the formatted match
      const pattern = patterns[match.pattern_index];
      const formatted = pattern.render(
        match.match,
        match.groups[0],
        `inline-${key_counter++}`,
        match.groups[1] // For links (URL)
      );
      parts.push(formatted);

      current_index = match.end;
    }

    // Add remaining text
    if (current_index < text.length) {
      parts.push(text.slice(current_index));
    }

    return parts.length > 0 ? parts : text;
  };

  // For user messages, keep simple formatting
  if (role === "user") {
    return (
      <div className="whitespace-pre-wrap break-words">
        {content}
      </div>
    );
  }

  // For assistant messages, apply full markdown formatting
  return (
    <div className="prose prose-sm max-w-none break-words">
      {format_content(content)}
    </div>
  );
}

export default MessageFormatter;