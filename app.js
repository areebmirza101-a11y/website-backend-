require('dotenv').config();
require('express-async-errors');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const path = require('path');
const cors = require('cors');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');

const errorHandler = require('./middleware/error');

const app = express();

// Behind a reverse proxy (Cloudflare/Vercel/Nginx) so req.ip resolves to the
// real client address (needed for geo-IP analytics), not the proxy's.
app.set('trust proxy', true);

app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://velmorascreation.com', 'https://www.velmorascreation.com'] }));
app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const os = require('os');
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;
const staticUploadsDir = isServerless 
  ? path.join(os.tmpdir(), 'uploads') 
  : path.join(__dirname, 'uploads');

app.use('/uploads', express.static(staticUploadsDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/track', require('./routes/track'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/hero', require('./routes/heroContent'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/size-guides', require('./routes/sizeGuides'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/sitemap.xml', require('./routes/sitemap'));
app.use((req, res, next) => next(createError(404, 'Route not found')));
app.use(errorHandler);

module.exports = app;
