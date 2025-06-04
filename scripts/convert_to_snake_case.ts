#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises'
import { join, extname } from 'path'

// Configuration
const ROOT_DIR = join(__dirname, '..', 'src')
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build']

// Conversion rules
const PRESERVE_PATTERNS = [
  /^use[A-Z]/, // React hooks (useState, useEffect, etc.)
  /^[A-Z]/, // Component names and classes
  /^on[A-Z]/, // Event handlers for HTML (onClick, onChange)
  /^NEXT_PUBLIC_/, // Next.js env vars
  /^process\.env\./, // Environment variables
]

interface ConversionResult {
  file: string
  changes: Array<{ from: string; to: string; line: number }>
}

/**
 * Convert camelCase to snake_case
 */
function to_snake_case(str: string): string {
  // Handle acronyms and numbers
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([a-z])(\d)/g, '$1_$2')
    .toLowerCase()
}

/**
 * Check if identifier should be preserved
 */
function should_preserve(identifier: string): boolean {
  return PRESERVE_PATTERNS.some(pattern => pattern.test(identifier))
}

/**
 * Process TypeScript/JavaScript file
 */
async function process_file(file_path: string): Promise<ConversionResult> {
  const content = await readFile(file_path, 'utf-8')
  const lines = content.split('\n')
  const changes: ConversionResult['changes'] = []
  
  // Patterns to match identifiers
  const patterns = [
    // Variable declarations
    /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    // Function declarations
    /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    // Arrow functions
    /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(/g,
    // Object properties
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
    // Function parameters
    /\(([^)]+)\)/g,
  ]
  
  let modified_content = content
  
  lines.forEach((line, line_num) => {
    // Skip comments and strings
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return
    
    patterns.forEach(pattern => {
      const matches = line.matchAll(pattern)
      for (const match of matches) {
        const identifier = match[1] || match[2]
        if (!identifier || should_preserve(identifier)) continue
        
        const snake_case = to_snake_case(identifier)
        if (identifier !== snake_case) {
          changes.push({
            from: identifier,
            to: snake_case,
            line: line_num + 1
          })
          
          // Replace in content
          const regex = new RegExp(`\\b${identifier}\\b`, 'g')
          modified_content = modified_content.replace(regex, snake_case)
        }
      }
    })
  })
  
  if (changes.length > 0) {
    await writeFile(file_path, modified_content)
  }
  
  return { file: file_path, changes }
}

/**
 * Recursively find all TypeScript/JavaScript files
 */
async function find_files(dir: string): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const full_path = join(dir, entry.name)
    
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        files.push(...await find_files(full_path))
      }
    } else if (entry.isFile()) {
      if (EXTENSIONS.includes(extname(entry.name))) {
        files.push(full_path)
      }
    }
  }
  
  return files
}

/**
 * Main conversion function
 */
async function convert_codebase() {
  console.log('🔄 Starting snake_case conversion...')
  console.log(`📁 Root directory: ${ROOT_DIR}`)
  
  try {
    const files = await find_files(ROOT_DIR)
    console.log(`📄 Found ${files.length} files to process`)
    
    const results: ConversionResult[] = []
    let total_changes = 0
    
    for (const file of files) {
      const result = await process_file(file)
      if (result.changes.length > 0) {
        results.push(result)
        total_changes += result.changes.length
        console.log(`✅ ${file}: ${result.changes.length} changes`)
      }
    }
    
    // Generate report
    const report_path = join(__dirname, 'snake_case_conversion_report.md')
    const report = generate_report(results, total_changes)
    await writeFile(report_path, report)
    
    console.log(`\n✨ Conversion complete!`)
    console.log(`📊 Total changes: ${total_changes}`)
    console.log(`📄 Report saved to: ${report_path}`)
    
  } catch (error) {
    console.error('❌ Error during conversion:', error)
    process.exit(1)
  }
}

/**
 * Generate conversion report
 */
function generate_report(
  results: ConversionResult[], 
  total_changes: number
): string {
  let report = `# Snake Case Conversion Report\n\n`
  report += `Date: ${new Date().toISOString()}\n`
  report += `Total files modified: ${results.length}\n`
  report += `Total changes: ${total_changes}\n\n`
  
  results.forEach(result => {
    report += `## ${result.file}\n`
    report += `Changes: ${result.changes.length}\n\n`
    
    result.changes.forEach(change => {
      report += `- Line ${change.line}: \`${change.from}\` → \`${change.to}\`\n`
    })
    
    report += '\n'
  })
  
  return report
}

// Run the conversion
if (import.meta.main) {
  convert_codebase()
}