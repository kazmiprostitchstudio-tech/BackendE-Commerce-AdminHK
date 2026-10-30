const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Routes Import
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Central API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Successfully Connected!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Base Route
app.get('/', (req, res) => {
  res.send('🚀 E-commerce & Admin Shared Enterprise Backend API Running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Vercel Serverless Function Export
module.exports = app;