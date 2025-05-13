"use client";

import React, { useState } from "react";
import Image from "next/image";

/**
 * ImageGenerator component allows users to enter a prompt and generate an image using the fal.ai API.
 * Follows snake_case for all identifiers.
 */
export default function Image_generator() {
  // State for the prompt input
  const [prompt_text, set_prompt_text] = useState('');
  // State for the generated image (base64)
  const [image_base64, set_image_base64] = useState<string | null>(null);
  // Loading and error states
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);

  // Handler for generating the image
  const handle_generate_image = async (e: React.FormEvent) => {
    e.preventDefault();
    set_is_loading(true);
    set_error_message(null);
    set_image_base64(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt_text }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      set_image_base64(data.image_base64);
    } catch (error: unknown) {
      if (error instanceof Error) {
        set_error_message(error.message || 'An error occurred');
      } else {
        set_error_message('An error occurred');
      }
    } finally {
      set_is_loading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-6 bg-base-200 rounded-lg shadow-lg">
      <form onSubmit={handle_generate_image} className="flex flex-col gap-4">
        <label htmlFor="prompt_text" className="font-semibold">Enter your prompt:</label>
        <input
          id="prompt_text"
          type="text"
          className="input input-bordered w-full"
          value={prompt_text}
          onChange={e => set_prompt_text(e.target.value)}
          placeholder="Describe your image..."
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={is_loading}
        >
          {is_loading ? 'Generating...' : 'Generate Image'}
        </button>
      </form>
      {error_message && (
        <div className="alert alert-error mt-4">{error_message}</div>
      )}
      {image_base64 && (
        <div className="mt-6 flex flex-col items-center">
          <Image
            src={`data:image/png;base64,${image_base64}`}
            alt="Generated visual"
            className="rounded-lg border shadow-md max-w-full h-auto"
            width={512}
            height={512}
            unoptimized
            priority
          />
        </div>
      )}
    </div>
  );
} 