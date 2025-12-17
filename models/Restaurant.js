// models/Restaurant.js
import mongoose from 'mongoose';



const TableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true
  },
  chairs: {
    type: Number,
    default: 4,
    min: 2,
    max: 8
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'cleaning', 'unavailable'], // Add 'unavailable' here
    default: 'available'
  },
  section: {
    type: String,
    enum: ['main', 'terrace', 'vip', 'bar'],
    default: 'main'
  }
});

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
  isOpen: {
    type: Boolean,
    default: true
  },
  orderTypes: {
    type: [String],
    enum: ['dine_in', 'delivery', 'takeaway'],
    default: ['dine_in', 'delivery', 'takeaway']
  },
  openingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  // Table management - using a separate schema
  tables: [TableSchema],
  avatar: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  deliveryTime: {
    min: {
      type: Number,
      default: 30,
      min: 5,
      max: 180
    },
    max: {
      type: Number,
      default: 45,
      min: 10,
      max: 180
    }
  },
  deliveryFee: {
    type: Number,
    default: 2.99,
    min: 0,
    max: 50
  },
  freeDeliveryThreshold: {
    type: Number,
    default: 25,
    min: 0,
    max: 200
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
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Pre-save middleware to ensure tables array exists and is valid
RestaurantSchema.pre('save', function(next) {
  // Ensure tables array exists and is properly formatted
  if (!this.tables || !Array.isArray(this.tables)) {
    this.tables = [];
  }
  
  // Ensure each table has a number
  this.tables.forEach((table, index) => {
    if (!table.number) {
      table.number = index + 1;
    }
  });
  
  // Update totalTables from tables array length
  this.totalTables = this.tables.length;
  
  next();
});

// Validation to ensure max delivery time is greater than min
RestaurantSchema.pre('save', function(next) {
  if (this.deliveryTime && this.deliveryTime.max <= this.deliveryTime.min) {
    next(new Error('Maximum delivery time must be greater than minimum delivery time'));
  }
  next();
});

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);