"use client";
import React, { useState, useContext } from "react";
import { MpContext } from "../../../context/mp_context";
import { MoreVertical } from "lucide-react";
import jsPDF from "jspdf";
import { use_complete_token_estimation, feature_type } from "@/lib/token_estimation";
import Compact_token_display from "@/components/CompactTokenDisplay";

const FEATURES = [
  { value: "script", label: "Generate Script" },
  { value: "product_description", label: "Product Description" },
  { value: "video_description", label: "Video Description" },
  { value: "tweet", label: "Generate Tweets" },
  { value: "profile_bio", label: "Profile Bio" },
  { value: "summary", label: "Create Summary" },
  { value: "test", label: "Create Test" },
  { value: "outline", label: "Create Outline" },
];

export default function Text_analyzer_page() {
  const [file, set_file] = useState<File | null>(null);
  const [feature, set_feature] = useState<string>(FEATURES[0].value);
  const [result, set_result] = useState<string>("");
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");
  const [link_or_topic, set_link_or_topic] = useState("");
  const [out_of_tokens, set_out_of_tokens] = useState(false);
  const [file_content, set_file_content] = useState<string>("");
  const { refresh_mp } = useContext(MpContext);

  // Get content for token estimation
  const get_content_for_estimation = () => {
    if (file_content) return file_content;
    if (link_or_topic) return link_or_topic;
    return "";
  };

  // Use complete token estimation hook (input + output)
  const token_estimate = use_complete_token_estimation(
    get_content_for_estimation(), 
    feature as feature_type
  );

  const handle_file_change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected_file = e.target.files[0];
      set_file(selected_file);
      
      // Read file content for token estimation
      if (selected_file.type === "text/plain") {
        try {
          const content = await selected_file.text();
          set_file_content(content);
        } catch (error) {
          console.error("Error reading file:", error);
          set_file_content("");
        }
      } else {
        // For PDF files, we can't read the content directly for estimation
        // Use a fallback estimation based on file size
        const estimated_content = "PDF file content estimation - approximately " + Math.floor(selected_file.size / 5) + " characters";
        set_file_content(estimated_content);
      }
    }
  };

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_loading(true);
    set_error("");
    set_result("");
    set_out_of_tokens(false);
    if (!file && !link_or_topic) {
      set_error("Please select a file or enter a topic/link.");
      set_loading(false);
      return;
    }
    const form_data = new FormData();
    if (file) form_data.append("file", file);
    form_data.append("feature", feature);
    if (link_or_topic) form_data.append("link_or_topic", link_or_topic);
    try {
      const res = await fetch("/api/text-analyzer", {
        method: "POST",
        body: form_data,
      });
      const data = await res.json();
      await refresh_mp();
      if (!res.ok) {
        if (res.status === 402) {
          set_error("You have run out of tokens. Please buy more to continue using this feature.");
          set_out_of_tokens(true);
        } else {
          set_error(data.error || "Error processing file.");
        }
      } else {
        set_result(data.result);
      }
    } catch {
      set_error("Network error");
    } finally {
      set_loading(false);
    }
  };

  // Download handlers
  const handle_download_text = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "text-analyzer-result.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handle_download_md = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "text-analyzer-result.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handle_download_pdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(result, 180);
    doc.text(lines, 10, 10);
    doc.save("text-analyzer-result.pdf");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="navbar min-h-12 bg-base-100 border-b">
        <div className="flex-1">
          <h1 className="text-lg font-bold">Text Analyzer</h1>
        </div>
        <div className="flex-none flex items-center gap-3">
          {/* Compact token display */}
          <Compact_token_display className="hidden sm:flex" />
          
          {/* Dropdown menu for better mobile experience */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-square btn-ghost btn-sm">
              <MoreVertical className="w-4 h-4" />
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-2 shadow">
              {/* Show token info in dropdown on mobile */}
              <li className="sm:hidden mb-2">
                <div className="px-2 py-1">
                  <Compact_token_display show_breakdown={true} />
                </div>
              </li>
              <li>
                <a href="/tools" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Tools
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto py-10 px-4">
          <p className="text-lg text-center mb-8 text-gray-600 dark:text-gray-300">
            Generate scripts, product descriptions, video descriptions, tweets, bios, summaries, outlines, and quizzes from any PDF, website, or topic. Our AI helps you create and learn effectively.
          </p>
          
          {out_of_tokens && (
            <div className="alert alert-error mb-4 text-center">
              You have run out of tokens. <a href="/buy-tokens" className="underline text-primary">Buy more tokens</a> to continue using this feature.
            </div>
          )}
          <form onSubmit={handle_submit} className="flex flex-col gap-4 items-center">
            <div className="w-full bg-gradient-to-br from-gray-50 to-blue-50 dark:from-base-200 dark:to-blue-900/10 border border-dashed border-blue-300 rounded-xl p-6 flex flex-col items-center mb-2">
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 mb-2">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><rect x="4" y="16" width="16" height="4" rx="2"/></svg>
                </div>
                <span className="font-medium text-blue-700 dark:text-blue-200">Upload a PDF or Text File</span>
                <span className="text-blue-500 underline">or Browse files</span>
                <input id="file-upload" type="file" accept=".txt, .pdf" onChange={handle_file_change} className="hidden" />
              </label>
              {file && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{file.name}</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline btn-error"
                    onClick={() => {
                      set_file(null);
                      set_file_content("");
                    }}
                    aria-label="Remove file"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div className="w-full flex items-center my-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-2 text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <input
              type="text"
              placeholder="Paste a link or write a topic"
              value={link_or_topic}
              onChange={e => set_link_or_topic(e.target.value)}
              className="input input-bordered w-full"
            />
            <select
              value={feature}
              onChange={e => set_feature(e.target.value)}
              className="select select-bordered w-full"
            >
              {FEATURES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn-primary w-full text-lg mt-2"
              disabled={loading || out_of_tokens}
            >
              {loading ? "Processing..." : `✨ Generate (${token_estimate.total_cost} MP)`}
            </button>
            
            {/* Token estimation display */}
            {(file || link_or_topic) && (
              <div className="text-xs text-base-content/60 mt-2 text-center">
                <div className="flex justify-center items-center gap-2 mb-1">
                  <span>📊 Total: {token_estimate.formatted_complete_estimate}</span>
                  <span>•</span>
                  <span>{token_estimate.character_count.toLocaleString()} chars</span>
                  <span>•</span>
                  <span>{token_estimate.word_count.toLocaleString()} words</span>
                </div>
                <div className="flex justify-center items-center gap-3 text-xs text-base-content/50">
                  <span>📥 Input: {token_estimate.breakdown.input}</span>
                  <span>📤 Output: {token_estimate.breakdown.output}</span>
                </div>
                <div className="text-xs text-base-content/40 mt-1">
                  Estimation: ~4 chars per token • Output varies by feature type
                </div>
              </div>
            )}
          </form>
          {error && <div className="text-error mt-4 text-center">{error}</div>}
          {result && (
            <div className="mt-6 p-4 bg-base-100 border border-base-300 rounded">
              <div className="flex flex-row gap-2 mb-4">
                <button className="btn btn-outline btn-sm" onClick={handle_download_pdf}>
                  Download as PDF
                </button>
                <button className="btn btn-outline btn-sm" onClick={handle_download_text}>
                  Download as Text
                </button>
                <button className="btn btn-outline btn-sm" onClick={handle_download_md}>
                  Download as Markdown
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 