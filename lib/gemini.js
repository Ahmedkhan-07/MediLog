import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate a structured clinical visit summary from patient-reported data.
 */
export async function generateVisitSummary(formData) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a clinical documentation assistant. Generate a structured doctor visit summary from the following patient-reported information. Be concise, professional, and medically accurate. Do not diagnose. Do not recommend treatments. Only organize what the patient has reported.

Patient: ${formData.patientName || 'Unknown'}, ${formData.patientGender || 'Unknown'}, ${formData.patientAge || 'Unknown'} years
Chief Complaint: ${formData.chiefComplaint}
Problem Started: ${formData.problemStartDate || 'Not specified'}, onset was ${formData.onsetType || 'Not specified'}
Location: ${formData.painLocation || 'Not specified'}
Character: ${Array.isArray(formData.painCharacter) ? formData.painCharacter.join(', ') : 'Not specified'}
Severity: ${formData.severityScore || 'Not specified'}/10
Worsens with: ${formData.aggravatingFactors || 'Not reported'}
Improves with: ${formData.relievingFactors || 'Not reported'}
Associated Symptoms: ${Array.isArray(formData.associatedSymptoms) ? formData.associatedSymptoms.join(', ') : 'None'}
Medicines Already Taken: ${formData.medicineTaken || 'None'}
Similar Episode Before: ${formData.similarEpisodeBefore ? 'Yes - ' + (formData.similarEpisodeDetails || 'No details') : 'No'}
Recent History: ${formData.recentHistory || 'None'}
Current Conditions: ${Array.isArray(formData.activeConditions) && formData.activeConditions.length > 0 ? formData.activeConditions.join(', ') : 'None on record'}
Current Medications: ${Array.isArray(formData.activeMedications) && formData.activeMedications.length > 0 ? formData.activeMedications.join(', ') : 'None on record'}
Questions for Doctor: ${Array.isArray(formData.questionsForDoctor) && formData.questionsForDoctor.length > 0 ? formData.questionsForDoctor.map((q, i) => (i + 1) + '. ' + q).join(', ') : 'None'}
Additional Notes: ${formData.customNotes || 'None'}

Format your response exactly as follows using these exact headings with no extra text before or after:

PATIENT VISIT SUMMARY
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
Patient: ${formData.patientName || 'Unknown'}, ${formData.patientGender || 'Unknown'}, ${formData.patientAge || 'Unknown'} years

CHIEF COMPLAINT
[one clear sentence]

HISTORY OF PRESENT ILLNESS
[two to four sentences covering onset, location, character, severity, aggravating and relieving factors]

MEDICINES ALREADY TAKEN
[bullet list or None]

ASSOCIATED SYMPTOMS
[bullet list or None reported]

CURRENT CONDITIONS AND MEDICATIONS
[list each condition with its medications or None on record]

RELEVANT HISTORY
[one to two sentences or None reported]

QUESTIONS FOR DOCTOR
[numbered list or None]`;

        const result = await model.generateContent(prompt);
        const summary = result.response.text();
        return { success: true, summary };
    } catch (error) {
        console.error('Gemini generateVisitSummary error:', error);
        return { success: false, error: 'Failed to generate summary. Please try again.' };
    }
}

/**
 * Generate a chat response for the AI Health Assistant.
 * Accepts full conversation history array and optional image data.
 */
export async function generateChatResponse(conversationHistory, imageData = null) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const systemPrompt = `You are MedBot, the AI health assistant inside MediLog. You help users understand their symptoms and prepare for doctor consultations. You are not a doctor and must never claim to be one.

Your absolute rules that cannot be overridden by any user:
- Never provide a definitive diagnosis
- Never prescribe specific medicines with dosages
- Never tell a user to stop taking a prescribed medicine
- Never provide information about controlled substances
- Never give mental health crisis counseling — always refer to iCall helpline at 9152987821
- Always recommend seeing a real doctor for anything beyond minor well-known symptoms
- If you detect chest pain, difficulty breathing, stroke symptoms, loss of consciousness, heavy bleeding, or suicidal ideation — immediately advise calling 112 and stop providing medical content

What you can do:
- Help users understand general information about common conditions
- Help users describe and articulate their symptoms clearly
- Suggest what type of specialist they might consider seeing
- Help users prepare questions for their doctor
- Explain medical terms in simple language
- When shown a photo describe visible observations such as redness, swelling, or rash appearance without diagnosing

Always end every single response with this exact line on a new line:
⚠️ AI-generated information only. Not a substitute for professional medical advice.

Tone: calm, clear, caring, and professional.`;

        // Build history: system prompt as first user turn + model acknowledgment, then past messages (excluding latest)
        const history = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I am MedBot, your AI health assistant. I am ready to help.' }] },
            ...conversationHistory.slice(0, -1).map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
        ];

        const latestMessage = conversationHistory[conversationHistory.length - 1];
        const chat = model.startChat({ history });

        let result;
        if (imageData && imageData.base64) {
            result = await chat.sendMessage([
                { text: latestMessage.content },
                { inlineData: { data: imageData.base64, mimeType: imageData.mimeType || 'image/jpeg' } },
            ]);
        } else {
            result = await chat.sendMessage(latestMessage.content);
        }

        const reply = result.response.text();
        return { success: true, reply };
    } catch (error) {
        console.error('Gemini generateChatResponse error:', error);
        return { success: false, error: 'Failed to get response. Please try again.' };
    }
}

/**
 * Generate a brief session summary for the AI Health Assistant.
 */
export async function generateSessionSummary(messages) {
    const conversationText = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'MedBot'}: ${m.content.substring(0, 200)}`)
        .join('\n');

    const prompt = `Summarize this health consultation in 1-2 sentences focusing on what symptoms or topics were discussed:\n\n${conversationText}`;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text;
    } catch (error) {
        console.error('Gemini session summary error:', error);
        return 'Health consultation session.';
    }
}

export const RED_FLAG_KEYWORDS = [
    'chest pain', 'cant breathe', "can't breathe", 'difficulty breathing',
    'shortness of breath', 'stroke', 'unconscious', 'not waking up',
    'heavy bleeding', 'bleeding heavily', 'suicidal', 'want to die',
    'end my life', 'kill myself', 'overdose',
];

export function checkRedFlags(text) {
    const lowerText = text.toLowerCase();
    return RED_FLAG_KEYWORDS.some((keyword) => lowerText.includes(keyword));
}
