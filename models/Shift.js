// models/Shift.js
import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['chef', 'waiter', 'delivery'],
    required: true
  },
  shiftDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Format: "HH:mm"
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:mm'
    }
  },
  endTime: {
    type: String, // Format: "HH:mm"
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:mm'
    }
  },
  shiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'full_day'],
    default: 'full_day'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    default: ''
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    daysOfWeek: [{
      type: Number, // 0-6 for Sunday-Saturday
      min: 0,
      max: 6
    }],
    endDate: Date,
    occurrences: Number
  },
  totalHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  breakDuration: {
    type: Number, // in minutes
    default: 30
  },
  location: {
    type: String,
    default: 'Main Restaurant'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clockInTime: Date,
  clockOutTime: Date,
  actualHours: Number,
  overtimeHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
ShiftSchema.virtual('formattedDate').get(function() {
  return this.shiftDate.toISOString().split('T')[0];
});

// Virtual for formatted shift time
ShiftSchema.virtual('formattedTime').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual for calculating total hours
ShiftSchema.virtual('calculatedHours').get(function() {
  const start = parseInt(this.startTime.split(':')[0]) + parseInt(this.startTime.split(':')[1]) / 60;
  const end = parseInt(this.endTime.split(':')[0]) + parseInt(this.endTime.split(':')[1]) / 60;
  const total = end - start;
  return total > 0 ? total : total + 24; // Handle overnight shifts
});

// Pre-save middleware to calculate total hours
ShiftSchema.pre('save', function(next) {
  this.totalHours = this.calculatedHours;
  next();
});

// Static method to check for scheduling conflicts
ShiftSchema.statics.checkConflict = async function(employeeId, shiftDate, startTime, endTime, excludeShiftId = null) {
  const startMinutes = this.timeToMinutes(startTime);
  const endMinutes = this.timeToMinutes(endTime);
  
  const existingShifts = await this.find({
    employeeId,
    shiftDate,
    _id: { $ne: excludeShiftId },
    status: { $in: ['scheduled', 'confirmed'] }
  });

  return existingShifts.some(shift => {
    const existingStart = this.timeToMinutes(shift.startTime);
    const existingEnd = this.timeToMinutes(shift.endTime);
    
    return (startMinutes < existingEnd && endMinutes > existingStart);
  });
};

// Helper method to convert time to minutes
ShiftSchema.statics.timeToMinutes = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Indexes for performance
ShiftSchema.index({ restaurantId: 1, shiftDate: 1 });
ShiftSchema.index({ employeeId: 1, shiftDate: 1 });
ShiftSchema.index({ restaurantId: 1, status: 1 });
ShiftSchema.index({ shiftDate: 1, startTime: 1 });

export default mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);