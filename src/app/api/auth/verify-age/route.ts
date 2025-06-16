import { NextRequest } from "next/server"
import { currentUser } from "@clerk/nextjs"
import { 
  handle_api_error,
  api_success
} from "@/lib/utils/api/response"
import {
  validate_request
} from "@/lib/utils/api/validation"
import {
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { z } from 'zod'

const age_verification_schema = z.object({
  birth_date: z.string().refine((date) => {
    const parsed = new Date(date)
    const now = new Date()
    // Birth date must be in the past and not more than 150 years ago
    return parsed < now && parsed > new Date(now.getFullYear() - 150, 0, 1)
  }, "Invalid birth date"),
  region: z.string().length(2).optional() // ISO country code
})

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await currentUser()
    if (!user) {
      return handle_api_error(new Error("Unauthorized"), "UNAUTHORIZED", 401)
    }

    // Validate request body
    const body = await req.json()
    const validated = validate_request(age_verification_schema, body)
    
    const supabase = get_service_role_client()
    
    // Get user's internal ID
    const { data: user_data, error: user_error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()
    
    if (user_error || !user_data) {
      return handle_api_error(
        new Error("User not found"),
        "USER_NOT_FOUND",
        404
      )
    }
    
    // Verify user age
    const { data: is_verified, error: verify_error } = await supabase
      .rpc('verify_user_age', {
        user_id: user_data.id,
        birth_date: validated.birth_date,
        region: validated.region || null
      })
    
    if (verify_error) {
      throw verify_error
    }
    
    if (!is_verified) {
      // User is underage - account has been deleted
      return handle_api_error(
        new Error("You must be at least 13 years old (16 in the EU) to use Studio Moikas"),
        "AGE_REQUIREMENT_NOT_MET",
        403
      )
    }
    
    // Update Clerk metadata to mark user as age verified
    try {
      await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          public_metadata: {
            age_verified: true,
            age_verified_at: new Date().toISOString()
          }
        })
      })
    } catch (clerk_error) {
      console.error('Failed to update Clerk metadata:', clerk_error)
      // Continue - age is verified in our database
    }
    
    return api_success({
      message: "Age verification successful",
      verified: true
    })
  } catch (error) {
    return handle_api_error(error)
  }
}