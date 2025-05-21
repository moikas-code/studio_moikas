import React, { useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";

interface Image_grid_props {
  image_base64: string[];
  prompt_text: string;
  mana_points_used: number | null;
  plan?: string | null;
}

export default function Image_grid({ image_base64, prompt_text, mana_points_used, plan }: Image_grid_props) {
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
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      // Always use landscape orientation for PDF
      const pdf = new jsPDF({ unit: 'px', format: [img.width, img.height], orientation: 'landscape' });
      // Ensure the image fits the page (swap width/height if needed)
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
    // Track download event
    track("Image Download", {
      format: ext,
      plan: plan || 'unknown',
      idx,
      prompt_text: prompt_text.slice(0, 255),
    });
    show_toast(`Downloaded as ${ext.toUpperCase()}`);
  }

  // Download options
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

  if (!image_base64 || image_base64.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 bg-white rounded-xl border border-base-200 shadow-sm p-6">
      {toast_message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-2 rounded shadow-lg transition-all animate-bounce">
          {toast_message}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {image_base64.map((img, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center border border-base-200 rounded-lg bg-base-100 p-2"
          >
            <Image
              src={`data:image/png;base64,${img}`}
              alt="Generated item"
              className="rounded-lg max-w-full h-auto"
              width={256}
              height={256}
              unoptimized
              priority
            />
            <div className="text-xs text-gray-500 mt-2 text-center">
              <span className="italic">{prompt_text}</span>
              <br />
              {mana_points_used !== null && (
                <span className="font-mono">
                  Mana Points used: {mana_points_used}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-col items-center gap-2 w-full">
              <div className="relative w-full">
                <button
                  className="btn btn-sm btn-primary w-full"
                  onClick={() => set_dropdown_open_idx(dropdown_open_idx === idx ? null : idx)}
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
                          await handle_download(img, opt.value, idx);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 