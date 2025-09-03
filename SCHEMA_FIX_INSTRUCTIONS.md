# 🚨 Schema Fix Instructions

## **Problem Identified**
Your site is not loading because there's a **schema mismatch** between what the code expects and what exists in your Supabase database.

## **Root Cause**
The code references tables and views that don't exist in your current schema:
- Missing `posts` table (code still uses old posts system alongside cherries)
- Missing `user_reactions`, `enhanced_comments`, `bot_personalities` tables
- Missing `posts_view`, `communities_view` views
- Missing `communities`, `post_likes`, `comments` tables

## **Solution: Apply Missing Migrations**

### **Step 1: Apply Migration Files**
Run these SQL files in your Supabase SQL Editor in this order:

1. **`supabase/migrations/20240731000001_missing_tables.sql`**
   - Adds missing bot and social feature tables
   - Creates `user_reactions`, `enhanced_comments`, `bot_personalities`, etc.

2. **`supabase/migrations/20240731000002_missing_views.sql`**
   - Adds missing views like `posts_view`, `communities_view`
   - Creates enhanced cherry and bot interaction views

3. **`supabase/migrations/20240731000003_missing_posts_tables.sql`**
   - Adds missing `posts`, `communities`, `post_likes`, `comments` tables
   - These are needed for the old posts system that still exists in code

### **Step 2: Verify Schema Alignment**
After applying migrations, your database should have:

**Core Tables:**
- ✅ `profiles`, `cherries`, `branches`, `twigs`
- ✅ `friendships`, `cherry_likes`, `comments`
- ✅ `posts`, `communities`, `post_likes` (for backward compatibility)

**New Feature Tables:**
- ✅ `user_reactions`, `enhanced_comments`, `user_activity_cache`
- ✅ `bot_personalities`, `bot_interactions`, `bot_twins`
- ✅ `cherry_engagement`, `cherry_shares`, `bot_learning_patterns`
- ✅ `precomputed_connections`, `branch_cache`

**Views:**
- ✅ `cherries_view`, `public_cherries_view`, `friend_cherries_view`
- ✅ `posts_view`, `communities_view`, `enhanced_cherries_view`

### **Step 3: Test the Site**
After applying migrations:
1. Refresh your browser at `http://localhost:3000`
2. Check browser console for any remaining errors
3. Test core functionality: login, view cherries, create posts

## **Why This Happened**
The codebase evolved from a posts-based system to a cherries-based system, but:
- Some components still reference the old `posts` system
- New features were added that require additional tables
- The schema wasn't fully updated to match the code expectations

## **Prevention**
- Always run migrations when adding new features
- Keep schema and code in sync
- Test database connections before deploying new features

## **Need Help?**
If you still have issues after applying these migrations:
1. Check Supabase logs for specific error messages
2. Verify all tables exist with `\dt` in SQL Editor
3. Check RLS policies are properly applied
4. Ensure your `.env.local` has correct Supabase credentials
