'use client'

import React, { useContext } from "react";
import { ImageGenerator } from "../../components/image_generator/index";
import { MpContext } from "../../context/mp_context";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 */
export default function Create_page() {
  const { mp_tokens, refresh_mp, plan } = useContext(MpContext);
  
  return (
    <div className="h-full w-full px-0">
      <ImageGenerator 
        available_mp={mp_tokens || 0}
        on_mp_update={refresh_mp}
        user_plan={plan || 'free'}
      />
    </div>
  );
}
