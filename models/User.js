// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery', 'user'],
    default: 'user'
  },
  // Add restaurantId for employees (chef, waiter, delivery)
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: function() {
      return ['chef', 'waiter', 'delivery'].includes(this.role);
    }
  },
  image: {
    type: String,
    default: null
  },
isVerified: {
  type: Boolean,
  default: false
},
verificationCode: {
  type: String,
  select: false
},
verificationCodeExpires: {
  type: Date,
  select: false
}

}, {
  timestamps: true
});

// Create unique index for email
UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);