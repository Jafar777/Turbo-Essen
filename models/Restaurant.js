// models/Restaurant.js
import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: String,
  address: String,
  phone: String,
  cuisineType: String,
  isActive: {
    type: Boolean,
    default: true
  },
    promoCodes: [{
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: false
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: Date,
    usageLimit: Number,
    usedCount: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);