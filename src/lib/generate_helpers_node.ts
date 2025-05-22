import sharp from "sharp";
import path from "path";

// Helper to add overlay PNG watermark to image (bottom right corner) in Node.js
export async function add_overlay_to_image_node(
  base64: string,
  overlay_path = path.join(process.cwd(), "public", "watermark.png")
): Promise<string> {
  const image = Buffer.from(base64, "base64");
  // Composite the watermark PNG at the bottom right
  const result = await sharp(image)
    .composite([{ input: overlay_path, gravity: "southeast" }])
    .png()
    .toBuffer();
  return result.toString("base64");
} 