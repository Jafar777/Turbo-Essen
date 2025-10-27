// models/Report.js
import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reporterName: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['restaurant', 'review'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  reason: {
    type: String,
    required: true,
    enum: ['spam', 'inappropriate', 'false_information', 'harassment', 'other']
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
ReportSchema.index({ targetType: 1, targetId: 1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);