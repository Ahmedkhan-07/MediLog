import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            unique: true,
            sparse: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        fullName: {
            type: String,
            trim: true,
            default: '',
        },
        age: {
            type: Number,
            min: 0,
            max: 150,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other', ''],
            default: '',
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
            default: '',
        },
        height: {
            type: Number,
            min: 0,
        },
        weight: {
            type: Number,
            min: 0,
        },
        profileComplete: {
            type: Boolean,
            default: false,
        },
        // Optional health details
        diabetes: {
            hasCondition: { type: Boolean, default: false },
            type: { type: String, default: '' },
        },
        bloodPressure: {
            type: String,
            default: '',
        },
        allergies: {
            type: [String],
            default: [],
        },
        chronicConditions: {
            type: [String],
            default: [],
        },
        currentMedications: {
            type: [String],
            default: [],
        },
        emergencyContact: {
            name: { type: String, default: '' },
            phone: { type: String, default: '' },
            relation: { type: String, default: '' },
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
