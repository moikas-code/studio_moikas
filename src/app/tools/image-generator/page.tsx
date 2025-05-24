import { Protect } from "@clerk/nextjs";
import Image_generator from "../../components/image_generator";
import React from "react";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 */
export default function Image_generator_page() {
  return (
    <Protect feature={"all_freemium_features"} fallback={<div>Loading...</div>}>
      <div className="h-full w-full px-3 md:px-0">
        <Image_generator />
      </div>
    </Protect>
  );
} 