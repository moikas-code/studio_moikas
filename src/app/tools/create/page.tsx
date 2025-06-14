'use client'

import React, { useContext } from "react";
import { ImageGeneratorWithJobs } from "../../../components/image_generator/index_with_jobs";
import { MpContext } from "../../../context/mp_context";

/**
 * Page for the Image Generator tool.
 * Uses snake_case for all identifiers.
 * Now uses job-based system for better reliability and history tracking.
 */
export default function Create_page() {
  const { mp_tokens, refresh_mp, plan } = useContext(MpContext);
  
  return (
    <ImageGeneratorWithJobs 
      available_mp={mp_tokens || 0}
      on_mp_update={refresh_mp}
      user_plan={plan || 'free'}
      use_job_system={true}
    />
  );
}
