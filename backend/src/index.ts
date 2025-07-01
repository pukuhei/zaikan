import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { initializeDatabase } from './models/database';
import { errorHandler } from './middleware/errorHandler';

// Routes
import partsRouter from './routes/parts';
import productsRouter from './routes/products';
import stockEntriesRouter from './routes/stockEntries';
import partOrdersRouter from './routes/partOrders';
import manufacturingRouter from './routes/manufacturing';
import salesRouter from './routes/sales';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/parts', partsRouter);
app.use('/api/products', productsRouter);
app.use('/api/stock-entries', stockEntriesRouter);
app.use('/api/orders', partOrdersRouter);
app.use('/api/manufacturing', manufacturingRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files (for production deployment)
const frontendPath = path.resolve(__dirname, '../../frontend/dist');
console.log(frontendPath);
console.log(path.join(frontendPath, 'index.html'));

app.use(express.static(frontendPath));

// Error handling for API routes
app.use('/api/*', errorHandler);

// Catch all handler: serve frontend for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
