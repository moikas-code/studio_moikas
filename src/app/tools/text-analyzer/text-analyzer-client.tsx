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

export default function TextAnalyzerClient() {
  const { mp_tokens, refresh_mp } = useContext(MpContext);
  const [feature, set_feature] = useState("summary");
  const [text, set_text] = useState("");
  const [result, set_result] = useState("");
  const [is_loading, set_is_loading] = useState(false);
  const [error, set_error] = useState("");
  const [show_settings, set_show_settings] = useState(false);

  const { total_cost: estimated_cost } = use_complete_token_estimation(
    text,
    feature as feature_type
  );

  const handle_analyze = async () => {
    if (!text.trim()) {
      set_error("Please enter some text to analyze");
      return;
    }

    if (!mp_tokens || mp_tokens < estimated_cost) {
      set_error(`Insufficient tokens. You need ${estimated_cost} MP for this operation.`);
      return;
    }

    set_is_loading(true);
    set_error("");
    set_result("");

    try {
      const response = await fetch("/api/text-analyzer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature,
          text: text.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze text");
      }

      set_result(data.result);
      refresh_mp(); // Refresh token balance
    } catch (err) {
      set_error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      set_is_loading(false);
    }
  };

  const export_to_pdf = () => {
    const doc = new jsPDF();
    const page_height = doc.internal.pageSize.height;
    const margin = 20;
    let y_position = margin;

    // Title
    doc.setFontSize(16);
    doc.text(
      `Text Analysis - ${FEATURES.find((f) => f.value === feature)?.label}`,
      margin,
      y_position
    );
    y_position += 15;

    // Original Text
    doc.setFontSize(12);
    doc.text("Original Text:", margin, y_position);
    y_position += 10;

    doc.setFontSize(10);
    const original_lines = doc.splitTextToSize(text, 170);
    original_lines.forEach((line: string) => {
      if (y_position > page_height - margin) {
        doc.addPage();
        y_position = margin;
      }
      doc.text(line, margin, y_position);
      y_position += 5;
    });

    y_position += 10;

    // Result
    doc.setFontSize(12);
    doc.text("Analysis Result:", margin, y_position);
    y_position += 10;

    doc.setFontSize(10);
    const result_lines = doc.splitTextToSize(result, 170);
    result_lines.forEach((line: string) => {
      if (y_position > page_height - margin) {
        doc.addPage();
        y_position = margin;
      }
      doc.text(line, margin, y_position);
      y_position += 5;
    });

    doc.save("text-analysis.pdf");
  };

  const copy_to_clipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Text Analyzer</h1>
        <div className="flex items-center gap-4">
          <Compact_token_display />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-6">
          {/* Input Section */}
          <div className="glass dark:glass-dark rounded-3xl p-6 shadow-macos">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Input Text</h3>
            <textarea
              value={text}
              onChange={(e) => set_text(e.target.value)}
              placeholder="Enter or paste your text here..."
              className="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-jade dark:focus:ring-jade resize-none"
              disabled={is_loading}
            />
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {text.length} characters • Estimated cost: {estimated_cost} MP
            </div>
          </div>

          {/* Result Section */}
          {result && (
            <div className="glass dark:glass-dark rounded-3xl p-6 shadow-macos">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Result</h3>
                <div className="flex gap-2">
                  <button
                    onClick={copy_to_clipboard}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={export_to_pdf}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-4 rounded-xl max-h-96 overflow-y-auto">
                {result}
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handle_analyze}
            disabled={!text.trim() || is_loading || estimated_cost > (mp_tokens || 0)}
            className="w-full py-3 bg-gradient-to-r from-jade to-jade-dark text-white font-medium rounded-xl hover:from-jade-dark hover:to-jade transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {is_loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze Text ({estimated_cost} MP)</span>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="xl:col-span-4">
          <div className="glass dark:glass-dark rounded-2xl p-6 shadow-macos">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Type</h3>
              <button
                onClick={() => set_show_settings(!show_settings)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-3 ${!show_settings && "max-h-48 overflow-hidden"}`}>
              {FEATURES.map((f) => (
                <label
                  key={f.value}
                  className={`block p-3 rounded-lg cursor-pointer transition-colors ${
                    feature === f.value
                      ? "bg-jade/10 border-2 border-jade"
                      : "bg-gray-50 dark:bg-gray-900 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="feature"
                    value={f.value}
                    checked={feature === f.value}
                    onChange={(e) => set_feature(e.target.value)}
                    className="sr-only"
                    disabled={is_loading}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
