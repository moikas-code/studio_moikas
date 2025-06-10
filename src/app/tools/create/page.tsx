'use client'

import React, { useContext } from "react";
import { ImageGenerator } from "../../../components/image_generator/index";
import { MpContext } from "../../../context/mp_context";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 */
export default function Create_page() {
  const { mp_tokens, refresh_mp, plan } = useContext(MpContext);
  
  return (
    <ImageGenerator 
      available_mp={mp_tokens || 0}
      on_mp_update={refresh_mp}
      user_plan={plan || 'free'}
    />
  );
}
