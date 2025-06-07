'use client'

import { useJobNotifications } from '@/hooks/use_job_notifications'

export default function JobNotifications() {
  // Initialize the real-time job notifications
  useJobNotifications()
  
  // This component doesn't render anything visible
  // It just sets up the real-time subscriptions
  return null
}