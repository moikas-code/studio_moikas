# Studio Moikas Refactoring Plan

## Overview
This document outlines the comprehensive refactoring plan for the `/src` directory to align with the coding standards defined in CLAUDE.md.

## Critical Issues Identified

### 1. File Size Violations (60-line rule)
- **Critical**: 11 files exceed 400+ lines, with `image_editor.tsx` at 2722 lines
- **High Priority**: 20+ files between 200-400 lines
- **Total**: 50+ files violating the 60-line guideline

### 2. Naming Convention Violations
- 128+ files using camelCase instead of snake_case
- Affects variables, functions, and method names across the codebase

### 3. Missing Unit Tests
- Only 7 test files found (all in ai-agents module)
- 0% test coverage for:
  - API routes
  - React components
  - Utility functions
  - Database operations

### 4. Security Vulnerabilities
- No Zod validation on ANY API routes accepting JSON
- Direct environment variable access without validation
- Missing input sanitization
- Error messages potentially exposing sensitive information

### 5. Code Duplication (DRY Violations)
- Redis client initialization repeated across routes
- Authentication checks duplicated
- Error handling patterns repeated
- Rate limiting logic duplicated

## Refactoring Phases

### Phase 1: Critical Security & Infrastructure (Week 1)

#### 1.1 Create Core Utilities
```
src/lib/utils/
├── api/
│   ├── validation.ts       # Zod schemas for all API endpoints
│   ├── response.ts         # Standardized API responses
│   ├── auth.ts            # Centralized auth checks
│   └── rate_limiter.ts    # Rate limiting utilities
├── database/
│   ├── supabase.ts        # Supabase client factory
│   └── redis.ts           # Redis client singleton
├── errors/
│   ├── handlers.ts        # Error handling utilities
│   └── types.ts           # Error type definitions
└── security/
    ├── sanitization.ts    # Input sanitization
    └── validation.ts      # Security validation helpers
```

#### 1.2 API Validation Schemas
Create Zod schemas for all 17 API routes:
- `/api/generate` - Image generation request validation
- `/api/memu` - Workflow execution validation
- `/api/video-effects` - Video processing validation
- All webhook endpoints
- All other JSON-accepting routes

### Phase 2: Component Decomposition (Week 2)

#### 2.1 Break Down Mega-Files
**image_editor.tsx (2722 lines) → 15+ components:**
```
src/app/components/image_editor/
├── index.tsx                    # Main container (50 lines)
├── canvas/
│   ├── drawing_canvas.tsx       # Canvas component
│   ├── brush_controller.tsx     # Brush logic
│   └── layer_manager.tsx        # Layer management
├── tools/
│   ├── brush_tool.tsx          # Brush tool
│   ├── eraser_tool.tsx         # Eraser tool
│   ├── shape_tools.tsx         # Shape drawing
│   └── text_tool.tsx           # Text overlay
├── panels/
│   ├── color_picker.tsx        # Color selection
│   ├── layer_panel.tsx         # Layer UI
│   └── history_panel.tsx       # Undo/redo UI
└── utils/
    ├── canvas_utils.ts         # Canvas helpers
    └── image_processing.ts     # Image manipulation
```

#### 2.2 Refactor Other Large Files
- `image_generator.tsx` → 8 components
- `video-effects/page.tsx` → 10 components
- `workflow_agent.ts` → 6 modules
- All files over 200 lines → 3-5 modules each

### Phase 3: Naming Convention Migration (Week 3)

#### 3.1 Automated Conversion Script
Create a Bun script to:
1. Parse all TypeScript/JavaScript files
2. Identify camelCase variables/functions
3. Convert to snake_case
4. Update all references
5. Run tests to verify

#### 3.2 Manual Review Areas
- React component names (keep PascalCase)
- External API property names
- Database column references

### Phase 4: Testing Infrastructure (Week 4)

#### 4.1 Test Structure
```
src/__tests__/
├── unit/
│   ├── components/     # React component tests
│   ├── api/           # API route tests
│   ├── utils/         # Utility function tests
│   └── hooks/         # Custom hook tests
├── integration/
│   ├── workflows/     # End-to-end workflow tests
│   ├── auth/          # Authentication flow tests
│   └── payment/       # Payment flow tests
└── fixtures/          # Test data and mocks
```

#### 4.2 Testing Requirements
- Minimum 80% code coverage
- All API routes must have request/response tests
- All utilities must have unit tests
- Critical paths need integration tests

### Phase 5: Performance & Optimization (Week 5)

#### 5.1 Implement Caching Strategy
- Centralize Redis caching logic
- Add cache invalidation utilities
- Implement cache warming for common queries

#### 5.2 Database Optimization
- Review and optimize RLS policies
- Add database indexes where needed
- Implement connection pooling

## Implementation Priority

### Immediate Actions (Day 1-3)
1. Create validation schemas for all API routes
2. Implement centralized error handling
3. Create security utilities for input sanitization

### High Priority (Week 1)
1. Break down `image_editor.tsx` into components
2. Create core utility modules
3. Add authentication middleware

### Medium Priority (Week 2-3)
1. Convert naming conventions to snake_case
2. Refactor remaining large files
3. Implement comprehensive logging

### Long-term (Week 4-5)
1. Write unit tests for all modules
2. Add integration tests
3. Performance optimization

## Success Metrics
- All files under 60 lines
- 80%+ test coverage
- 0 security vulnerabilities
- All APIs validated with Zod
- Consistent snake_case naming
- No code duplication

## Migration Guide
Each refactoring phase will include:
1. Automated migration scripts where possible
2. Manual review checklist
3. Rollback procedures
4. Testing requirements

## Notes
- Maintain backwards compatibility during migration
- Use feature flags for gradual rollout
- Document all breaking changes
- Coordinate with team on deployment windows