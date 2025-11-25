# ShyftOff Admin Portal

A modern web-based application for managing agents, campaigns, and tracking KPIs built with Next.js, TypeScript, and SQLite.

## Features

### Admin Portal
- **Agent Management**: Create, update, and delete agents
- **Campaign Assignments**: Assign agents to campaigns in a single unified interface
- **Real-time Updates**: View all agent properties and their campaign assignments together

### Customer Dashboard
- **KPI Tracking**: View hours worked grouped by day, week, and month
- **Interactive Charts**: Beautiful visualizations using Recharts
- **Gamification Elements**:
  - Level system based on hours worked
  - XP progress tracking
  - Achievement badges
  - Daily streak counter
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Database**: SQLite with better-sqlite3
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Date Utilities**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. The database file should be located at `db/shyftoff.db`. If you have an existing SQLite database file, place it at `db/shyftoff.db`. The application will use your existing database and only create missing tables if needed.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
shyft-admin/
├── app/
│   ├── api/              # API routes
│   │   ├── agents/       # Agent CRUD operations
│   │   ├── campaigns/    # Campaign operations
│   │   ├── campaign-agents/ # Assignment operations
│   │   └── kpi/          # KPI data endpoints
│   ├── admin/            # Admin portal page
│   ├── customer/         # Customer dashboard page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page with role selection
│   └── globals.css       # Global styles
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── db.ts             # Database connection and setup
│   └── utils.ts          # Utility functions
├── db/                   # SQLite database directory (place your shyftoff.db here)
└── package.json
```

## Database Schema

### Tables

- **agent**: Stores agent information (id, first_name, last_name, email, is_active, created_at)
- **campaign**: Stores campaign information (id, name, description, is_active, created_at)
- **campaign_agent**: Junction table for agent-campaign assignments
- **campaign_kpi**: Stores hours worked data (campaign_id, agent_id, hours_worked, )

## Usage

### Admin Portal

1. Navigate to the Admin Portal from the home page
2. Click "Add Agent" to create new agents
3. For each agent card:
   - Click "Assign Campaign" to assign campaigns
   - Toggle agent status (active/inactive)
   - Delete agents (removes all assignments)

### Customer Dashboard

1. Navigate to the Customer Dashboard from the home page
2. Select a campaign to view KPIs
3. Switch between Daily, Weekly, and Monthly views
4. Track your progress with:
   - Level and XP system
   - Daily streak counter
   - Achievement badges
   - Interactive charts

## API Endpoints

- `GET /api/agents` - Get all agents
- `POST /api/agents` - Create new agent
- `PUT /api/agents` - Update agent
- `DELETE /api/agents?id={id}` - Delete agent
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaign-agents` - Get assignments (optional: ?agentId={id} or ?campaignId={id})
- `POST /api/campaign-agents` - Create assignment
- `DELETE /api/campaign-agents?id={id}` - Delete assignment
- `GET /api/kpi?campaignId={id}&groupBy={day|week|month}` - Get KPI data

## Building for Production

```bash
npm run build
npm start
```

## Notes

- The database file (`data/shyftoff.db`) is gitignored. If you have an existing database, place it in the `data/` directory.
- Sample data is automatically generated on first run if the database doesn't exist.
- The application uses SQLite in WAL mode for better concurrency.

## License

This is a technical assignment project.

