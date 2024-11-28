import mongoose, { Schema } from 'mongoose';

const profileSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  profession: { 
      type: String, 
      required: true, 
      enum: ['student', 'mentor'] 
  },

  // Common Fields for both Students and Mentors
  address: {
    type: String,
  },
  contact: {
    type: String,
  },
  linkedInProfile: {
    type: String,
  },
  githubProfile: {
    type: String,
  },


  ugCollege: {
    type: String,
  },
  ugYearOfPassing: {
    type: Number,
  },
  pgCollege: {
    type: String,
  },
  pgYearOfPassing: {
    type: Number,
  },
  currentCompany: {
    type: String,
  },
  jobRole: {
    type: String,
  },
  skills: {
    type: [String],
  },
  exCompany: {
    type: String,
  },
  workExperience: {
    type: String,
  },

  // Common Fields
  extraActivities: {
    type: String,
  },
  about: {
    type: String,
  },
  futurePlans: {
    type: String,
  },
});

export const Profile = mongoose.model('Profile', profileSchema);
