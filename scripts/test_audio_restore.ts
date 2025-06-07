#!/usr/bin/env bun

import { createClient } from '@supabase/supabase-js'

// This script simulates the document restore scenario to test if audio URLs are properly fetched

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test_audio_restore() {
  console.log('Testing audio restore functionality...\n')
  
  // Find a completed document job with chunks
  const { data: document_jobs, error: doc_error } = await supabase
    .from('audio_jobs')
    .select('*')
    .eq('type', 'document')
    .eq('status', 'completed')
    .limit(1)
    
  if (doc_error || !document_jobs || document_jobs.length === 0) {
    console.error('No completed document jobs found:', doc_error)
    return
  }
  
  const doc_job = document_jobs[0]
  console.log('Found document job:', {
    job_id: doc_job.job_id,
    status: doc_job.status,
    cost: doc_job.cost,
    text_length: doc_job.text?.length || 0
  })
  
  // Get chunks for this document
  const { data: chunks, error: chunk_error } = await supabase
    .from('audio_jobs')
    .select('job_id, status, audio_url, fal_request_id')
    .like('job_id', `audio_chunk_${doc_job.job_id}_%`)
    .order('metadata->chunk_index')
    
  if (chunk_error || !chunks) {
    console.error('Failed to get chunks:', chunk_error)
    return
  }
  
  console.log(`\nFound ${chunks.length} chunks:`)
  chunks.forEach((chunk, idx) => {
    console.log(`  Chunk ${idx}: ${chunk.job_id}`)
    console.log(`    Status: ${chunk.status}`)
    console.log(`    Has audio URL: ${!!chunk.audio_url}`)
    console.log(`    Has fal_request_id: ${!!chunk.fal_request_id}`)
  })
  
  // Simulate what happens when audio URLs are null - clear them
  console.log('\n--- Simulating missing audio URLs (clearing them) ---')
  for (const chunk of chunks) {
    const { error: update_error } = await supabase
      .from('audio_jobs')
      .update({ audio_url: null })
      .eq('job_id', chunk.job_id)
      
    if (update_error) {
      console.error(`Failed to clear audio URL for ${chunk.job_id}:`, update_error)
    }
  }
  console.log('Cleared audio URLs from all chunks')
  
  // Now call the status endpoint to see if it fetches the audio URLs
  console.log('\n--- Testing status endpoint ---')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Need to get a valid auth token - for testing, we'll use the service role approach
  const headers = {
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'x-user-id': doc_job.user_id // Pass the user ID for authentication
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/audio/document/status?job_id=${doc_job.job_id}`, {
      headers
    })
    
    if (!response.ok) {
      console.error('Status endpoint failed:', response.status, await response.text())
      return
    }
    
    const result = await response.json()
    console.log('\nStatus endpoint response:')
    console.log('  Job status:', result.data.status)
    console.log('  Total chunks:', result.data.total_chunks)
    console.log('  Total cost:', result.data.metadata?.total_cost)
    console.log('  Total text length:', result.data.metadata?.total_text_length)
    
    console.log('\nChunk statuses:')
    result.data.chunks.forEach((chunk: any, idx: number) => {
      console.log(`  Chunk ${idx}:`)
      console.log(`    Status: ${chunk.status}`)
      console.log(`    Has audio URL: ${!!chunk.audio_url}`)
      if (chunk.audio_url) {
        console.log(`    Audio URL: ${chunk.audio_url.substring(0, 50)}...`)
      }
    })
    
    // Check if audio URLs were restored
    const chunks_with_audio = result.data.chunks.filter((c: any) => c.audio_url).length
    console.log(`\n✓ ${chunks_with_audio} out of ${result.data.chunks.length} chunks have audio URLs`)
    
    if (chunks_with_audio === result.data.chunks.length) {
      console.log('\n✅ SUCCESS: All audio URLs were successfully restored!')
    } else {
      console.log('\n❌ FAILURE: Some audio URLs are still missing')
    }
    
  } catch (error) {
    console.error('Failed to call status endpoint:', error)
  }
}

// Run the test
test_audio_restore().catch(console.error)