'use client'

import React, { useContext } from "react";
import { ImageGenerator } from "../../../components/image_generator";
import { MpContext } from "../../../context/mp_context";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 * Now uses job-based system for better reliability and history tracking.
 */
export default function Create_page() {
  const { mp_tokens, refresh_mp, plan } = useContext(MpContext);
  
  return (
    <ImageGenerator 
      available_mp={mp_tokens || 0}
      on_mp_update={refresh_mp}
      user_plan={plan || 'free'}
      use_job_system={true}
    />
  );
}
