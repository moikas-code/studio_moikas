"use client";
import React, { useContext } from "react";
import { MpContext } from "@/context/mp_context";

interface Token_count_display_props {
  renewable_tokens?: number;
  permanent_tokens?: number;
  mp_tokens?: number;
  is_loading_tokens?: boolean;
  token_error?: string | null;
}

export default function Token_count_display(props: Token_count_display_props) {
  // Use context if no props provided
  const mp_ctx = useContext(MpContext);
  const {
    renewable_tokens = mp_ctx.renewable_tokens,
    permanent_tokens = mp_ctx.permanent_tokens,
    mp_tokens = mp_ctx.mp_tokens,
    is_loading_tokens = mp_ctx.is_loading_tokens,
    token_error = mp_ctx.token_error,
  } = props;
  return (
    <div className="text-black" style={{ fontFamily: 'monospace', fontSize: 16, background: '#f5f5f5', borderRadius: 6, padding: '4px 12px', border: '1px solid #e0e0e0' }}>
      {is_loading_tokens ? (
        <span>Loading tokens...</span>
      ) : token_error ? (
        <span style={{ color: 'red' }}>{token_error}</span>
      ) : (
        <>
          Tokens: <b>{renewable_tokens ?? 0}</b> renewable, <b>{permanent_tokens ?? 0}</b> permanent (total: <b>{mp_tokens ?? 0}</b>)
        </>
      )}
    </div>
  );
} 