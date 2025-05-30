import Image_generator from "../../components/image_generator";
import React from "react";
//import Token_count_display from "@/app/components/TokenCountDisplay";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 */
export default function Create_page() {
  return (
    <div className="h-full w-full px-0">

      <Image_generator />
    </div>
  );
}
