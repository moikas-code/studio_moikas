import sharp from "sharp";

// Helper to add overlay text to image (bottom right corner) in Node.js
export async function add_overlay_to_image_node(
  base64: string,
  overlay_text = "studio.moikas.com"
): Promise<string> {
  const image = Buffer.from(base64, "base64");
  // SVG overlay with text in the bottom right
  const svg = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100%" height="100%" fill="none"/>
      <text x="98%" y="98%" font-size="32" font-family="sans-serif" fill="#fff" stroke="#000" stroke-width="2" text-anchor="end" alignment-baseline="bottom" opacity="0.8">${overlay_text}</text>
    </svg>
  `;
  const result = await sharp(image)
    .composite([{ input: Buffer.from(svg), gravity: "southeast" }])
    .png()
    .toBuffer();
  return result.toString("base64");
} 