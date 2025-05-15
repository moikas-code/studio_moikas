import React from "react";
import Image from "next/image";

interface Image_grid_props {
  image_base64: string[];
  prompt_text: string;
  mana_points_used: number | null;
}

export default function Image_grid({ image_base64, prompt_text, mana_points_used }: Image_grid_props) {
  if (!image_base64 || image_base64.length === 0) return null;
  return (
    <div className="w-full max-w-5xl mx-auto mt-8 bg-white rounded-xl border border-base-200 shadow-sm p-6">
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
          </div>
        ))}
      </div>
    </div>
  );
} 