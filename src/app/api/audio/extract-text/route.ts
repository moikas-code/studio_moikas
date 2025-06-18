import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { track } from "@vercel/analytics/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

// Helper function to extract text content from HTML more aggressively
function extract_text_content(html: string): string {
  // First pass: Remove all CSS and scripts completely with multiple passes
  let cleaned = html;
  let previous_length = 0;

  // Keep removing dangerous tags until no more are found (handles nested/malformed tags)
  while (cleaned.length !== previous_length) {
    previous_length = cleaned.length;
    cleaned = cleaned
      // Remove style tags and their content
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<style\b[^>]*>/gi, "") // Remove orphaned opening tags
      .replace(/<\/style>/gi, "") // Remove orphaned closing tags
      // Remove script tags and their content
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<script\b[^>]*>/gi, "") // Remove orphaned opening tags
      .replace(/<\/script>/gi, ""); // Remove orphaned closing tags
  }

  // Remove CSS rules that might be inline
  cleaned = cleaned
    .replace(/\{[^}]*\}/g, "")
    // Remove CSS class definitions
    .replace(/\.[a-zA-Z0-9_-]+[\s\S]*?\{[\s\S]*?\}/g, "");

  // Second pass: Extract text from HTML
  const text = cleaned
    // Replace common block elements with spaces
    .replace(/<\/?(p|div|section|article|h[1-6]|br)[^>]*>/gi, " ")
    // Remove list items and bullet points
    .replace(/<li[^>]*>/gi, " ")
    // Remove all remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities safely using a single pass
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39|#x27|#(\d+));/g, (match, dec) => {
      const entities: { [key: string]: string } = {
        "&nbsp;": " ",
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&#x27;": "'",
      };

      if (dec) {
        // Numeric entity
        return String.fromCharCode(parseInt(dec, 10));
      }

      return entities[match] || match;
    })
    // Clean up whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, " ")
    .trim();

  return text;
}

