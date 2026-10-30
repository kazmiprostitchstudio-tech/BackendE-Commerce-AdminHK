const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Successfully Connected!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Test Route
app.get('/', (req, res) => {
  res.send('E-commerce & Admin Shared Backend API Running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});