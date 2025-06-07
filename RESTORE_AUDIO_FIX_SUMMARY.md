# Document Restore Audio URL Fix Summary

## Problem
When documents were restored, the audio URLs remained null even though the jobs were marked as completed in the database.

## Solution
Modified both audio status endpoints to more aggressively check fal.ai for completed jobs that have null audio URLs.

## Key Changes

### 1. Skip Status Check for Completed Jobs Without Audio
If a job is marked as "completed" in our database but has no audio URL, we now:
- Skip the `fal.queue.status` call (saves time)
- Go directly to `fal.queue.result` to fetch the audio URL
- This ensures we always try to recover missing audio URLs

```typescript
if (job.status === 'completed' && !job.audio_url) {
  console.log(`Job ${job_id} is marked completed but has no audio URL - skipping status check`)
  fal_status = { status: 'COMPLETED' }
} else {
  // Normal status check
  fal_status = await fal.queue.status(...)
}
```

### 2. Enhanced Logging
Added detailed logging to track:
- When jobs are checked
- Why they're being checked
- What's found in fal.ai responses
- When database updates occur

### 3. Always Update When Audio URL Changes
The code now updates the database if:
- The audio URL was null and we found one
- The audio URL has changed

### 4. Better Error Handling
- Added error logging for database update failures
- Continue processing even if individual chunk updates fail

## Expected Behavior

When a document is restored:
1. The status endpoint checks each chunk
2. For any chunk marked "completed" but missing audio URL:
   - Fetches the result directly from fal.ai
   - Updates the database with the audio URL
   - Returns the updated status to the client
3. The audio player receives all audio URLs and can play the chunks

## Testing

1. Create a document audio job
2. Wait for it to complete
3. Clear local storage or use a different browser
4. Restore the job from the "Previous Jobs" list
5. Check server logs for messages like:
   - "Chunk audio_chunk_xxx is marked completed but has no audio URL - skipping status check"
   - "Chunk audio_chunk_xxx is completed but may need audio URL - fetching result from fal.ai"
   - "Successfully updated chunk audio_chunk_xxx with audio URL"
6. The audio should now be playable