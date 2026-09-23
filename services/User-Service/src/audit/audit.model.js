import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    performedBy: { type: String, required: false }, // ID of admin if action was performed by admin
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'PROFILE_UPDATED',
        'ADDRESS_CREATED',
        'ADDRESS_UPDATED',
        'ADDRESS_DELETED',
        'DEFAULT_ADDRESS_CHANGED',
        'SELLER_APPLICATION_SUBMITTED',
        'SELLER_PROFILE_UPDATED',
        'SELLER_APPROVED',
        'SELLER_REJECTED',
        'USER_STATUS_CHANGED',
        'USER_ROLE_CHANGED',
      ],
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'user_audit_logs',
  }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('UserAuditLog', auditLogSchema);
