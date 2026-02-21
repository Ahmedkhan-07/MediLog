import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateMedicalSummary(symptomText) {
    const cleanSymptoms = symptomText.trim().substring(0, 200);
    const fallbackSummary = `Patient reports symptoms including: "${cleanSymptoms}${symptomText.length > 200 ? '...' : ''}". Requires clinical evaluation.`;

    if (!process.env.GEMINI_API_KEY) {
        return fallbackSummary;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a medical documentation assistant. Convert the following patient-described symptoms into a brief, structured, medically professional summary.
        
CRITICAL INSTRUCTIONS:
- Maximum 2 concise sentences.
- Use proper medical terminology.
- Do NOT diagnose — only rewrite the symptoms in clinical language.
- Start with "Patient presents with..." or "Patient reports..."

Patient's description:
"${symptomText}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API error:', error);
        return fallbackSummary;
    }
}
