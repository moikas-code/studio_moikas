import { Protect } from "@clerk/nextjs";
import Image_generator from "../../components/image_generator";
import React from "react";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 */
export default function Image_generator_page() {
  return (
    <div className="h-full w-full px-0">
      <Image_generator />
    </div>
  );
}
