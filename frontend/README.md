# Conference Boss Challenge - Frontend

React + Vite web application optimized for iPad. Users record 15-second audio responses, get AI-scored and roasted, and compete on a leaderboard.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Axios** - API calls

## Quick Start

See [PHASE_0_SETUP.md](../PHASE_0_SETUP.md) in the root directory for complete setup instructions.

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API endpoint
```

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000/

### Test on iPad

1. Note the Network URL from `npm run dev` output (e.g., `http://192.168.1.x:3000/`)
2. On iPad Safari, navigate to that URL
3. Test audio recording (Phase 2+)

## Project Structure

```
src/
├── pages/           # Challenge & Leaderboard pages
├── components/      # Reusable UI components
├── hooks/           # Custom React hooks
├── services/        # API integration
├── utils/           # Constants & validators
├── App.jsx          # Main app component
└── main.jsx         # Entry point
```

## Development Status

**Phase 0:** ✅ Project setup and mock UI complete
**Phase 2:** 🚧 Full implementation coming in sessions 2.1-2.4

## Environment Variables

Required in `.env`:
- `VITE_API_BASE_URL` - Your API Gateway endpoint from backend deployment

## Build for Production

```bash
npm run build
```

Output in `dist/` directory.

## Available Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests (Phase 3)
- `npm run lint` - Lint code
