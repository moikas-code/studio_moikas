import Image_generator from "../../components/image_generator";
import React from "react";
import Token_count_display from "@/app/components/TokenCountDisplay";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 */
export default function Create_page() {
  return (
    <div className="h-full w-full px-0">
      <div className="w-full max-w-2xl mx-auto mb-2 flex justify-end">
        <Token_count_display />
      </div>
      <Image_generator />
    </div>
  );
}
