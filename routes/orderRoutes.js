const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// 1. PLACE NEW ORDER (E-Commerce Store Ke Liye)
router.post('/', async (req, res) => {
  try {
    const { customerDetails, orderItems, totalAmount, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items found!' });
    }

    // Atomic Stock Update - Automated Stock Management
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Stock low for product: ${product.title}`,
          });
        }
        product.stock -= item.quantity;
        await product.save();
      }
    }

    const newOrder = new Order({
      customerDetails,
      orderItems,
      totalAmount,
      paymentMethod,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: savedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET ALL ORDERS (Admin Panel Ke Liye)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. UPDATE ORDER STATUS (Admin Panel Ke Liye)
router.put('/:id/status', async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    const updatedOrder = await order.save();
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;