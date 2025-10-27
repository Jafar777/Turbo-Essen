// models/Restaurant.js
import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
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
  // Add table management fields
  totalTables: {
    type: Number,
    default: 10,
    min: 1
  },
  availableTables: {
    type: Number,
    default: 10,
    min: 0
  },
  // Add avatar and banner fields
  avatar: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
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
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  ratingCount: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate slug from name
RestaurantSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // replace spaces with -
      .replace(/-+/g, '-') // replace multiple - with single -
      .trim('-');
  }
  next();
});

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);