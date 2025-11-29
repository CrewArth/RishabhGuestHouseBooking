import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'GUESTHOUSE_CREATED', 'GUESTHOUSE_UPDATED', 'GUESTHOUSE_DELETED',
        'MAINTENANCE_TOGGLED',
        'ROOM_CREATED', 'ROOM_UPDATED', 'ROOM_DELETED', 'ROOM_AVAILABILITY_TOGGLED',
        'BED_CREATED', 'BED_UPDATED', 'BED_DELETED', 'BED_AVAILABILITY_TOGGLED',
        'BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'USER_REGISTERED',
        'USER_UPDATED', 'USER_DELETED', 'USER_DEACTIVATED', 'USER_ACTIVATED', 
      ]
    },

    entityType: {
      type: String,
      required: true,
      enum: ['Booking','GuestHouse', 'Room', 'Bed', 'User']
    },

    entityId: {
      type: mongoose.Schema.Types.Mixed, // Can store ObjectId or number
      required: true
    },

    performedBy: {
      type: String, // Later can be changed to ObjectId (Admin reference)
      default: 'System'
    },

    details: {
      type: mongoose.Schema.Types.Mixed, // Any extra info (JSON, message, etc.)
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
