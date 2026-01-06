import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this user.'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email address for this user.'],
        maxlength: [100, 'Email cannot be more than 100 characters'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password for this user.'],
    },
    // Hybrid Sync Fields
    resume: { type: String, default: '' },
    jobDescription: { type: String, default: '' },
    targetCompany: { type: String, default: '' },
    role: { type: String, default: '' },
    interviewHistory: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Flexible array for history
}, {
    timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