// Clean up excessive whitespace and formatting issues
function clean_extracted_text(text: string): string {
  return (
    text
      // Remove all newlines and replace with spaces
      .replace(/\n+/g, " ")
      // Remove bullet points
      .replace(/•/g, "")
      // Replace multiple spaces with single space
      .replace(/ {2,}/g, " ")
      // Remove space before punctuation
      .replace(/\s+([.,!?;:])/g, "$1")
      // Add space after punctuation if missing
      .replace(/([.,!?;:])(\w)/g, "$1 $2")
      // Remove tabs
      .replace(/\t+/g, " ")
      // Final trim
      .trim()
  );
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 50000; // Maximum characters to extract (50k for documents)
const MIN_TEXT_LENGTH = 50; // Minimum characters for valid content

// Validation schemas
const url_schema = z.object({
  url: z.string().url(),
});

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
];

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const content_type = req.headers.get("content-type") || "";

    // Handle URL extraction
    if (content_type.includes("application/json")) {
      const body = await req.json();
      const validation = url_schema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
      }

      try {
        // Fetch the webpage
        const web_response = await fetch(validation.data.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        if (!web_response.ok) {
          throw new Error(`Failed to fetch URL: ${web_response.status}`);
        }

        const html = await web_response.text();

        // Log for debugging
        console.log(`Extracting text from URL: ${validation.data.url}`);
        console.log(`HTML length: ${html.length} characters`);

        // Enhanced HTML to text conversion for better content extraction
        let text = html;
        let previous_length = 0;

        // Keep removing dangerous tags until no more are found (handles nested/malformed tags)
        while (text.length !== previous_length) {
          previous_length = text.length;
          text = text
            // Remove script tags and their content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<script\b[^>]*>/gi, "") // Remove orphaned opening tags
            .replace(/<\/script>/gi, "") // Remove orphaned closing tags
            // Remove style tags and their content
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<style\b[^>]*>/gi, "") // Remove orphaned opening tags
            .replace(/<\/style>/gi, "") // Remove orphaned closing tags
            // Remove noscript tags and their content
            .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
            .replace(/<noscript\b[^>]*>/gi, "") // Remove orphaned opening tags
            .replace(/<\/noscript>/gi, ""); // Remove orphaned closing tags
        }

        text = text

          // Remove any inline styles and CSS classes
          .replace(/style\s*=\s*"[^"]*"/gi, "")
          .replace(/style\s*=\s*'[^']*'/gi, "")
          .replace(/class\s*=\s*"[^"]*"/gi, "")
          .replace(/class\s*=\s*'[^']*'/gi, "")

          // Remove CSS rules that might be in the HTML (common in Wikipedia)
          .replace(/\.mw-[^{]+\{[^}]+\}/gi, "") // Remove .mw-* CSS rules
          .replace(/\.[a-zA-Z0-9-_]+\{[^}]+\}/gi, "") // Remove any other CSS rules
          .replace(/@media[^{]+\{[^}]+\}/gi, "") // Remove media queries

          // Remove common navigation and footer patterns
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")

          // Handle Wikipedia specific patterns
          .replace(/<div[^>]*class="[^"]*infobox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "") // Remove infoboxes
          .replace(/<table[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/table>/gi, "") // Remove navboxes
          .replace(/<div[^>]*class="[^"]*metadata[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "") // Remove metadata
          .replace(/<div[^>]*id="[^"]*jump-to-nav[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "") // Remove nav jumps

          // Convert breaks and paragraphs to newlines
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<p[^>]*>/gi, "")

          // Convert lists to readable format
          .replace(/<li[^>]*>/gi, "\n• ")
          .replace(/<\/li>/gi, "")

          // Remove remaining HTML tags
          .replace(/<[^>]+>/g, " ")

          // Decode HTML entities safely using a single pass
          .replace(/&(?:nbsp|amp|lt|gt|quot|#39|#x27|#x2F|#(\d+));/g, (match, dec) => {
            const entities: { [key: string]: string } = {
              "&nbsp;": " ",
              "&amp;": "&",
              "&lt;": "<",
              "&gt;": ">",
              "&quot;": '"',
              "&#39;": "'",
              "&#x27;": "'",
              "&#x2F;": "/",
            };

            if (dec) {
              // Numeric entity
              return String.fromCharCode(parseInt(dec, 10));
            }

            return entities[match] || match;
          })

          // Clean up whitespace
          .replace(/\n{3,}/g, "\n\n") // Max 2 newlines
          .replace(/[ \t]+/g, " ") // Normalize spaces
          .trim();

        // Extract only the main content area if possible (common patterns)
        const main_content_match = text.match(
          /(?:article|main|content|mw-content-text|entry-content)[\s\S]*?(?=(?:sidebar|footer|navigation|references|external links|see also))/i
        );
        if (main_content_match && main_content_match[0].length > 500) {
          text = main_content_match[0];
        }

        // For Wikipedia, try to extract main content more specifically
        if (validation.data.url.includes("wikipedia.org")) {
          // First, clean the HTML from CSS with multiple passes to handle nested cases
          let cleaned_html = html;
          let previous_length = 0;

          // Keep removing style tags until no more are found (handles nested/malformed tags)
          while (cleaned_html.length !== previous_length) {
            previous_length = cleaned_html.length;
            cleaned_html = cleaned_html
              // Remove style tags more aggressively
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
              .replace(/<style\b[^>]*>/gi, "") // Remove orphaned opening tags
              .replace(/<\/style>/gi, ""); // Remove orphaned closing tags
          }

          // Remove CSS rules that appear in the HTML
          cleaned_html = cleaned_html
            .replace(/\.mw-[^}]+\}[^<]*/gi, "")
            .replace(/\.[a-zA-Z0-9-_]+\s*\{[^}]+\}/gi, "")
            .replace(/@media[^}]+\}[^<]*/gi, "");

          // Look for the main content div
          const wiki_content_match = cleaned_html.match(
            /<div[^>]*id="mw-content-text"[^>]*>([\s\S]*?)(?=<div[^>]*(?:class="printfooter"|id="catlinks"))/i
          );
          if (wiki_content_match) {
            // First remove navigation and UI elements
            const wiki_text = wiki_content_match[1]
              // Remove the entire navigation/menu sections
              .replace(
                /<div[^>]*id="[^"]*(?:toc|navigation|menu|search)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
                ""
              )
              .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
              // Remove "Jump to" and similar navigation text
              .replace(/Jump to[^<]*/gi, "")
              .replace(/Main menu[^<]*/gi, "")
              .replace(/move to sidebar[^<]*/gi, "")
              .replace(/hide[^<]*/gi, "")
              // Remove CSS that might still be there
              .replace(/\.mw-[^}]+\}/gi, "")
              .replace(/\.[a-zA-Z0-9-_]+\s*\{[^}]+\}/gi, "")
              // Remove edit links
              .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
              // Remove reference numbers like [1], [2], etc
              .replace(/\[\d+\]/g, "")
              // Remove Wikipedia specific elements
              .replace(/<div[^>]*class="[^"]*thumb[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "") // Remove image boxes
              .replace(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>[\s\S]*?<\/table>/gi, "") // Remove infoboxes
              .replace(/<table[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/table>/gi, "") // Remove navboxes
              .replace(/<div[^>]*class="[^"]*hatnote[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "") // Remove hatnotes
              .replace(/<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "") // Remove sidebars
              // Remove table of contents
              .replace(/<div[^>]*id="toc"[^>]*>[\s\S]*?<\/div>/gi, "")
              // Remove any remaining style attributes
              .replace(/style\s*=\s*["'][^"']*["']/gi, "")
              .replace(/class\s*=\s*["'][^"']*["']/gi, "");

            // Convert to text
            text = wiki_text
              .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, " $1 ") // Headers with spaces
              .replace(/<br\s*\/?>/gi, " ")
              .replace(/<\/p>/gi, " ")
              .replace(/<p[^>]*>/gi, "")
              .replace(/<li[^>]*>/gi, " ")
              .replace(/<\/li>/gi, "")
              .replace(/<[^>]+>/g, " ")
              // Decode entities safely using a single pass
              .replace(/&(?:nbsp|amp|lt|gt|quot|#39|#x27|#(\d+));/g, (match, dec) => {
                const entities: { [key: string]: string } = {
                  "&nbsp;": " ",
                  "&amp;": "&",
                  "&lt;": "<",
                  "&gt;": ">",
                  "&quot;": '"',
                  "&#39;": "'",
                  "&#x27;": "'",
                };

                if (dec) {
                  // Numeric entity
                  return String.fromCharCode(parseInt(dec, 10));
                }

                return entities[match] || match;
              })
              // Clean up
              .replace(/\n+/g, " ")
              .replace(/[ \t]+/g, " ")
              .trim();
          }
        }

        // Clean up any remaining issues
        text = text
          // Remove any remaining CSS-like patterns
          .replace(/\.[a-zA-Z0-9-_]+\s*\{[^}]+\}/g, "") // CSS rules
          .replace(/\.mw-[a-zA-Z0-9-_]+[^.\s]*/g, "") // CSS class references
          .replace(/@[a-zA-Z]+[^{]*\{[^}]+\}/g, "") // @ rules
          // Remove lines that look like CSS selectors
          .split("\n")
          .filter((line) => {
            // Filter out lines that look like CSS
            const trimmed = line.trim();
            return (
              !trimmed.match(/^\.[\w-]+/) && // Starts with .classname
              !trimmed.match(/^\{/) && // Starts with {
              !trimmed.match(/\}$/) && // Ends with }
              !trimmed.match(/^[a-zA-Z-]+:\s*[^;]+;/) && // CSS property
              trimmed.length > 0
            );
          })
          .join("\n")
          // Final cleanup
          .replace(/\s{2,}/g, " ") // Multiple spaces to single space
          .replace(/\n\s+\n/g, "\n\n") // Remove spaces between newlines
          .replace(/\n{3,}/g, "\n\n") // Max 2 newlines
          .trim();

        // Don't limit text length for document extraction
        // The TTS API will handle its own limits

        // Log extraction result
        console.log(`Extracted text length: ${text.length} characters`);

        // If we still have CSS in the text, use the aggressive fallback
        if (
          text.includes(".mw-") ||
          text.includes("{") ||
          text.includes("}") ||
          text.match(/\.[a-zA-Z0-9-_]+\s*\{/)
        ) {
          console.log("CSS detected in extracted text, using fallback extraction method");
          text = extract_text_content(html);
        }

        // Apply final cleanup to remove excessive whitespace
        text = clean_extracted_text(text);

        console.log(`First 200 chars: ${text.substring(0, 200)}...`);

        // Validate we got meaningful content
        if (!text || text.length < MIN_TEXT_LENGTH) {
          return NextResponse.json(
            {
              error: "Unable to extract meaningful text content from this URL",
              suggestion: "Try a different URL or copy and paste the text directly",
              debug: {
                html_length: html.length,
                extracted_length: text.length,
                url: validation.data.url,
              },
            },
            { status: 400 }
          );
        }

        // Track successful extraction
        track("document_text_extracted", {
          userId,
          source: "url",
          text_length: text.length,
        });

        return NextResponse.json({
          success: true,
          text,
          source: "url",
          char_count: text.length,
        });
      } catch (url_error) {
        console.error("URL extraction error:", url_error);
        return NextResponse.json({ error: "Failed to extract content from URL" }, { status: 500 });
      }
    }

    // Handle document upload
    if (content_type.includes("multipart/form-data")) {
      const form_data = await req.formData();
      const file = form_data.get("document") as File;

      if (!file) {
        return NextResponse.json({ error: "No document provided" }, { status: 400 });
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      }

      try {
        let text = "";

        // Handle text files
        if (file.type === "text/plain") {
          text = await file.text();
        } else {
          // For PDF and other document types, we would normally use a library
          // For MVP, return a message that these formats need additional setup
          return NextResponse.json(
            {
              error:
                "PDF and document extraction requires additional libraries. For MVP, please use TXT files or URLs.",
              suggestion:
                "You can convert your document to plain text first, or paste the content directly.",
            },
            { status: 501 }
          );
        }

        // Truncate text if too long
        if (text.length > MAX_TEXT_LENGTH) {
          text = text.substring(0, MAX_TEXT_LENGTH);
        }

        if (!text.trim()) {
          return NextResponse.json(
            { error: "No text content found in the document" },
            { status: 400 }
          );
        }

        // Track successful extraction
        track("document_text_extracted", {
          userId,
          source: "document",
          file_type: file.type,
          text_length: text.length,
        });

        return NextResponse.json({
          success: true,
          text,
          source: "document",
          char_count: text.length,
          file_name: file.name,
        });
      } catch (file_error) {
        console.error("Document extraction error:", file_error);
        return NextResponse.json(
          { error: "Failed to extract text from document" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  } catch (error) {
    console.error("Text extraction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
