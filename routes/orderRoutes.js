const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Order = require('../models/Order');
const Product = require('../models/Product');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post('/', async (req, res) => {
  try {
    const { customerDetails, orderItems, totalAmount, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items found!' });
    }

    for (const item of orderItems) {
      if (item.product && item.product.length === 24) {
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
    }

    const newOrder = new Order({
      customerDetails,
      orderItems,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash on Delivery',
    });

    const savedOrder = await newOrder.save();

    const itemsListHtml = orderItems
      .map(
        (item) =>
          `<li><strong>${item.title || 'Product'}</strong> (Size: ${item.size || 'Standard'}, Color: ${item.color || 'Default'}) x ${item.quantity} — $${item.price * item.quantity}</li>`
      )
      .join('');

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        if (customerDetails && customerDetails.email) {
          await transporter.sendMail({
            from: `"SHOP.CO Store" <${process.env.EMAIL_USER}>`,
            to: customerDetails.email,
            subject: `Order Confirmed! #${savedOrder._id.toString().slice(-6).toUpperCase()}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #000;">Thank you for your order, ${customerDetails.name}!</h2>
                <p>Your order has been received and is being processed.</p>
                <p><strong>Order ID:</strong> ${savedOrder._id}</p>
                <h3>Order Summary:</h3>
                <ul>${itemsListHtml}</ul>
                <p style="font-size: 18px;"><strong>Total Amount:</strong> $${totalAmount}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod || 'Cash on Delivery'}</p>
                <p><strong>Shipping Address:</strong> ${customerDetails.address}, ${customerDetails.city || ''}</p>
                <hr />
                <p style="color: #666; font-size: 12px;">SHOP.CO E-Commerce Store</p>
              </div>
            `,
          });
        }

        await transporter.sendMail({
          from: `"SHOP.CO Orders" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: `New Order Received ($${totalAmount}) - ${customerDetails.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
              <h2 style="color: #0f172a;">New Order Placed on SHOP.CO</h2>
              <p><strong>Order ID:</strong> ${savedOrder._id}</p>
              <p><strong>Customer:</strong> ${customerDetails.name}</p>
              <p><strong>Email:</strong> ${customerDetails.email}</p>
              <p><strong>Phone:</strong> ${customerDetails.phone}</p>
              <p><strong>Address:</strong> ${customerDetails.address}, ${customerDetails.city || ''}</p>
              <h3>Items Ordered:</h3>
              <ul>${itemsListHtml}</ul>
              <p style="font-size: 18px;"><strong>Total Bill:</strong> $${totalAmount}</p>
            </div>
          `,
        });
      } catch (mailError) {
        console.error('Email sending failed:', mailError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Confirmation email sent.',
      order: savedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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