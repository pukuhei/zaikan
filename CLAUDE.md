# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"ざいかん！" (Zaikan) is a manufacturing inventory management system with a Vue.js 3 frontend and Express.js backend using SQLite. The application manages parts, products, manufacturing recipes, sales, and inventory tracking.
必ず日本語でお願いします

## Development Commands

### Setup and Installation
```bash
npm run install:all    # Install all dependencies (root, backend, frontend)
```

### Development Servers
```bash
npm run dev            # Start both frontend and backend concurrently
npm run backend:dev    # Start only backend (port 3001)
npm run frontend:dev   # Start only frontend (port 5173)
```

### Building
```bash
npm run build          # Build both frontend and backend
npm run backend:build  # Build backend TypeScript to dist/
npm run frontend:build # Build frontend for production
```

### Linting and Type Checking
```bash
cd backend && npm run lint       # Lint backend TypeScript
cd backend && npm run lint:fix   # Auto-fix backend linting issues
cd frontend && npm run lint      # Lint frontend Vue/TypeScript
cd frontend && npm run type-check # Type check frontend without emit
```

### Production
```bash
npm run start          # Start production backend server
```

## Architecture

### Monorepo Structure
- `backend/` - Express.js API server with SQLite database
- `frontend/` - Vue.js 3 SPA with Tailwind CSS
- `database/` - SQLite database file location (`zaikan.db`)

### Backend Architecture
- **Database**: SQLite with 7 tables (parts, products, product_recipes, stock_entries, part_orders, manufacturing_records, sales_records)
- **API**: RESTful endpoints organized by domain (parts, products, manufacturing, sales, orders)
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized error middleware

Key backend files:
- `src/models/database.ts` - Database initialization and connection
- `src/models/types.ts` - Zod validation schemas and TypeScript types
- `src/routes/` - API route handlers organized by domain
- `src/middleware/errorHandler.ts` - Global error handling

### Frontend Architecture
- **State Management**: Pinia stores for parts and products
- **Routing**: Vue Router with 6 main views
- **API Layer**: Axios-based service layer with typed interfaces
- **Styling**: Tailwind CSS with custom component classes

Key frontend files:
- `src/stores/` - Pinia stores for state management
- `src/services/api.ts` - Centralized API client with typed methods
- `src/types/index.ts` - TypeScript interfaces matching backend schemas
- `src/views/` - Main application pages
- `src/router/index.ts` - Route definitions

### Database Schema
The SQLite database uses foreign key constraints and consists of:
- Parts (inventory items used in manufacturing)
- Products (finished goods for sale)
- Product Recipes (parts required to manufacture products)
- Stock Entries (inventory additions)
- Part Orders (procurement management)
- Manufacturing Records (production tracking)
- Sales Records (sales transactions)

## Important Development Notes

### Port Configuration
- Backend runs on port 3001 (configurable via PORT env var)
- Frontend dev server runs on port 5173
- Frontend proxy routes `/api/*` to backend

### Database Considerations
- SQLite database auto-initializes on first backend startup
- Database file created at `database/zaikan.db`
- All database queries use `as any` type assertion for SQLite result objects
- Foreign key constraints are enabled

### TypeScript Configuration
- Backend: CommonJS module system, strict TypeScript
- Frontend: ES modules, Vue 3 + TypeScript setup
- Shared type definitions should match between frontend types and backend Zod schemas

### Development Workflow
1. Manufacturing flow: Parts → Product Recipes → Manufacturing → Sales
2. Parts have current stock, minimum stock alerts, and ordering capabilities
3. Products require recipes (parts + quantities) before manufacturing
4. Manufacturing consumes parts inventory and increases product inventory
5. Sales consume product inventory and generate revenue records

### Deployment
- Configured for Vercel deployment with `vercel.json`
- Frontend builds to static files, backend runs as serverless functions
- SQLite database persistence depends on deployment platform capabilities
