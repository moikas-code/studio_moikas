# Image Generation Billing System

## Overview

The image generation system uses a **deduct-on-completion** billing model where tokens (Mana Points) are only deducted after successful image generation, not when the job is created.

## Billing Types

### 1. Flat Rate Billing
- Fixed cost per image based on the model's `custom_cost` 
- Cost = `(custom_cost / 0.001) * num_images`
- Example: FLUX models charge a flat rate per image

### 2. Time-Based Billing
- Cost based on actual generation time in seconds
- Cost = `(custom_cost / 0.001) * billable_seconds * num_images`
- Supports minimum and maximum charge limits
- Example: Models that charge based on processing time

### 3. Megapixel-Based Billing (Future)
- Cost based on output image dimensions
- 1 megapixel = 1000x1000 pixels = 1 MP token
- Cost calculation: `width * height / 1,000,000 * rate_per_mp`

## Token Deduction Flow

1. **Job Creation**
   - User submits image generation request
   - System validates user has sufficient tokens (estimated cost)
   - Job is created with `status: 'pending'` and `tokens_deducted: false`
   - **No tokens are deducted at this stage**

2. **Job Processing**
   - Request sent to fal.ai for processing
   - Job status updates to `processing`
   - Webhook or polling monitors progress

3. **Job Completion**
   - When job completes successfully:
     - For time-based billing: Actual cost calculated from `inference_time`
     - Job marked as `completed` with `tokens_deducted: true`
     - Tokens deducted based on final cost
   - If job fails:
     - Job marked as `failed`
     - No tokens deducted

## Implementation Details

### Database Schema
```sql
-- image_jobs table includes:
tokens_deducted BOOLEAN DEFAULT FALSE  -- Prevents double deduction
cost INTEGER NOT NULL                  -- Estimated/final cost in MP
metadata JSONB                         -- Stores billing details
```

### Key Files
- `/api/image/generate/route.ts` - Creates jobs without deducting tokens
- `/api/webhooks/fal-ai/route.ts` - Deducts tokens on completion via webhook
- `/api/image/status/route.ts` - Deducts tokens on completion via polling

### Metadata Fields
For time-based billing, the following fields are stored in job metadata:
- `billing_type`: 'flat_rate' or 'time_based'
- `actual_inference_seconds`: Raw generation time from fal.ai
- `billable_seconds`: Time after min/max limits applied
- `base_mp_per_second`: Cost rate in MP per second
- `final_cost_mp`: Total cost in Mana Points
- `cost_adjustment_mp`: Difference from estimated cost

## Plan-Based Pricing

- **Free Users**: 50% upcharge on base rates
- **Standard Users**: Base rates
- **Admin Users**: No token deduction (unlimited)

## Benefits

1. **Fair Billing**: Users only pay for successful generations
2. **Accurate Time-Based Costs**: Actual generation time used, not estimates
3. **No Refunds Needed**: Failed jobs don't deduct tokens
4. **Transparent Pricing**: Users can see exact costs in job metadata

## Migration Notes

- Existing completed jobs have `tokens_deducted = true` to prevent double charging
- New jobs created after migration use deduct-on-completion model
- The `tokens_deducted` flag ensures idempotent token deduction