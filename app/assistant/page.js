'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import {
    Loader2, Send, Bot, ImagePlus, Mic, MicOff, Volume2, VolumeX,
    X, AlertTriangle, Phone, MessageSquare, Clock, ChevronLeft,
    Plus, LogOut, Shield,
} from 'lucide-react';

export default function AssistantPage() {
    // Session state
    const [showDisclaimer, setShowDisclaimer] = useState(true);
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [ending, setEnding] = useState(false);

    // Past sessions
    const [pastSessions, setPastSessions] = useState([]);
    const [showPastSessions, setShowPastSessions] = useState(false);
    const [viewingPastSession, setViewingPastSession] = useState(null);
    const [pastMessages, setPastMessages] = useState([]);
    const [loadingPast, setLoadingPast] = useState(false);

    // Image upload
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [imageMimeType, setImageMimeType] = useState(null);
    const [imageError, setImageError] = useState('');

    // Voice
    const [isRecording, setIsRecording] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Emergency
    const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);

    // End session modal
    const [showEndModal, setShowEndModal] = useState(false);
    const [endSummary, setEndSummary] = useState('');

    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-IN';
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText((prev) => prev + transcript);
                setIsRecording(false);
            };
            recognition.onerror = () => setIsRecording(false);
            recognition.onend = () => setIsRecording(false);
            recognitionRef.current = recognition;
        }
        fetchPastSessions();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    const fetchPastSessions = async () => {
        try {
            const res = await fetch('/api/assistant/session');
            const data = await res.json();
            if (data.success) {
                setPastSessions(data.data.sessions || []);
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        }
    };

    const handleAcceptDisclaimer = async () => {
        try {
            const res = await fetch('/api/assistant/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (data.success) {
                setSessionId(data.data.sessionId);
                setShowDisclaimer(false);
                setMessages([]);
                setViewingPastSession(null);
            }
        } catch (err) {
            console.error('Failed to start session:', err);
        }
    };

    const handleSend = async () => {
        if ((!inputText.trim() && !imageBase64) || !sessionId || sending) return;

        const userMessage = {
            role: 'user',
            content: inputText,
            hasImage: !!imageBase64,
            imagePreview: imagePreview,
        };
        setMessages((prev) => [...prev, userMessage]);
        const msgText = inputText;
        const imgB64 = imageBase64;
        const imgMime = imageMimeType;
        setInputText('');
        setImagePreview(null);
        setImageBase64(null);
        setImageMimeType(null);
        setSending(true);

        try {
            const body = { message: msgText };
            if (imgB64) {
                body.image = imgB64;
                body.mimeType = imgMime;
            }

            const res = await fetch(`/api/assistant/session/${sessionId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (data.success) {
                const aiMsg = { role: 'assistant', content: data.data.reply };
                setMessages((prev) => [...prev, aiMsg]);

                if (data.data.redFlagTriggered) {
                    setShowEmergencyBanner(true);
                }

                // Voice output
                if (!isMuted && window.speechSynthesis) {
                    const cleanText = data.data.reply.replace(/⚠️.*$/m, '').trim();
                    const utterance = new SpeechSynthesisUtterance(cleanText);
                    utterance.lang = 'en-IN';
                    utterance.rate = 0.95;
                    window.speechSynthesis.speak(utterance);
                }
            } else {
                setMessages((prev) => [...prev, {
                    role: 'assistant',
                    content: data.error || "Something went wrong. Please try again.\n\n⚠️ AI-generated information only. Not a substitute for professional medical advice.",
                }]);
            }
        } catch (err) {
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: "Failed to get a response. Please try again.\n\n⚠️ AI-generated information only. Not a substitute for professional medical advice.",
            }]);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageError('');

        if (!file.type.startsWith('image/')) {
            setImageError('Please select an image file only.');
            return;
        }
        if (file.size > 4 * 1024 * 1024) {
            setImageError('Image too large. Please select an image under 4MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setImagePreview(dataUrl);
            // Strip prefix to get raw base64
            const base64 = dataUrl.split(',')[1];
            setImageBase64(base64);
            setImageMimeType(file.type);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageBase64(null);
        setImageMimeType(null);
        setImageError('');
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const speakText = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/⚠️.*$/m, '').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-IN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    const handleEndSession = async () => {
        if (!sessionId || ending) return;
        setEnding(true);
        try {
            const res = await fetch(`/api/assistant/session/${sessionId}/end`, {
                method: 'POST',
            });
            const data = await res.json();
            if (data.success) {
                setEndSummary(data.data.summary);
                setShowEndModal(true);
                fetchPastSessions();
            }
        } catch (err) {
            console.error('Failed to end session:', err);
        } finally {
            setEnding(false);
        }
    };

    const handleCloseEndModal = () => {
        setShowEndModal(false);
        setSessionId(null);
        setMessages([]);
        setShowDisclaimer(true);
    };

    const viewPastSession = async (session) => {
        setLoadingPast(true);
        setViewingPastSession(session);
        setShowPastSessions(false);
        try {
            const res = await fetch(`/api/assistant/session/${session.sessionId}`);
            const data = await res.json();
            if (data.success) {
                setPastMessages(data.data.session.messages || []);
            }
        } catch (err) {
            console.error('Failed to load session:', err);
        } finally {
            setLoadingPast(false);
        }
    };

    const startNewSession = () => {
        setViewingPastSession(null);
        setPastMessages([]);
        setMessages([]);
        setSessionId(null);
        setShowDisclaimer(true);
        setShowEmergencyBanner(false);
    };

    // === RENDER ===

    return (
        <>
            <Navbar />
            <div className="flex h-[calc(100vh-64px)]">
                {/* Past Sessions Panel — Desktop */}
                <div className="hidden lg:flex flex-col w-80 border-r border-gray-100 bg-white">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            Past Sessions
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {pastSessions.length === 0 ? (
                            <div className="p-6 text-center">
                                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No past sessions yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {pastSessions.filter(s => s.endedAt).map((s) => (
                                    <button
                                        key={s.sessionId}
                                        onClick={() => viewPastSession(s)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${viewingPastSession?.sessionId === s.sessionId ? 'bg-primary-50' : ''}`}
                                    >
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(s.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{s.messageCount} messages</p>
                                        {s.sessionSummary && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.sessionSummary}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Past Sessions Slide-in */}
                {showPastSessions && (
                    <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setShowPastSessions(false)} />
                        <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl animate-slide-right overflow-y-auto">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">Past Sessions</h2>
                                <button onClick={() => setShowPastSessions(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {pastSessions.filter(s => s.endedAt).length === 0 ? (
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500">No past sessions yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {pastSessions.filter(s => s.endedAt).map((s) => (
                                        <button
                                            key={s.sessionId}
                                            onClick={() => viewPastSession(s)}
                                            className="w-full text-left p-4 hover:bg-gray-50"
                                        >
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(s.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <p className="text-xs text-gray-500">{s.messageCount} messages</p>
                                            {s.sessionSummary && (
                                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.sessionSummary}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50">
                    {/* Chat Header */}
                    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPastSessions(true)}
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <Clock className="w-5 h-5 text-gray-500" />
                            </button>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4 text-green-700" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-gray-900 text-sm">MedBot</h1>
                                <p className="text-xs text-gray-400">AI Health Assistant</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title={isMuted ? 'Unmute voice' : 'Mute voice'}
                            >
                                {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-gray-600" />}
                            </button>
                            {sessionId && !viewingPastSession && (
                                <button
                                    onClick={handleEndSession}
                                    disabled={ending}
                                    className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1"
                                >
                                    {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                    End
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Emergency Banner */}
                    {showEmergencyBanner && (
                        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <span className="font-bold text-sm">This sounds serious. Please call 112 immediately or go to the nearest emergency room.</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a href="tel:112" className="flex items-center gap-1 px-3 py-1.5 border border-white rounded-lg text-sm font-medium hover:bg-white/10">
                                    <Phone className="w-4 h-4" />
                                    Call 112
                                </a>
                                <button onClick={() => setShowEmergencyBanner(false)} className="p-1 hover:bg-white/10 rounded">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        {/* Viewing past session */}
                        {viewingPastSession ? (
                            <>
                                <div className="text-center mb-6">
                                    <p className="text-xs text-gray-400">
                                        Session from {new Date(viewingPastSession.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    {viewingPastSession.sessionSummary && (
                                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">{viewingPastSession.sessionSummary}</p>
                                    )}
                                </div>
                                {loadingPast ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <>
                                        {pastMessages.map((msg, i) => (
                                            <ChatBubble key={i} message={msg} onSpeak={speakText} />
                                        ))}
                                    </>
                                )}
                                <div className="text-center mt-8">
                                    <button onClick={startNewSession} className="btn-primary inline-flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Start New Session
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Active chat */}
                                {messages.length === 0 && sessionId && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Bot className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Hello! I&apos;m MedBot</h3>
                                        <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                            I can help you understand your symptoms and prepare for your doctor visit. How can I help you today?
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <ChatBubble key={i} message={msg} onSpeak={speakText} />
                                ))}

                                {/* Typing indicator */}
                                {sending && (
                                    <div className="flex items-start gap-2 mb-4">
                                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                            <Bot className="w-3.5 h-3.5 text-green-700" />
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-tl-sm rounded-tr-2xl rounded-br-2xl px-4 py-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Bar (only for active sessions) */}
                    {sessionId && !viewingPastSession && (
                        <div className="bg-white border-t border-gray-100 px-4 py-3">
                            {/* Image preview */}
                            {imagePreview && (
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="relative">
                                        <img src={imagePreview} alt="Selected" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                        <button
                                            onClick={removeImage}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {imageError && (
                                <p className="text-sm text-red-600 mb-2">{imageError}</p>
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
                                    title="Upload image"
                                >
                                    <ImagePlus className="w-5 h-5" />
                                </button>
                                {speechSupported && (
                                    <button
                                        onClick={toggleRecording}
                                        className={`p-2.5 rounded-xl transition-colors ${isRecording ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                                        title={isRecording ? 'Stop recording' : 'Voice input'}
                                    >
                                        {isRecording ? (
                                            <div className="relative">
                                                <MicOff className="w-5 h-5" />
                                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                                            </div>
                                        ) : (
                                            <Mic className="w-5 h-5" />
                                        )}
                                    </button>
                                )}
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-sm"
                                    placeholder="Type your message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={sending}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || (!inputText.trim() && !imageBase64)}
                                    className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Disclaimer Modal */}
            {showDisclaimer && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">AI Health Assistant</h2>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600 mb-6">
                            <p>
                                This assistant is powered by artificial intelligence and is <strong>not a licensed doctor</strong>.
                                It cannot diagnose medical conditions or prescribe medicines.
                            </p>
                            <p>
                                All information provided is for <strong>general guidance only</strong> and does not replace
                                professional medical advice. Always consult a qualified doctor before taking any medical action.
                            </p>
                            <p className="text-red-600 font-bold">
                                If you are experiencing a medical emergency, call 112 immediately.
                            </p>
                        </div>

                        <button
                            onClick={handleAcceptDisclaimer}
                            className="w-full btn-primary text-center flex items-center justify-center gap-2"
                        >
                            I Understand, Continue
                        </button>
                    </div>
                </div>
            )}

            {/* End Session Modal */}
            {showEndModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Ended</h3>
                        <p className="text-sm text-gray-500 mb-4">Here&apos;s a summary of your session:</p>
                        <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 mb-6">
                            {endSummary || 'No summary available.'}
                        </div>
                        <button onClick={handleCloseEndModal} className="w-full btn-primary text-center">
                            Done
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function ChatBubble({ message, onSpeak }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'items-start gap-2'} mb-4`}>
            {!isUser && (
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-green-700" />
                </div>
            )}
            <div className={`max-w-[80%] ${isUser
                ? 'bg-blue-600 text-white rounded-tl-2xl rounded-tr-sm rounded-bl-2xl px-4 py-3'
                : 'bg-white border border-gray-200 rounded-tl-sm rounded-tr-2xl rounded-br-2xl px-4 py-3'
                }`}>
                {/* User image */}
                {isUser && message.hasImage && message.imagePreview && (
                    <img src={message.imagePreview} alt="Attached" className="w-32 h-32 object-cover rounded-lg mb-2" />
                )}

                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>
                    {message.content}
                </p>

                {/* AI disclaimer + speak button */}
                {!isUser && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            ⚠️ AI-generated information only. Not a substitute for professional medical advice.
                        </p>
                        <button
                            onClick={() => onSpeak(message.content)}
                            className="p-1 hover:bg-gray-100 rounded ml-2 shrink-0"
                            title="Read aloud"
                        >
                            <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
