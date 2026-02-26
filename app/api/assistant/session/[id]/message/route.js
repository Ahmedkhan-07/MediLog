import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AiConsultation from '@/models/AiConsultation';
import { generateChatResponse, checkRedFlags } from '@/lib/gemini';

export async function POST(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;
        const session = await AiConsultation.findOne({ _id: id, userId });

        if (!session) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        if (session.endedAt) {
            return NextResponse.json(
                { success: false, error: 'This session has ended. Please start a new session.' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const messageText = body.message || '';
        const imageBase64 = body.image || null;
        const imageMimeType = body.mimeType || 'image/jpeg';

        if (!messageText.trim() && !imageBase64) {
            return NextResponse.json(
                { success: false, error: 'Message text or image is required' },
                { status: 400 }
            );
        }

        // Append user message to session
        session.messages.push({
            role: 'user',
            content: messageText,
            hasImage: !!imageBase64,
            timestamp: new Date(),
        });

        // Build conversation history from ALL stored messages (including the one just pushed)
        const conversationHistory = session.messages.map((msg) => ({
            role: msg.role,
            content: msg.content || '',
        }));

        // Prepare image data if present
        const imageData = imageBase64 ? { base64: imageBase64, mimeType: imageMimeType } : null;

        // Call Gemini — generateChatResponse handles system prompt prepending internally
        const aiResult = await generateChatResponse(conversationHistory, imageData);

        const replyText = aiResult.success
            ? aiResult.reply
            : "I'm having trouble responding right now. Please try again.\n\n⚠️ AI-generated information only. Not a substitute for professional medical advice.";

        // Append AI response to session
        session.messages.push({
            role: 'assistant',
            content: replyText,
            hasImage: false,
            timestamp: new Date(),
        });

        // Check for red flags in user message
        if (checkRedFlags(messageText)) {
            session.redFlagTriggered = true;
        }

        await session.save();

        return NextResponse.json({
            success: true,
            data: {
                reply: replyText,
                redFlagTriggered: session.redFlagTriggered,
            },
        });
    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
