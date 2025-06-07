import { useEffect } from 'react'
import { createClient } from '@/lib/supabase_client'
import { toast } from 'react-hot-toast'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface JobUpdate {
  job_id: string
  status: string
  audio_url?: string
  video_url?: string
  error?: string
  metadata?: Record<string, unknown>
}

export function useJobNotifications() {
  const { userId } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!userId) return
    
    const supabase = createClient()
    
    // Subscribe to changes in audio_jobs table
    const audio_channel = supabase
      .channel('audio-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'audio_jobs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const job = payload.new as JobUpdate
          
          // Only show notifications for status changes
          if (payload.old && payload.old.status === job.status) return
          
          if (job.status === 'completed' && job.audio_url) {
            toast.success(
              <div 
                className="cursor-pointer"
                onClick={() => {
                  // Navigate to audio tool page
                  router.push('/tools/audio')
                  toast.dismiss()
                }}
              >
                <div className="font-semibold">🎵 Audio Ready!</div>
                <div className="text-sm opacity-90">Click to listen</div>
              </div>,
              {
                duration: 6000,
                position: 'bottom-right',
                style: {
                  background: '#10b981',
                  color: '#fff',
                }
              }
            )
          } else if (job.status === 'failed') {
            toast.error(
              <div>
                <div className="font-semibold">Audio Generation Failed</div>
                <div className="text-sm opacity-90">{job.error || 'Unknown error occurred'}</div>
              </div>,
              {
                duration: 8000,
                position: 'bottom-right'
              }
            )
          } else if (job.status === 'processing') {
            toast(
              <div>
                <div className="font-semibold">⏳ Processing Audio</div>
                <div className="text-sm opacity-90">This may take a few moments...</div>
              </div>,
              {
                duration: 4000,
                position: 'bottom-right',
                icon: '🎵'
              }
            )
          }
        }
      )
      .subscribe()
    
    // Subscribe to video_jobs changes
    const video_channel = supabase
      .channel('video-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_jobs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const job = payload.new as JobUpdate
          
          // Only show notifications for status changes
          if (payload.old && payload.old.status === job.status) return
          
          if (job.status === 'completed' && job.video_url) {
            toast.success(
              <div 
                className="cursor-pointer"
                onClick={() => {
                  // Navigate to video effects page
                  router.push('/tools/video-effects')
                  toast.dismiss()
                }}
              >
                <div className="font-semibold">🎬 Video Ready!</div>
                <div className="text-sm opacity-90">Click to view</div>
              </div>,
              {
                duration: 6000,
                position: 'bottom-right',
                style: {
                  background: '#10b981',
                  color: '#fff',
                }
              }
            )
          } else if (job.status === 'failed') {
            toast.error(
              <div>
                <div className="font-semibold">Video Generation Failed</div>
                <div className="text-sm opacity-90">{job.error || 'Unknown error occurred'}</div>
              </div>,
              {
                duration: 8000,
                position: 'bottom-right'
              }
            )
          } else if (job.status === 'processing') {
            toast(
              <div>
                <div className="font-semibold">⏳ Processing Video</div>
                <div className="text-sm opacity-90">This may take a few moments...</div>
              </div>,
              {
                duration: 4000,
                position: 'bottom-right',
                icon: '🎬'
              }
            )
          }
        }
      )
      .subscribe()
      
    // Log subscription status
    console.log('Job notifications subscribed for user:', userId)
    
    // Cleanup subscriptions on unmount
    return () => {
      console.log('Job notifications unsubscribed')
      supabase.removeChannel(audio_channel)
      supabase.removeChannel(video_channel)
    }
  }, [userId, router])
}