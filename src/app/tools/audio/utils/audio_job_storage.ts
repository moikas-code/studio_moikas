interface StoredAudioJob {
  job_id: string
  created_at: string
  expires_at: string
  total_chunks: number
  extracted_text: string
  voice_settings: {
    selected_voice?: string
    voice_clone_url?: string
    exaggeration?: number
    cfg?: number
    temperature?: number
    high_quality?: boolean
    use_seed?: boolean
    seed?: number
  }
}

const STORAGE_KEY = 'studio_moikas_audio_jobs'
const EXPIRATION_DAYS = 7

export class AudioJobStorage {
  static save_job(job_id: string, extracted_text: string, voice_settings: Record<string, unknown>, total_chunks: number): void {
    try {
      const jobs = this.get_all_jobs()
      const now = new Date()
      const expires_at = new Date(now.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
      
      const new_job: StoredAudioJob = {
        job_id,
        created_at: now.toISOString(),
        expires_at: expires_at.toISOString(),
        total_chunks,
        extracted_text,
        voice_settings
      }
      
      // Add new job
      jobs[job_id] = new_job
      
      // Clean expired jobs while we're at it
      this.clean_expired_jobs(jobs)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
    } catch (error) {
      console.error('Failed to save audio job to localStorage:', error)
    }
  }
  
  static get_job(job_id: string): StoredAudioJob | null {
    try {
      const jobs = this.get_all_jobs()
      const job = jobs[job_id]
      
      if (!job) return null
      
      // Check if expired
      if (new Date(job.expires_at) < new Date()) {
        this.remove_job(job_id)
        return null
      }
      
      return job
    } catch (error) {
      console.error('Failed to get audio job from localStorage:', error)
      return null
    }
  }
  
  static remove_job(job_id: string): void {
    try {
      const jobs = this.get_all_jobs()
      delete jobs[job_id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
    } catch (error) {
      console.error('Failed to remove audio job from localStorage:', error)
    }
  }
  
  static get_recent_jobs(): StoredAudioJob[] {
    try {
      const jobs = this.get_all_jobs()
      const valid_jobs = Object.values(jobs).filter(job => 
        new Date(job.expires_at) > new Date()
      )
      
      // Sort by created_at descending (most recent first)
      return valid_jobs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } catch (error) {
      console.error('Failed to get recent audio jobs:', error)
      return []
    }
  }
  
  private static get_all_jobs(): Record<string, StoredAudioJob> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Failed to parse stored audio jobs:', error)
      return {}
    }
  }
  
  private static clean_expired_jobs(jobs: Record<string, StoredAudioJob>): void {
    const now = new Date()
    for (const [job_id, job] of Object.entries(jobs)) {
      if (new Date(job.expires_at) < now) {
        delete jobs[job_id]
      }
    }
  }
  
  static clear_all(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear audio jobs from localStorage:', error)
    }
  }
}