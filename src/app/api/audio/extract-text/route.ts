import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { track } from '@vercel/analytics/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_TEXT_LENGTH = 5000 // Maximum characters to extract
const MIN_TEXT_LENGTH = 50 // Minimum characters for valid content

// Validation schemas
const url_schema = z.object({
  url: z.string().url()
})

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text'
]

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const content_type = req.headers.get('content-type') || ''
    
    // Handle URL extraction
    if (content_type.includes('application/json')) {
      const body = await req.json()
      const validation = url_schema.safeParse(body)
      
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid URL provided' },
          { status: 400 }
        )
      }
      
      try {
        // Fetch the webpage
        const web_response = await fetch(validation.data.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })
        
        if (!web_response.ok) {
          throw new Error(`Failed to fetch URL: ${web_response.status}`)
        }
        
        const html = await web_response.text()
        
        // Log for debugging
        console.log(`Extracting text from URL: ${validation.data.url}`)
        console.log(`HTML length: ${html.length} characters`)
        
        // Enhanced HTML to text conversion for better content extraction
        let text = html
          // Remove script and style tags with their content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
          
          // Remove common navigation and footer patterns
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
          
          // Handle Wikipedia specific patterns
          .replace(/<div[^>]*class="[^"]*infobox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '') // Remove infoboxes
          .replace(/<table[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/table>/gi, '') // Remove navboxes
          .replace(/<div[^>]*class="[^"]*metadata[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '') // Remove metadata
          .replace(/<div[^>]*id="[^"]*jump-to-nav[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '') // Remove nav jumps
          
          // Convert breaks and paragraphs to newlines
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<p[^>]*>/gi, '')
          
          // Convert lists to readable format
          .replace(/<li[^>]*>/gi, '\n• ')
          .replace(/<\/li>/gi, '')
          
          // Remove remaining HTML tags
          .replace(/<[^>]+>/g, ' ')
          
          // Decode HTML entities
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
          .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
          
          // Clean up whitespace
          .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
          .replace(/[ \t]+/g, ' ') // Normalize spaces
          .trim()
        
        // Extract only the main content area if possible (common patterns)
        const main_content_match = text.match(/(?:article|main|content|mw-content-text|entry-content)[\s\S]*?(?=(?:sidebar|footer|navigation|references|external links|see also))/i)
        if (main_content_match && main_content_match[0].length > 500) {
          text = main_content_match[0]
        }
        
        // For Wikipedia, try to extract main content more specifically
        if (validation.data.url.includes('wikipedia.org')) {
          // Look for the main content div
          const wiki_content_match = html.match(/<div[^>]*id="mw-content-text"[^>]*>([\s\S]*?)<div[^>]*class="printfooter"/i)
          if (wiki_content_match) {
            text = wiki_content_match[1]
              // Remove edit links
              .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
              // Remove reference numbers like [1], [2], etc
              .replace(/\[\d+\]/g, '')
              // Remove Wikipedia specific elements
              .replace(/<div[^>]*class="[^"]*thumb[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '') // Remove image boxes
              .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '') // Remove tables
              // Convert to text
              .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n\n') // Headers
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<p[^>]*>/gi, '')
              .replace(/<li[^>]*>/gi, '\n• ')
              .replace(/<\/li>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              // Decode entities
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
              // Clean up
              .replace(/\n{3,}/g, '\n\n')
              .replace(/[ \t]+/g, ' ')
              .trim()
          }
        }
        
        // Clean up any remaining issues
        text = text
          .replace(/\s{2,}/g, ' ') // Multiple spaces to single space
          .replace(/\n\s+\n/g, '\n\n') // Remove spaces between newlines
          .trim()
        
        // Limit text length
        if (text.length > MAX_TEXT_LENGTH) {
          text = text.substring(0, MAX_TEXT_LENGTH) + '...'
        }
        
        // Log extraction result
        console.log(`Extracted text length: ${text.length} characters`)
        console.log(`First 200 chars: ${text.substring(0, 200)}...`)
        
        // Validate we got meaningful content
        if (!text || text.length < MIN_TEXT_LENGTH) {
          return NextResponse.json(
            { 
              error: 'Unable to extract meaningful text content from this URL',
              suggestion: 'Try a different URL or copy and paste the text directly',
              debug: {
                html_length: html.length,
                extracted_length: text.length,
                url: validation.data.url
              }
            },
            { status: 400 }
          )
        }
        
        // Track successful extraction
        track('document_text_extracted', {
          userId,
          source: 'url',
          text_length: text.length
        })
        
        return NextResponse.json({
          success: true,
          text,
          source: 'url',
          char_count: text.length
        })
        
      } catch (url_error) {
        console.error('URL extraction error:', url_error)
        return NextResponse.json(
          { error: 'Failed to extract content from URL' },
          { status: 500 }
        )
      }
    }
    
    // Handle document upload
    if (content_type.includes('multipart/form-data')) {
      const form_data = await req.formData()
      const file = form_data.get('document') as File
      
      if (!file) {
        return NextResponse.json(
          { error: 'No document provided' },
          { status: 400 }
        )
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
      
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Unsupported file type' },
          { status: 400 }
        )
      }
      
      try {
        let text = ''
        
        // Handle text files
        if (file.type === 'text/plain') {
          text = await file.text()
        } else {
          // For PDF and other document types, we would normally use a library
          // For MVP, return a message that these formats need additional setup
          return NextResponse.json(
            { 
              error: 'PDF and document extraction requires additional libraries. For MVP, please use TXT files or URLs.',
              suggestion: 'You can convert your document to plain text first, or paste the content directly.'
            },
            { status: 501 }
          )
        }
        
        // Truncate text if too long
        if (text.length > MAX_TEXT_LENGTH) {
          text = text.substring(0, MAX_TEXT_LENGTH)
        }
        
        if (!text.trim()) {
          return NextResponse.json(
            { error: 'No text content found in the document' },
            { status: 400 }
          )
        }
        
        // Track successful extraction
        track('document_text_extracted', {
          userId,
          source: 'document',
          file_type: file.type,
          text_length: text.length
        })
        
        return NextResponse.json({
          success: true,
          text,
          source: 'document',
          char_count: text.length,
          file_name: file.name
        })
        
      } catch (file_error) {
        console.error('Document extraction error:', file_error)
        return NextResponse.json(
          { error: 'Failed to extract text from document' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Text extraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}