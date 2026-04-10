# SoundVault

A premium cross-platform audio player app with cloud sync powered by Supabase.

## Features

- **Cross-device sync**: Your music, playlists, and favorites sync across all your devices
- **User authentication**: Secure email + password login
- **Cloud storage**: Audio files stored securely in Supabase Storage
- **Offline-first**: Play your music without internet (cached tracks)
- **Dark/Light mode**: Customizable theme
- **Full playback controls**: Play, pause, seek, volume, shuffle, repeat
- **Playlist management**: Create, edit, and organize playlists
- **Favorites**: Mark your favorite tracks
- **Recently played**: Track your listening history

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: CSS Modules with custom properties
- **State Management**: Zustand
- **Deployment**: Vercel

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned

### 2. Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL script

This will create:
- `tracks` table for audio file metadata
- `playlists` table for playlists
- `playlist_items` table for playlist-track relationships
- `favorites` table for favorited tracks
- `recently_played` table for play history
- `user_preferences` table for user settings
- All necessary indexes
- Row Level Security (RLS) policies
- Storage bucket configuration

### 3. Configure Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it `audio-files`
4. Set **Public** to `false` (files are accessed via authenticated URLs)
5. Add the following MIME types to allowed types:
   - `audio/mpeg`
   - `audio/wav`
   - `audio/mp4`
   - `audio/aac`
   - `audio/flac`
   - `audio/ogg`
   - `audio/x-m4a`

### 4. Get Your Supabase Credentials

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the **Project URL** and **anon public** key

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Or rename `.env.example` to `.env` and fill in your credentials.

### 6. Install Dependencies

```bash
npm install
```

### 7. Run Development Server

```bash
npm run dev
```

### 8. Build for Production

```bash
npm run build
```

## Vercel Deployment

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Set environment variables in Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in the Vercel dashboard
5. Deploy

### Configure Supabase Auth for Production

For production deployments, configure your Supabase Auth settings:

1. Go to **Authentication > URL Configuration** in Supabase
2. Add your Vercel deployment URL to **Site URL**
3. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   ```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `tracks` | Audio file metadata (title, artist, album, duration, storage path) |
| `playlists` | User playlists |
| `playlist_items` | Junction table linking playlists to tracks |
| `favorites` | User's favorited tracks |
| `recently_played` | User's play history |
| `user_preferences` | Theme, sort, and view preferences |

### Security

All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Storage files are protected by user-specific paths
- Anonymous access is blocked

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Troubleshooting

### "Track not available" error
- Make sure you're signed in
- Check if the audio file was uploaded successfully
- Verify your RLS policies are configured correctly

### Upload fails
- Check Supabase Storage bucket configuration
- Verify the file size doesn't exceed any limits
- Ensure the file type is allowed

### Auth issues
- Clear browser localStorage and cookies
- Check if email confirmation is required
- Verify Site URL in Supabase Auth settings

## License

MIT
