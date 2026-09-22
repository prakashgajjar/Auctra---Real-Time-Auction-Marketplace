import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    ip: { type: String, required: true },
    userAgent: { type: String, default: '' },
    device: { type: String, default: '' },
    location: { type: String, default: null },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    failureReason: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: 'login_history', versionKey: false, timestamps: false }
);

// Auto-delete after 90 days
loginHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

export default LoginHistory;
