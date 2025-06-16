# Prompt Moderation Implementation

## Overview
This document describes the implementation of AI-powered prompt moderation for image generation using grok-3-mini.

## Key Features

### 1. Content Policy
- **Allowed**: NSFW/adult content with consenting adults
- **Blocked**: 
  - Violence, gore, or extreme harm
  - Illegal activities or content
  - Any content involving minors
  - Non-consensual sexual content
  - Self-harm or suicide content
  - Non-consensual deepfakes of real people

### 2. Technical Implementation

#### Moderation Service (`/lib/utils/api/prompt_moderation.ts`)
- Uses grok-3-mini for AI-powered content analysis
- Redis caching to avoid re-checking identical prompts (1-hour TTL)
- Configurable confidence thresholds
- Admin bypass option
- Returns: `{ safe: boolean, violations: string[], confidence: number }`

#### Database Schema
- `moderation_logs` table tracks all moderation decisions
- Includes user reporting for false positives
- RLS policies ensure users can only see their own logs
- Admins can view all logs and statistics

#### API Integration
- Moderation check added to both sync (`/api/generate`) and async (`/api/image/generate`) routes
- Check occurs after rate limiting but before token deduction
- No tokens charged for blocked prompts
- Clear error messages explaining why content was blocked

### 3. Admin Features

#### Admin Dashboard (`/admin/moderation`)
- View all moderation decisions
- Filter by status, user, or violation type
- Review false positive reports
- Export data for analysis
- Real-time statistics:
  - Total checks and block rate
  - False positive rate
  - Violation breakdown
  - Daily trends

#### API Endpoints
- `/api/admin/moderation/stats` - Get moderation statistics
- `/api/admin/moderation/logs` - List moderation logs with filtering
- `/api/admin/moderation/logs/[id]/review` - Review false positive reports

### 4. User Experience
- Clear error messages: "Content blocked: This prompt contains [violation type]"
- Explicit note that adult content IS allowed
- Toast notifications with extended duration for moderation errors
- False positive reporting mechanism (future enhancement)

### 5. Performance Optimizations
- Redis caching reduces API calls
- Admin users can optionally skip moderation
- Low-latency grok-3-mini model
- Efficient database queries with proper indexing

## Usage

### For Users
When a prompt is blocked, users will see a clear message explaining:
1. What type of content was detected
2. That adult content with consenting adults IS allowed
3. What types of content are not permitted

### For Admins
1. Access the moderation dashboard at `/admin/moderation`
2. Monitor block rates and false positives
3. Review flagged content
4. Adjust thresholds if needed

## Testing
- Unit tests cover core moderation logic
- Integration tests verify API behavior
- Test cases ensure adult content passes while harmful content is blocked

## Security Considerations
- All moderation decisions are logged for audit
- User prompts are stored securely with proper access controls
- Admin-only access to sensitive moderation data
- Service defaults to "safe" on errors to avoid false positives

## Future Enhancements
1. User-facing false positive reporting UI
2. Batch moderation for multiple prompts
3. Custom violation categories
4. A/B testing framework for threshold optimization
5. Webhook notifications for high-risk content