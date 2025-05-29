"use client";
import React, { useState } from "react";

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

  const handle_file_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      set_file(e.target.files[0]);
    }
  };

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_loading(true);
    set_error("");
    set_result("");
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
      if (!res.ok) {
        set_error(data.error || "Error processing file.");
      } else {
        set_result(data.result);
      }
    } catch {
      set_error("Network error");
    } finally {
      set_loading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold mb-2 text-center">Turn Knowledge Into Content.</h1>
      <p className="text-lg text-center mb-8 text-gray-600 dark:text-gray-300">
        Generate scripts, product descriptions, video descriptions, tweets, bios, summaries, outlines, and quizzes from any PDF, website, or topic. Our AI helps you create and learn effectively.
      </p>
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
                onClick={() => set_file(null)}
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
          disabled={loading}
        >
          {loading ? "Processing..." : "✨ Generate"}
        </button>
      </form>
      {error && <div className="text-error mt-4 text-center">{error}</div>}
      {result && (
        <div className="mt-6 p-4 bg-base-100 border border-base-300 rounded">
          <h2 className="font-semibold mb-2">Result</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
} 