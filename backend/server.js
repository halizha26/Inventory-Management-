require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- DAFTAR IMPORT ROUTER ---
const userRouter = require('./routes/UserRouter');
const productRouter = require('./routes/ProductRouter');
const stockRouter = require('./routes/StockRouter');
const reportRouter = require('./routes/ReportRouter');
const exportRouter = require('./routes/ExportRouter');
const exchangeRateRoute = require('./routes/exchangeRateRoute');

// 👇 TAMBAHAN: Import Router Notifikasi
const notificationRouter = require('./routes/NotificationRouter');

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased to 5000 for local development/dashboard usage
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));

// --- DAFTAR PENGGUNAAN ROUTES ---
app.use('/api/auth', userRouter);
app.use('/api/products', productRouter);
app.use('/api/stock', stockRouter);
app.use('/api/reports', reportRouter);
app.use('/api/export', exportRouter);
app.use('/api/exchange-rate', exchangeRateRoute);

// 👇 TAMBAHAN: Daftarkan jalur API Notifikasi
app.use('/api/notifications', notificationRouter);


// Global Error Handler
const globalErrorHandler = require('./middlewares/GlobalErrorHandler');
app.use(globalErrorHandler);