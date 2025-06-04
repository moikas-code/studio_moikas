#!/usr/bin/env bun
import { readFile, writeFile } from 'fs/promises'

// Test conversion on a single file first
const TEST_FILE = '/home/moika/code/studio_moikas/src/app/api/enhance-prompt/route.ts'

/**
 * Convert camelCase to snake_case
 */
function to_snake_case(str: string): string {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([a-z])(\d)/g, '$1_$2')
    .toLowerCase()
}

/**
 * Process and show changes without writing
 */
async function test_conversion() {
  console.log('🔍 Testing snake_case conversion...\n')
  
  try {
    const content = await readFile(TEST_FILE, 'utf-8')
    const lines = content.split('\n')
    
    console.log(`File: ${TEST_FILE}`)
    console.log('=' .repeat(80))
    
    // Track what would change
    const changes: Array<{line: number, from: string, to: string}> = []
    
    // Simple pattern matching for variable names
    const var_pattern = /\b(const|let|var)\s+([a-zA-Z][a-zA-Z0-9]*)\b/g
    const func_pattern = /\bfunction\s+([a-zA-Z][a-zA-Z0-9]*)\b/g
    const arrow_pattern = /\b([a-zA-Z][a-zA-Z0-9]*)\s*=\s*(?:\(|async)/g
    
    lines.forEach((line, idx) => {
      // Skip imports, exports, and React hooks
      if (line.includes('import') || line.includes('export') || line.includes('use')) return
      
      // Check variable declarations
      let matches = [...line.matchAll(var_pattern)]
      matches.forEach(match => {
        const name = match[2]
        const snake = to_snake_case(name)
        if (name !== snake && !name.startsWith('use')) {
          changes.push({ line: idx + 1, from: name, to: snake })
        }
      })
      
      // Check function names
      matches = [...line.matchAll(func_pattern)]
      matches.forEach(match => {
        const name = match[1]
        const snake = to_snake_case(name)
        if (name !== snake) {
          changes.push({ line: idx + 1, from: name, to: snake })
        }
      })
    })
    
    // Display changes
    if (changes.length === 0) {
      console.log('✅ No changes needed!')
    } else {
      console.log(`\n📝 ${changes.length} changes would be made:\n`)
      changes.forEach(change => {
        console.log(`  Line ${change.line}: ${change.from} → ${change.to}`)
      })
    }
    
    // Show a preview of what the file would look like
    console.log('\n📄 Preview of changes:')
    console.log('-'.repeat(80))
    
    let preview = content
    changes.forEach(change => {
      const regex = new RegExp(`\\b${change.from}\\b`, 'g')
      preview = preview.replace(regex, change.to)
    })
    
    // Show first 20 lines
    const preview_lines = preview.split('\n').slice(0, 20)
    preview_lines.forEach((line, idx) => {
      console.log(`${(idx + 1).toString().padStart(3)}: ${line}`)
    })
    
    console.log('\n✨ Test complete! No files were modified.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the test
test_conversion()