// models/Order.js
import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  dishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  dishName: {
    type: String,
    required: true
  },
  dishImage: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  restaurantName: {
    type: String,
    required: true
  }
});

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  items: [OrderItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'stripe'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'on_the_way', 'delivered', 'rejected'],
    default: 'pending'
  },
  specialInstructions: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for restaurant orders and user orders
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);