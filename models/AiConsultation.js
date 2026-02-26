import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: false, default: '' },
    hasImage: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
});

const AiConsultationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    disclaimerAccepted: { type: Boolean, required: true },
    disclaimerAcceptedAt: { type: Date },
    messages: { type: [MessageSchema], default: [] },
    redFlagTriggered: { type: Boolean, default: false },
    sessionSummary: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.AiConsultation || mongoose.model('AiConsultation', AiConsultationSchema);
