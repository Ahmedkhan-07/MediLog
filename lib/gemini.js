import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_MODEL = 'gemini-1.5-flash';

const MEDBOT_SYSTEM_PROMPT = `You are MedBot, a clinical AI assistant inside MediLog. You communicate exactly like a doctor in a consultation — brief, direct, and focused. You are not a doctor and never claim to be one.

COMMUNICATION STYLE — STRICT RULES:
- Never write paragraphs. Ever.
- Always use short lines, bullet points, or numbered lists
- Ask one focused question at a time
- Sound like a doctor who has limited time and gets straight to the point
- Use simple language — no medical jargon unless necessary
- Maximum 6 lines per response
- If you need more information ask for it directly before giving any guidance

HOW TO RESPOND:
When a patient describes a symptom, respond like this pattern:
- Acknowledge in one short line
- Ask the single most important follow-up question
- Nothing else until they answer

When you have enough information respond like this pattern:
- What it likely could be in one line (never a diagnosis, say "could suggest" or "sounds like it might be")
- What they should do — short bullet list
- When to see a doctor — one line
- Any safe home measures if applicable — short bullet list

For medicines only say things like:
- "A doctor may consider paracetamol for fever"
- "Common OTC options for this include antacids"
- Never give specific dosages
- Never say "take X mg"
- Always say "confirm with your doctor or pharmacist"

ABSOLUTE RULES — NEVER BREAK THESE:
- Never write a paragraph
- Never diagnose definitively
- Never prescribe with dosages
- Never tell patient to stop a prescribed medicine
- Never discuss controlled substances
- For mental health crisis always say: "Please call iCall now: 9152987821"
- For emergencies always say: "Call 112 immediately" and stop the conversation

Do not add any disclaimer or warning line at the end of your responses.
The UI already displays a permanent disclaimer to the user.
End your response naturally without any warning text.`;

// ─── VISIT SUMMARY — uses Groq text only ─────────────────────────────────────

export async function generateVisitSummary(formData) {
    try {
        const prompt = `You are a clinical documentation assistant. Generate a structured doctor visit summary from the following patient-reported information. Be concise, professional, and medically accurate. Do not diagnose. Do not recommend treatments. Only organize what the patient has reported.

Patient: ${formData.patientName || 'Unknown'}, ${formData.patientGender || 'Unknown'}, ${formData.patientAge || 'Unknown'} years
Chief Complaint: ${formData.chiefComplaint || 'Not specified'}
Problem Started: ${formData.problemStartDate || 'Not specified'}, onset was ${formData.onsetType || 'Not specified'}
Location: ${formData.painLocation || 'Not specified'}
Character: ${Array.isArray(formData.painCharacter) && formData.painCharacter.length > 0 ? formData.painCharacter.join(', ') : 'Not specified'}
Severity: ${formData.severityScore || 'Not specified'}/10
Worsens with: ${formData.aggravatingFactors || 'Not reported'}
Improves with: ${formData.relievingFactors || 'Not reported'}
Associated Symptoms: ${Array.isArray(formData.associatedSymptoms) && formData.associatedSymptoms.length > 0 ? formData.associatedSymptoms.join(', ') : 'None'}
Medicines Already Taken: ${formData.medicineTaken || 'None'}
Similar Episode Before: ${formData.similarEpisodeBefore ? 'Yes - ' + (formData.similarEpisodeDetails || 'No details provided') : 'No'}
Recent History: ${formData.recentHistory || 'None'}
Current Conditions: ${Array.isArray(formData.activeConditions) && formData.activeConditions.length > 0 ? formData.activeConditions.join(', ') : 'None on record'}
Current Medications: ${Array.isArray(formData.activeMedications) && formData.activeMedications.length > 0 ? formData.activeMedications.join(', ') : 'None on record'}
Questions for Doctor: ${Array.isArray(formData.questionsForDoctor) && formData.questionsForDoctor.length > 0 ? formData.questionsForDoctor.map((q, i) => (i + 1) + '. ' + q).join('\n') : 'None'}
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

        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500,
        });

        const summary = response.choices[0]?.message?.content || '';
        return { success: true, summary };
    } catch (error) {
        console.error('Groq generateVisitSummary error:', error);
        return { success: false, error: 'Failed to generate summary. Please try again.' };
    }
}

// ─── CHAT RESPONSE — Groq for text, Gemini for image ─────────────────────────

export async function generateChatResponse(conversationHistory, imageData = null) {
    try {
        // If image is present use Gemini vision
        if (imageData && imageData.base64) {
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

            const latestMessage = conversationHistory[conversationHistory.length - 1];

            const result = await model.generateContent([
                {
                    text: MEDBOT_SYSTEM_PROMPT +
                        '\n\nThe patient has shared an image along with this message: ' +
                        (latestMessage?.content || 'Please analyze this image.') +
                        '\n\nDescribe what you visually observe in the image such as redness, swelling, rash, wound appearance, or any visible abnormality. Do not diagnose. Suggest the patient consult a doctor about what you describe.'
                },
                {
                    inlineData: {
                        data: imageData.base64,
                        mimeType: imageData.mimeType || 'image/jpeg',
                    }
                }
            ]);

            const reply = result.response.text();
            return { success: true, reply };
        }

        // No image — use Groq for text conversation
        const messages = [
            { role: 'system', content: MEDBOT_SYSTEM_PROMPT },
            ...conversationHistory.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content,
            }))
        ];

        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages,
            temperature: 0.5,
            max_tokens: 1000,
        });

        const reply = response.choices[0]?.message?.content || '';
        return { success: true, reply };
    } catch (error) {
        console.error('AI generateChatResponse error:', error);
        return { success: false, error: 'Failed to get response. Please try again.' };
    }
}

// ─── SESSION SUMMARY — uses Groq text only ───────────────────────────────────

export async function generateSessionSummary(conversationHistory) {
    try {
        const conversationText = conversationHistory
            .map(msg => `${msg.role === 'user' ? 'Patient' : 'MedBot'}: ${msg.content}`)
            .join('\n');

        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a medical documentation assistant. Summarize the following health consultation in 2-3 sentences. Be concise and clinical. Focus on the main symptom discussed and any guidance provided.',
                },
                {
                    role: 'user',
                    content: `Summarize this consultation:\n\n${conversationText}`,
                }
            ],
            temperature: 0.3,
            max_tokens: 200,
        });

        const summary = response.choices[0]?.message?.content || '';
        return { success: true, summary };
    } catch (error) {
        console.error('Groq generateSessionSummary error:', error);
        return { success: false, error: 'Failed to generate session summary.' };
    }
}

// ─── RED FLAG DETECTION ───────────────────────────────────────────────────────

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
