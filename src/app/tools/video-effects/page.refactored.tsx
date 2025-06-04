'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/app/components/navbar'
import { PromptInputBar } from './components/prompt_input_bar'
import { VideoSettingsPanel } from './components/video_settings_panel'
import { VideoProgressIndicator } from './components/video_progress_indicator'
import { VideoResultDisplay } from './components/video_result_display'
import { use_video_settings } from './hooks/use_video_settings'
import { use_job_polling } from './hooks/use_job_polling'
import { use_file_upload } from './hooks/use_file_upload'
import { 
  VIDEO_MODELS, 
  sort_models_by_cost, 
  video_model_to_legacy_model 
} from '@/lib/generate_helpers'
import toast, { Toaster } from 'react-hot-toast'

export default function VideoEffectsPage() {
  const router = useRouter()
  const [prompt, set_prompt] = useState('')
  const [is_generating, set_is_generating] = useState(false)
  const [is_enhancing, set_is_enhancing] = useState(false)
  
  // Get sorted models
  const sorted_models = sort_models_by_cost(
    VIDEO_MODELS.map(video_model_to_legacy_model)
  ).filter(m => !m.is_image_to_video)
  
  // Custom hooks
  const video_settings = use_video_settings(sorted_models[0]?.value || '')
  const job_polling = use_job_polling()
  const file_upload = use_file_upload()
  
  const selected_model = sorted_models.find(m => m.value === video_settings.model_id)
  
  // Handle prompt enhancement
  const handle_enhance = async () => {
    if (!prompt.trim()) return
    
    set_is_enhancing(true)
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      if (!response.ok) throw new Error('Enhancement failed')
      
      const data = await response.json()
      set_prompt(data.enhanced_prompt)
      toast.success('Prompt enhanced!')
    } catch (error) {
      toast.error('Failed to enhance prompt')
    } finally {
      set_is_enhancing(false)
    }
  }
  
  // Handle video generation
  const handle_generate = async () => {
    if (!prompt.trim()) return
    
    set_is_generating(true)
    job_polling.clear_job()
    
    try {
      // Upload image if present
      let image_url: string | undefined
      if (file_upload.image_file) {
        const base64 = await file_upload.handle_file_select(file_upload.image_file)
        if (base64) {
          const upload_res = await fetch('/api/video-effects/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          })
          
          if (!upload_res.ok) throw new Error('Image upload failed')
          
          const upload_data = await upload_res.json()
          image_url = upload_data.url
        }
      }
      
      // Generate video
      const response = await fetch('/api/video-effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: video_settings.model_id,
          aspect_ratio: video_settings.aspect,
          duration: video_settings.duration,
          image_url
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Generation failed')
      }
      
      const data = await response.json()
      job_polling.start_job(data.job_id)
      toast.success('Video generation started!')
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      set_is_generating(false)
    }
  }
  
  // Reset for new video
  const handle_new_video = () => {
    job_polling.clear_job()
    set_prompt('')
    file_upload.clear_file()
  }
  
  const is_loading = is_generating || job_polling.job_in_progress
  const video_url = job_polling.status?.video_url
  
  return (
    <div className="min-h-screen bg-base-200">
      <Toaster position="top-center" />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">AI Video Effects</h1>
          <p className="text-base-content/70">
            Transform your ideas into stunning videos with AI
          </p>
        </div>
        
        {!video_url && !job_polling.job_in_progress && (
          <>
            <PromptInputBar
              prompt={prompt}
              on_prompt_change={set_prompt}
              on_submit={handle_generate}
              on_enhance={handle_enhance}
              on_file_select={file_upload.handle_file_select}
              on_settings_toggle={video_settings.toggle_settings}
              is_loading={is_loading}
              is_enhancing={is_enhancing}
              has_image={!!file_upload.image_file}
            />
            
            <VideoSettingsPanel
              is_open={video_settings.show_settings}
              aspect_slider={video_settings.aspect_slider}
              duration={video_settings.duration}
              on_aspect_change={video_settings.update_aspect}
              on_duration_change={video_settings.update_duration}
              model_cost={selected_model?.cost || 0}
            />
          </>
        )}
        
        {job_polling.job_in_progress && job_polling.job_id && (
          <VideoProgressIndicator
            job_id={job_polling.job_id}
            progress={job_polling.status?.progress}
          />
        )}
        
        {video_url && (
          <VideoResultDisplay
            video_url={video_url}
            on_new_video={handle_new_video}
          />
        )}
        
        {job_polling.error && (
          <div className="alert alert-error mt-4">
            <span>{job_polling.error}</span>
          </div>
        )}
      </main>
    </div>
  )
}