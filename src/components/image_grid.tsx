import React, { useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { MODEL_OPTIONS } from "../lib/generate_helpers";

interface Image_grid_props {
  image_base64: string[];
  prompt_text: string;
  mana_points_used: number | null;
  plan?: string | null;
  model_id: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  style_name?: string;
  enhancement_count?: number;
  onRedo?: () => void;
  onReuse?: () => void;
  onEdit?: (img: string) => void;
}

export default function Image_grid({
  image_base64,
  prompt_text,
  mana_points_used,
  plan,
  model_id,
  num_inference_steps,
  guidance_scale,
  style_name,
  enhancement_count,
  onRedo,
  onReuse,
  onEdit,
}: Image_grid_props) {
  const [toast_message, set_toast_message] = useState<string | null>(null);
  const [dropdown_open_idx, set_dropdown_open_idx] = useState<number | null>(null);

  // Helper to show toast
  function show_toast(message: string) {
    set_toast_message(message);
    setTimeout(() => set_toast_message(null), 2000);
  }

  // Helper to trigger download
  async function handle_download(base64: string, format: string, idx: number) {
    const img = new window.Image();
    img.src = `data:image/png;base64,${base64}`;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    let ext = format;
    let mime_type = "image/png";
    let blob: Blob | null = null;
    if (format === "png") {
      mime_type = "image/png";
      ext = "png";
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime_type));
    } else if (format === "jpeg") {
      mime_type = "image/jpeg";
      ext = "jpg";
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime_type));
    } else if (format === "webp") {
      mime_type = "image/webp";
      ext = "webp";
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime_type));
    } else if (format === "svg") {
      ext = "svg";
      // Wrap the image in an SVG element
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${img.width}' height='${img.height}'><image href='data:image/png;base64,${base64}' width='${img.width}' height='${img.height}'/></svg>`;
      blob = new Blob([svg], { type: "image/svg+xml" });
    } else if (format === "pdf") {
      ext = "pdf";
      // Dynamically import jsPDF
      const { jsPDF } = await import("jspdf");
      // Always use landscape orientation for PDF
      const pdf = new jsPDF({
        unit: "px",
        format: [img.width, img.height],
        orientation: "landscape",
      });
      // Ensure the image fits the page (swap width/height if needed)
      pdf.addImage(`data:image/png;base64,${base64}`, "PNG", 0, 0, img.width, img.height);
      blob = pdf.output("blob");
    }
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${model_id}_${prompt_text.slice(0, 255)}_generated_image_${idx + 1}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // Track download event
    track("Image Download", {
      format: ext,
      plan: plan || "unknown",
      idx,
      prompt_text: prompt_text.slice(0, 255),
    });
    show_toast(`Downloaded as ${ext.toUpperCase()}`);
  }

  // Helper to copy image to clipboard
  async function handle_copy_image(base64: string) {
    try {
      const res = await fetch(`data:image/png;base64,${base64}`);
      const blob = await res.blob();
      if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
        show_toast("Image copied to clipboard!");
      } else {
        await navigator.clipboard.writeText(`Image copy not supported. Download instead.`);
        show_toast("Image clipboard not supported in this browser.");
      }
    } catch (err) {
      show_toast("Failed to copy image: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  // Download options
  const base_options = [{ value: "png", label: "PNG" }];
  const standard_options = [
    { value: "jpeg", label: "JPEG" },
    { value: "webp", label: "WebP" },
    { value: "svg", label: "SVG" },
    { value: "pdf", label: "PDF" },
  ];
  const all_options =
    plan === "standard" || plan === "admin" ? [...base_options, ...standard_options] : base_options;

  // Get model name from model_id
  const model = MODEL_OPTIONS.find((m) => m.value === model_id);
  const model_name = model ? model.name : model_id;

  // Info tags for right panel
  // Only show steps/cfg for SANA or other models with extra options
  const models_with_extra_options = ["sana"]; // Add more substrings as needed
  const show_extra_options = models_with_extra_options.some((substr) => model_id.includes(substr));
  const info_tags = [
    show_extra_options && num_inference_steps !== undefined ? `steps ${num_inference_steps}` : null,
    show_extra_options && guidance_scale !== undefined ? `cfg ${guidance_scale}` : null,
    style_name && style_name !== "(No style)" ? `style: ${style_name}` : null,
  ].filter(Boolean);

  // Calculate total MP used (generation + enhancement)
  const total_mp_used = ((((mana_points_used as number) || 0) as number) +
    ((enhancement_count as number) || 0)) as number;

  if (!image_base64 || image_base64.length === 0) return null;

  // Determine header and layout
  const is_single = image_base64.length === 1;
  const is_quad = image_base64.length === 4;
  const header = is_single ? "Single" : "Multiple";

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 bg-base-900 rounded-xl border border-base-300 shadow-lg p-0 flex flex-col md:flex-row dark">
      {toast_message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500dark:text-white px-6 py-2 rounded shadow-lg transition-all animate-bounce">
          {toast_message}
        </div>
      )}
      {/* Main content: grid left, info right */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <span
            className={`text-sm font-semibold ${is_single ? "text-red-400" : "text-orange-400"}`}
          >
            {header}
          </span>
          {/* Info bar (for multi-image, show above grid on mobile) */}
          <div className="flex items-center gap-2 text-xs text-base-400">
            <span className="inline-block bg-base-800 rounded px-2 py-0.5">{model_name}</span>
            {/* Future: stylize/weird options here if available */}
          </div>
        </div>
        {/* Image grid */}
        <div className={`w-full flex ${is_single ? "justify-center" : ""} px-4 pb-4`}>
          {is_single ? (
            <div className="flex flex-col items-center">
              <div className="rounded-lg overflow-hidden border border-base-700 bg-base-800">
                <Image
                  src={`data:image/png;base64,${image_base64[0]}`}
                  alt="Generated item"
                  className="rounded-lg max-w-full h-auto"
                  width={384}
                  height={384}
                  unoptimized
                  priority
                />
              </div>
              {/* Download button */}
              <div className="mt-3 flex flex-row items-center gap-2 w-full">
                <div className="relative w-full">
                  <button
                    className="btn btn-sm btn-primary w-full"
                    onClick={() => set_dropdown_open_idx(dropdown_open_idx === 0 ? null : 0)}
                  >
                    Download
                  </button>
                  {dropdown_open_idx === 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-base-800 border border-base-300 rounded shadow-lg z-10 flex flex-col">
                      {all_options.map((opt) => (
                        <button
                          key={opt.value}
                          className="px-4 py-2 text-left hover:bg-base-700 w-full"
                          onClick={async () => {
                            set_dropdown_open_idx(null);
                            await handle_download(image_base64[0], opt.value, 0);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative w-full">
                  <button
                    className="btn btn-sm btn-secondary w-full"
                    onClick={() => handle_copy_image(image_base64[0])}
                    aria-label="Copy image to clipboard"
                  >
                    Copy
                  </button>
                </div>
                {onEdit && (
                  <div className="relative w-full">
                    <button
                      className="btn btn-sm btn-accent w-full"
                      onClick={() => onEdit(image_base64[0])}
                      aria-label="Edit image"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`grid ${
                is_quad ? "grid-cols-2 grid-rows-2" : "grid-cols-2 md:grid-cols-4"
              } gap-3`}
            >
              {image_base64.map((img, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center rounded-lg overflow-hidden border border-base-700 bg-base-800"
                >
                  <Image
                    src={`data:image/png;base64,${img}`}
                    alt="Generated item"
                    className="rounded-lg max-w-full h-auto"
                    width={192}
                    height={192}
                    unoptimized
                    priority
                  />
                  {/* Download button */}
                  <div className="mt-2 flex flex-row items-center gap-2 w-full">
                    <div className="relative w-full">
                      <button
                        className="btn btn-xs btn-primary w-full"
                        onClick={() =>
                          set_dropdown_open_idx(dropdown_open_idx === idx ? null : idx)
                        }
                      >
                        Download
                      </button>
                      {dropdown_open_idx === idx && (
                        <div className="absolute left-0 right-0 mt-2 bg-base-800 border border-base-300 rounded shadow-lg z-10 flex flex-col">
                          {all_options.map((opt) => (
                            <button
                              key={opt.value}
                              className="px-4 py-2 text-left hover:bg-base-700 w-full"
                              onClick={async () => {
                                set_dropdown_open_idx(null);
                                await handle_download(img, opt.value, idx);
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-xs btn-secondary w-full"
                      onClick={() => handle_copy_image(img)}
                      aria-label="Copy image to clipboard"
                    >
                      Copy
                    </button>
                    {onEdit && (
                      <button
                        className="btn btn-xs btn-accent w-full"
                        onClick={() => onEdit(img)}
                        aria-label="Edit image"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Info panel (right) */}
      <div className="w-full md:w-64 flex flex-col justify-start items-end px-6 pt-4 pb-4 bg-base-900 border-t md:border-t-0 md:border-l border-base-800 min-h-[200px] md:min-h-0">
        {/* Redo/Reuse buttons */}
        {(onRedo || onReuse) && (
          <div className="flex gap-2 mb-2">
            {onRedo && (
              <button
                className="btn btn-xs btn-secondary"
                onClick={onRedo}
                aria-label="Redo with same settings"
                type="button"
              >
                Redo
              </button>
            )}
            {onReuse && (
              <button
                className="btn btn-xs btn-secondary"
                onClick={onReuse}
                aria-label="Reuse prompt and settings"
                type="button"
              >
                Reuse
              </button>
            )}
          </div>
        )}
        {/* Cost and prompt info */}
        <div className="flex flex-col items-end gap-2 w-full">
          <div className="flex items-center gap-2 w-full justify-end">
            <span className="text-xs text-base-400">{is_single ? "Single" : "Imagine"}</span>
            <div className="w-32 h-2 bg-base-800 rounded-full overflow-hidden">
              <div className="h-2 bg-orange-400 rounded-full" style={{ width: "100%" }}></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end w-full">
            <span className="inline-block bg-base-800 rounded px-2 py-0.5 text-xs">
              {model_name}
            </span>
            {info_tags.map((tag, idx) => (
              <span key={idx} className="inline-block bg-base-800 rounded px-2 py-0.5 text-xs">
                {tag}
              </span>
            ))}
          </div>
          <div className="text-xs text-base-400 mt-2 w-full text-right">
            {prompt_text && <div className="italic mb-1">{prompt_text}</div>}
            {mana_points_used !== null && (
              <div className="font-mono">
                Mana Points used: <span className="text-orange-400 font-bold">{total_mp_used}</span>{" "}
                {enhancement_count && enhancement_count > 0 ? (
                  <span className="text-xs text-base-400 ml-2">
                    ({mana_points_used} + {enhancement_count} for prompt enhancement)
                  </span>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
