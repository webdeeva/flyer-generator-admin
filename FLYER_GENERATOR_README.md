# Flyer Generator App

An AI-powered flyer generation application using React, Clerk, Supabase, and Segmind GPT Image API.

## Setup Instructions

### 1. Environment Variables
Update the `.env.local` file with your actual keys:
- Get Clerk publishable key from [clerk.com](https://clerk.com)
- Supabase credentials are already provided
- Segmind API key is already provided

### 2. Clerk Setup
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Enable Stripe subscriptions in Clerk dashboard
4. Copy your publishable key to `.env.local`

### 3. Supabase Setup
Run the SQL from `database.sql` in your Supabase SQL editor to create tables.

Create a storage bucket named `user-uploads`:
1. Go to Supabase Storage
2. Create new bucket called `user-uploads`
3. Make it public

### 4. Run the Application
```bash
npm run dev
```

## Features Implemented

✅ **Authentication**: Clerk integration with sign up/sign in
✅ **Database Schema**: Base prompts, generations, and usage tracking
✅ **API Integration**: Segmind GPT image service
✅ **Prompt Configurator**: Dynamic UI for customizing prompts
✅ **Base Prompt System**: Pre-defined templates
✅ **Image Upload**: Upload and preview functionality
✅ **Gallery**: View and manage generated flyers
✅ **Dashboard**: Usage statistics and recent generations
✅ **Pricing Page**: Subscription tiers display

## Next Steps

1. **Complete Stripe Integration**: 
   - Set up Stripe products in Clerk dashboard
   - Update pricing page with actual checkout links

2. **Add Missing Features**:
   - Implement actual usage limits based on subscription
   - Add download functionality for different formats
   - Implement sharing features

3. **Backend Improvements**:
   - Add RPC function for incrementing usage
   - Set up scheduled job to reset monthly limits
   - Add admin panel for managing base prompts

4. **UI Enhancements**:
   - Add loading states
   - Improve error handling
   - Add mobile responsive navigation

## Project Structure
```
src/
├── components/
│   ├── Layout.jsx
│   └── PromptConfigurator.jsx
├── lib/
│   ├── supabase.js
│   └── segmind.js
├── pages/
│   ├── Dashboard.jsx
│   ├── Gallery.jsx
│   ├── Generator.jsx
│   ├── Landing.jsx
│   └── Pricing.jsx
└── App.jsx
```