# Admin Mini Game Setup

## Environment Variable

Add to `admin/.env`:

```bash
PUBLIC_GAME_API_URL=http://localhost:8000
```

Or for production:

```bash
PUBLIC_GAME_API_URL=https://memory-game.tramphim.com
```

## Access

Navigate to: `http://localhost:4321/mini-game`

## Features

- ✅ Webhook configuration (URL, secret, points)
- ✅ Game statistics dashboard
- ✅ Leaderboard view
- ✅ Best scores table
- ✅ Test webhook function

## Usage

1. **Configure Webhook**:
   - Enter your tramphim backend URL
   - Set the webhook secret (must match backend)
   - Configure points for win/loss
   - Click "Test Webhook" to verify
   - Click "Lưu cài đặt" to save

2. **View Statistics**:
   - Total games played
   - Total players
   - Average score
   - Average moves

3. **Monitor Leaderboard**:
   - See top players by best score
   - View player emails and game count

## Files Created

- `src/components/MiniGameAdmin.jsx` - Main admin component
- `src/pages/mini-game.astro` - Page route
- Updated `src/components/Navigation.jsx` - Added menu item
