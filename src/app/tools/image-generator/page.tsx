import Image_generator from "../../components/image_generator";
import React from "react";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 */
export default function Image_generator_page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <h1 className="text-3xl font-bold mb-8">Image Generator</h1>
      <Image_generator />
    </div>
  );
} 