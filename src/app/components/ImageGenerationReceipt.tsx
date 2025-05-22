import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import html2canvas from "html2canvas-pro";
import { track } from "@vercel/analytics";
import { add_overlay_to_image } from "@/lib/generate_helpers";

interface ImageCostBreakdown {
  model: string;
  width: number;
  height: number;
  mp: number;
}

interface GenerationCost {
  enhancement_mp: number;
  images: ImageCostBreakdown[];
  total_mp: number;
}

interface ImageGenerationCreationProps {
  prompt_text: string;
  images: string[]; // base64 strings
  costs: GenerationCost;
  plan: string;
  timestamp: string;
  error_message?: string | null;
  onDownload?: (img: string, idx: number) => void;
  onRedo?: () => void; // Redo handler
  onReuse?: () => void; // Reuse handler
  // For future: onTransferToEditor, onTransferToMerch
}

// Helper to sanitize file names
function sanitize_filename(str: string) {
  return str.replace(/[^a-z0-9_\-]+/gi, "_").slice(0, 40);
}

// Helper to trigger download (copied and adapted from image_grid.tsx)
async function handle_download(base64: string, format: string, idx: number) {
  const img = new window.Image();
  img.src = `data:image/png;base64,${base64}`;
  await new Promise((resolve) => { img.onload = resolve; });
  let ext = format;
  let mime_type = 'image/png';
  let blob: Blob | null = null;
  if (format === 'png') {
    mime_type = 'image/png';
    ext = 'png';
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime_type));
  } else if (format === 'jpeg') {
    mime_type = 'image/jpeg';
    ext = 'jpg';
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime_type));
  } else if (format === 'webp') {
    mime_type = 'image/webp';
    ext = 'webp';
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime_type));
  } else if (format === 'svg') {
    ext = 'svg';
    // Wrap the image in an SVG element
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${img.width}' height='${img.height}'><image href='data:image/png;base64,${base64}' width='${img.width}' height='${img.height}'/></svg>`;
    blob = new Blob([svg], { type: 'image/svg+xml' });
  } else if (format === 'pdf') {
    ext = 'pdf';
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'px', format: [img.width, img.height], orientation: 'landscape' });
    pdf.addImage(`data:image/png;base64,${base64}`, 'PNG', 0, 0, img.width, img.height);
    blob = pdf.output('blob');
  }
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `generated_image_${idx + 1}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to draw overlay text on a canvas (bottom right corner)
function draw_overlay_on_canvas(canvas: HTMLCanvasElement, overlay_text = "studio.moikas.com") {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const font_size = Math.max(16, Math.floor(canvas.height * 0.04));
  ctx.font = `bold ${font_size}px sans-serif`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#000";
  const text_width = ctx.measureText(overlay_text).width;
  const padding = 8;
  const margin = 12;
  ctx.fillRect(
    canvas.width - text_width - 2 * padding - margin,
    canvas.height - font_size - padding - margin,
    text_width + 2 * padding,
    font_size + 2 * padding
  );
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "#fff";
  ctx.fillText(
    overlay_text,
    canvas.width - margin - padding,
    canvas.height - margin - padding
  );
}

export default function ImageGenerationCreation({
  prompt_text,
  images,
  costs,
  plan,
  timestamp,
  error_message,
  onRedo,
  onReuse,
}: ImageGenerationCreationProps) {
  // Ref for the Creation container
  const Creation_ref = useRef<HTMLDivElement>(null);
  const [is_exporting, set_is_exporting] = useState(false);
  const [dropdown_open_idx, set_dropdown_open_idx] = useState<number | null>(null);
  const [overlaid_images, set_overlaid_images] = useState<string[]>(images);

  // Apply overlay to images for free users
  useEffect(() => {
    let is_mounted = true;
    async function process_images() {
      if (plan === 'free') {
        const processed = await Promise.all(images.map(img => add_overlay_to_image(img)));
        if (is_mounted) set_overlaid_images(processed);
      } else {
        set_overlaid_images(images);
      }
    }
    process_images();
    return () => { is_mounted = false; };
  }, [images, plan]);

  // --- Share image and prompt text ---
  async function handle_share_image(img: string) {
    try {
      track("Creation Share Image", { plan, timestamp: new Date().toISOString() });
      // Add overlay
      const img_with_overlay = await add_overlay_to_image(img);
      // Convert base64 to Blob
      const res = await fetch(`data:image/png;base64,${img_with_overlay}`);
      const blob = await res.blob();

      // Try to use the Async Clipboard API for image
      if (
        navigator.clipboard &&
        typeof window.ClipboardItem !== "undefined"
      ) {
        try {
          await navigator.clipboard.write([
            new window.ClipboardItem({ "image/png": blob }),
          ]);
          alert("Image copied to clipboard!");
        } catch (err) {
          // Fallback: copy just the prompt text
          await navigator.clipboard.writeText(
            `${prompt_text}\n\n[Image not copied: browser unsupported]\n\nCreated on https://studio.moikas.com`
          );
          alert(
            "Prompt text copied. Image clipboard not supported in this browser."
          );
          console.error("Clipboard image copy failed:", err);
        }
      } else {
        // Fallback: copy just the prompt text
        await navigator.clipboard.writeText(
          `${prompt_text}\n\n[Image not copied: browser unsupported]\n\nCreated on https://studio.moikas.com`
        );
        alert(
          "Prompt text copied. Image clipboard not supported in this browser."
        );
      }
    } catch (err) {
      alert(
        "Failed to copy image and prompt: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  }

  // --- Share the entire Creation as an image ---
  async function handle_share_Creation() {
    if (!Creation_ref.current) return;
    set_is_exporting(true);
    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for DOM update
    try {
      track("Creation Share Creation", { plan, timestamp: new Date().toISOString() });
      // Render the Creation DOM node to a canvas
      const canvas = await html2canvas(Creation_ref.current, {
        backgroundColor: "#0000",
        useCORS: true,
        scale: 2,
      });
      // Apply overlay for free users
      if (plan === 'free') {
        draw_overlay_on_canvas(canvas, "studio.moikas.com");
      }
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to create image blob");
      // Try Clipboard API for image
      if (
        navigator.clipboard &&
        typeof window.ClipboardItem !== "undefined"
      ) {
        try {
          await navigator.clipboard.write([
            new window.ClipboardItem({ "image/png": blob }),
          ]);
          alert("Creation image copied to clipboard!");
          return;
        } catch (error) {
          console.error("Clipboard image copy failed:", error);
          // Fallback: copy just the prompt text
          try {
            await navigator.clipboard.writeText(
              `${prompt_text}\n\n[Image not copied: browser unsupported]\n\nCreated on https://studio.moikas.com`
            );
            alert("Prompt text copied. Image clipboard not supported in this browser.");
          } catch (error) {
            alert("Failed to copy image or text to clipboard.");
            console.error("Clipboard text copy failed:", error);
          }
          return;
        }
      }
      // Fallback: show alert dialog only (no download)
      alert("Sharing and clipboard are not supported in this browser. Please try copying the prompt text manually.");
      return;
    } catch (error) {
      alert("Failed to share Creation: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      set_is_exporting(false);
    }
  }

  // --- Export the Creation as a PDF ---
  async function handle_export_pdf() {
    if (!Creation_ref.current) return;
    set_is_exporting(true);
    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for DOM update
    try {
      track("Creation Export PDF", { plan, timestamp: new Date().toISOString() });
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.jsPDF;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      await pdf.html(Creation_ref.current, {
        callback: function (doc) {
          doc.save("Creation.pdf");
        },
        x: 10,
        y: 10,
        html2canvas: {
          useCORS: true,
          backgroundColor: "#fff",
          scale: 2,
        },
      });
    } catch (err) {
      alert("Failed to export PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      set_is_exporting(false);
    }
  }

  // Download options by plan
  const base_options = [
    { value: 'png', label: 'PNG' },
  ];
  const standard_options = [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' },
    { value: 'svg', label: 'SVG' },
    { value: 'pdf', label: 'PDF' },
  ];
  const all_options = plan === 'standard' ? [...base_options, ...standard_options] : base_options;

  if (error_message) {
    return (
      <div className="max-w-xl mx-auto bg-red-50 border border-red-300 rounded-xl shadow p-6 mt-8">
        <div className="text-xl font-bold text-red-700 mb-2">Generation Failed</div>
        <div className="text-xs text-gray-500 mb-4">{timestamp}</div>
        <div className="mb-2">
          <span className="font-semibold">Prompt:</span>
          <span className="ml-2 italic">{prompt_text}</span>
        </div>
        <div className="text-red-600 font-semibold mb-4">{error_message}</div>
      </div>
    );
  }

  return (
    // Force supported background and text color for html2canvas compatibility
    <div
      ref={Creation_ref}
      className="max-w-xl rounded-xl shadow p-6 border border-gray-200 mt-8"
      style={{
        background: "#fff",
        color: "#222",
        transform: "scale(1.25)",
        transformOrigin: "top center",
      }} // html2canvas: avoid oklch colors; enlarge by 25%
    >
      {/* Title row with redo/reuse buttons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col md:flex-row justify-between w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="text-xl font-bold">Creation Certificate</div>
            <div className="text-xs text-gray-500 mb-4 md:hidden">{timestamp}</div>
          </div>
          {!is_exporting && (
            <div className="flex gap-2">
              {typeof onRedo === "function" && (
                <button
                  className="btn btn-xs btn-outline tooltip"
                  data-tip="Redo with same settings"
                  aria-label="Redo with same settings"
                  onClick={onRedo}
                  type="button"
                >
                  Redo
                </button>
              )}
              {typeof onReuse === "function" && (
                <button
                  className="btn btn-xs btn-outline tooltip"
                  data-tip="Reuse prompt and settings"
                  aria-label="Reuse prompt and settings"
                  onClick={onReuse}
                  type="button"
                >
                  Reuse
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-4 hidden md:block">{timestamp}</div>
      <div className="mb-2">
        <span className="font-semibold">Prompt:</span>
        <span className="ml-2 italic">{prompt_text}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {overlaid_images.map((img, idx) => {
          // Get model for this image (from costs.images if available)
          const model = costs.images[idx]?.model || "unknown_model";
          const alt_text = `Generated by ${model}: ${prompt_text}`;
          const file_name = `generated_${sanitize_filename(
            model
          )}_${sanitize_filename(prompt_text)}_${idx + 1}.png`;
          return (
            // Flex row: image left, buttons right
            <div
              key={idx}
              className="flex flex-col md:flex-row items-start gap-2"
            >
              <Image
                src={`data:image/png;base64,${img}`}
                alt={alt_text}
                className="rounded border object-cover"
                width={211} // 10% larger than 192
                height={211}
                unoptimized
                priority
              />
              {/* Vertical column of share/download buttons with extra padding */}
              {!is_exporting && (
                <div className="flex flex-col gap-2 mt-2 px-2 py-1 min-w-[7.5rem]">
                  {/* Download dropdown for standard, single button for free */}
                  {plan === "standard" ? (
                    <>
                      <div className="relative">
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() =>
                            set_dropdown_open_idx(
                              dropdown_open_idx === idx ? null : idx
                            )
                          }
                          aria-label="Download image"
                        >
                          Download
                        </button>
                        {dropdown_open_idx === idx && (
                          <div className="absolute left-0 right-0 mt-2 bg-white border border-base-200 rounded shadow-lg z-10 flex flex-col">
                            {all_options.map((opt) => (
                              <button
                                key={opt.value}
                                className="px-4 py-2 text-left hover:bg-base-200 w-full"
                                onClick={async () => {
                                  set_dropdown_open_idx(null);
                                  track("Creation Download", {
                                    plan,
                                    format: opt.value,
                                    timestamp: new Date().toISOString(),
                                  });
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
                        className="btn btn-xs btn-outline"
                        onClick={() => handle_share_image(img)}
                        aria-label="Share image"
                      >
                        Share
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={async () => {
                        track("Creation Download", {
                          plan,
                          format: "png",
                          timestamp: new Date().toISOString(),
                        });
                        const a = document.createElement("a");
                        a.href = `data:image/png;base64,${img}`;
                        a.download = file_name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      aria-label="Download image"
                    >
                      Download
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-700">
            <th className="text-left">#</th>
            <th className="text-left">Model</th>
            <th className="text-left">Size</th>
            <th className="text-right">Cost (MP)</th>
          </tr>
        </thead>
        <tbody>
          {costs.images.map((cost, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-100 dark:border-gray-800"
            >
              <td>{idx + 1}</td>
              <td>{cost.model}</td>
              <td>
                {cost.width}×{cost.height}
              </td>
              <td className="text-right">{cost.mp}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} className="text-right font-semibold">
              Enhance Prompt
            </td>
            <td className="text-right">{costs.enhancement_mp}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-300 dark:border-gray-700 font-bold">
            <td colSpan={3}>Total</td>
            <td className="text-right">{costs.total_mp}</td>
          </tr>
        </tfoot>
      </table>
      <div className="text-xs text-black-400 dark:text-black-300 mb-2">
        Plan: {plan}
      </div>
      <div className="flex gap-2">
        {!is_exporting && (
          <>
            <button
              className="btn btn-sm btn-outline"
              onClick={handle_share_Creation}
              aria-label="Share Creation"
            >
              Share
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={handle_export_pdf}
              aria-label="Export as PDF"
            >
              Export PDF
            </button>
          </>
        )}
        {/* Future: Transfer to Editor/Merch */}
      </div>
      <div className="w-full text-center mt-4">
        <span className="text-xs text-gray-400 select-none">
          studio.moikas.com
        </span>
      </div>
    </div>
  );
} 