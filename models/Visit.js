import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
});

const VisitSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        doctorName: {
            type: String,
            required: [true, 'Doctor name is required'],
            trim: true,
        },
        hospitalName: {
            type: String,
            trim: true,
            default: '',
        },
        specialty: {
            type: String,
            required: [true, 'Specialty is required'],
            trim: true,
        },
        visitDate: {
            type: Date,
            required: [true, 'Visit date is required'],
        },
        originalSymptoms: {
            type: String,
            required: [true, 'Symptoms description is required'],
        },
        aiSummary: {
            type: String,
            default: '',
        },
        medicines: {
            type: [MedicineSchema],
            default: [],
        },
        prescriptionUrl: {
            type: String,
            default: '',
        },
        doctorNotes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);
