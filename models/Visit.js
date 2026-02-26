import mongoose from 'mongoose';

const PrescribedMedicineSchema = new mongoose.Schema({
    medicineName: { type: String, required: true },
    dosage: { type: String, default: '' },
    frequency: {
        type: String,
        enum: ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed', 'Weekly', ''],
        default: '',
    },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' },
    addedAt: { type: Date, default: Date.now },
});

const VisitSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        visitDate: {
            type: Date,
            required: true,
        },
        doctorName: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['Draft', 'Awaiting Doctor', 'Completed'],
            default: 'Draft',
        },

        // Clinical intake fields
        chiefComplaint: {
            type: String,
            required: [true, 'Chief complaint is required'],
        },
        problemStartDate: {
            type: Date,
        },
        onsetType: {
            type: String,
            enum: ['Sudden', 'Gradual', ''],
            default: '',
        },
        painLocation: {
            type: String,
            default: '',
        },
        painCharacter: {
            type: [String],
            enum: ['Sharp', 'Dull', 'Burning', 'Pressure', 'Throbbing', 'Cramping'],
            default: [],
        },
        severityScore: {
            type: Number,
            min: 1,
            max: 10,
        },
        aggravatingFactors: {
            type: String,
            default: '',
        },
        relievingFactors: {
            type: String,
            default: '',
        },
        associatedSymptoms: {
            type: [String],
            enum: ['Fever', 'Nausea', 'Vomiting', 'Fatigue', 'Dizziness', 'Shortness of breath', 'Headache', 'Loss of appetite'],
            default: [],
        },
        medicineTaken: {
            type: String,
            default: '',
        },
        similarEpisodeBefore: {
            type: Boolean,
            default: false,
        },
        similarEpisodeDetails: {
            type: String,
            default: '',
        },
        recentHistory: {
            type: String,
            default: '',
        },
        questionsForDoctor: {
            type: [String],
            default: [],
        },
        customNotes: {
            type: String,
            default: '',
        },
        aiGeneratedSummary: {
            type: String,
            default: '',
        },

        // Prescription
        prescribedMedicines: {
            type: [PrescribedMedicineSchema],
            default: [],
        },
        prescriptionImage: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);
