// models/Review.js
import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  userName: {
    type: String,
    required: true
  },
  userImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per order
ReviewSchema.index({ orderId: 1 }, { unique: true });

// Index for restaurant reviews
ReviewSchema.index({ restaurantId: 1, createdAt: -1 });

// Index for user reviews
ReviewSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);