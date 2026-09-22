import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        'REGISTER', 'LOGIN', 'LOGOUT', 'LOGOUT_ALL',
        'OTP_VERIFY', 'OTP_RESEND', 'TOKEN_REFRESH',
        'PASSWORD_CHANGE', 'PASSWORD_RESET',
        'ACCOUNT_DEACTIVATED', 'ACCOUNT_SUSPENDED',
      ],
    },
    ip: { type: String, required: true },
    userAgent: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: 'audit_logs', versionKey: false, timestamps: false }
);

// Auto-delete after 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
