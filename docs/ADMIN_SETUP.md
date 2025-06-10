# Admin Dashboard Setup Guide

## Overview
The admin dashboard provides insights into app usage, user management, and revenue analytics.

## Features

### 1. Admin Dashboard (`/admin`)
- Overview of key metrics
- User statistics (total, paid, free, new users)
- Usage statistics by operation type
- Revenue metrics
- 30-day activity trends table

### 2. User Management (`/admin/users`)
- View all users with search capability
- See user details (email, plan, tokens, join date)
- Grant/revoke admin privileges
- Pagination for large user lists

### 3. Usage Analytics (`/admin/usage`)
- Real-time usage data
- Filter by operation type
- Token consumption tracking
- Detailed operation information

### 4. Revenue Analytics (`/admin/revenue`)
- Transaction history
- Revenue vs refunds
- Average transaction value
- Stripe payment tracking

## Setup Instructions

### 1. Apply Database Migration
Run the migration to add admin role support:
```bash
bun run supabase:db:push
```

### 2. Make Yourself an Admin
Option A - Using SQL:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

Option B - Using the provided script:
1. Edit `/scripts/make_admin.sql` with your email
2. Run it in Supabase Studio or via CLI

### 3. Access the Admin Dashboard
Once you have admin role, an "Admin" button will appear in the navbar.

## Security Features

- Admin role required for all admin routes
- Server-side authentication checks
- RLS policies prevent unauthorized access
- Audit logging for role changes
- Cannot remove your own admin role

## API Endpoints

- `GET /api/admin/check` - Check if current user is admin
- `GET /api/admin/analytics` - Get dashboard analytics
- `GET /api/admin/users` - List users with pagination
- `PATCH /api/admin/users/[id]/role` - Update user role
- `GET /api/admin/usage` - Get usage data
- `GET /api/admin/revenue` - Get revenue data

## Navigation

Admin users will see an "Admin" button in the navbar when logged in.

## Troubleshooting

1. **Can't access admin pages**: Ensure your user has `role = 'admin'` in the database
2. **API errors**: Verify all migrations have been applied successfully
3. **Admin button not showing**: Check browser console for errors, ensure you're logged in