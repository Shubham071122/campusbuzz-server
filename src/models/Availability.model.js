import mongoose from 'mongoose';

const { Schema } = mongoose;

const availabilitySchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timeZone: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  meetingMode: {
    type: String,
    required: true,
    enum: ['googleMeet', 'zoom'],
  },
  schedule: {
    type: Map,
    of: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
      },
    ],
    required: true,
  },
});

export const Availability = mongoose.model('Availability', availabilitySchema);
