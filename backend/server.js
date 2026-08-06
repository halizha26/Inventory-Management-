require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- DAFTAR IMPORT ROUTER ---
const startCronJobs = require('./utils/cronJobs');
const userRouter = require('./routes/UserRouter');
const productRouter = require('./routes/ProductRouter');
const stockRouter = require('./routes/StockRouter');
const reportRouter = require('./routes/ReportRouter');
const exportRouter = require('./routes/ExportRouter');
const salesOrderRoutes = require('./routes/salesOrderRoutes');

// 👇 PERBAIKAN: Menggunakan file exchangeRateRoutes.js yang baru kita buat
const exchangeRateRoutes = require('./routes/exchangeRateRoutes');

// Import Router Notifikasi & Kategori
const notificationRouter = require('./routes/NotificationRouter');
const categoryRouter = require('./routes/CategoryRouter');

// 👇 TAMBAHAN TAHAP 1: Import Router Setting (Untuk Kurs BI)
const settingRouter = require('./routes/settingRoute');

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
    console.log("Sistem Cron Job Otomatis Aktif");
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
app.use('/api/sales-orders', salesOrderRoutes);

// 👇 PERBAIKAN: Menggunakan endpoint '/api/exchange-rates' (Plural, sesuai dengan service frontend)
app.use('/api/exchange-rates', exchangeRateRoutes);

app.use('/api/notifications', notificationRouter);
app.use('/api/categories', categoryRouter);

// 👇 TAMBAHAN TAHAP 1: Daftarkan jalur API Setting (Kurs BI)
app.use('/api/settings', settingRouter);

// Global Error Handler
const globalErrorHandler = require('./middlewares/GlobalErrorHandler');
app.use(globalErrorHandler);