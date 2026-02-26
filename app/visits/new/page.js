'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Loader2, Sparkles, Save, Plus, X, RefreshCw } from 'lucide-react';

const PAIN_CHARACTERS = ['Sharp', 'Dull', 'Burning', 'Pressure', 'Throbbing', 'Cramping'];
const ASSOCIATED_SYMPTOMS = ['Fever', 'Nausea', 'Vomiting', 'Fatigue', 'Dizziness', 'Shortness of breath', 'Headache', 'Loss of appetite'];

export default function NewVisitPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [aiSummary, setAiSummary] = useState('');

    const [form, setForm] = useState({
        chiefComplaint: '',
        problemStartDate: '',
        onsetType: '',
        painLocation: '',
        painCharacter: [],
        severityScore: 5,
        aggravatingFactors: '',
        relievingFactors: '',
        associatedSymptoms: [],
        medicineTaken: '',
        similarEpisodeBefore: false,
        similarEpisodeDetails: '',
        recentHistory: '',
        questionsForDoctor: [],
        customNotes: '',
        doctorName: '',
        visitDate: new Date().toISOString().split('T')[0],
    });

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const toggleArrayField = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((v) => v !== value)
                : [...prev[field], value],
        }));
    };

    const addQuestion = () => {
        setForm((prev) => ({ ...prev, questionsForDoctor: [...prev.questionsForDoctor, ''] }));
    };

    const updateQuestion = (index, value) => {
        const updated = [...form.questionsForDoctor];
        updated[index] = value;
        setForm((prev) => ({ ...prev, questionsForDoctor: updated }));
    };

    const removeQuestion = (index) => {
        setForm((prev) => ({
            ...prev,
            questionsForDoctor: prev.questionsForDoctor.filter((_, i) => i !== index),
        }));
    };

    const validate = () => {
        const errors = {};
        if (!form.chiefComplaint.trim()) errors.chiefComplaint = 'Chief complaint is required';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleGenerateSummary = async () => {
        if (!validate()) return;
        setAiLoading(true);
        setError('');
        try {
            const res = await fetch('/api/visits/generate-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chiefComplaint: form.chiefComplaint,
                    problemStartDate: form.problemStartDate,
                    onsetType: form.onsetType,
                    painLocation: form.painLocation,
                    painCharacter: form.painCharacter,
                    severityScore: form.severityScore,
                    aggravatingFactors: form.aggravatingFactors,
                    relievingFactors: form.relievingFactors,
                    associatedSymptoms: form.associatedSymptoms,
                    medicineTaken: form.medicineTaken,
                    similarEpisodeBefore: form.similarEpisodeBefore,
                    similarEpisodeDetails: form.similarEpisodeDetails,
                    recentHistory: form.recentHistory,
                    questionsForDoctor: form.questionsForDoctor.filter((q) => q.trim()),
                    customNotes: form.customNotes,
                    patientName: '',
                    patientGender: '',
                    patientAge: '',
                    activeConditions: [],
                    activeMedications: [],
                }),
            });
            const data = await res.json();
            if (data.success && data.summary) {
                setAiSummary(data.summary);
            } else {
                setError(data.error || 'Failed to generate summary');
            }
        } catch (err) {
            setError('Failed to generate summary. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async (status = 'Draft') => {
        if (!validate()) return;
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const body = {
                chiefComplaint: form.chiefComplaint,
                problemStartDate: form.problemStartDate,
                onsetType: form.onsetType,
                painLocation: form.painLocation,
                painCharacter: form.painCharacter,
                severityScore: form.severityScore,
                aggravatingFactors: form.aggravatingFactors,
                relievingFactors: form.relievingFactors,
                associatedSymptoms: form.associatedSymptoms,
                medicineTaken: form.medicineTaken,
                similarEpisodeBefore: form.similarEpisodeBefore,
                similarEpisodeDetails: form.similarEpisodeDetails,
                recentHistory: form.recentHistory,
                questionsForDoctor: form.questionsForDoctor.filter((q) => q.trim()),
                customNotes: form.customNotes,
                doctorName: form.doctorName,
                visitDate: form.visitDate,
                status,
                aiGeneratedSummary: aiSummary,
            };

            const res = await fetch('/api/visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(status === 'Draft' ? 'Draft saved!' : 'Visit saved successfully!');
                setTimeout(() => router.push('/visits'), 1000);
            } else {
                setError(data.error || 'Failed to save visit');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-8 animate-fade-in">
                    <h1 className="page-header">Prepare for Visit</h1>
                    <p className="page-subtitle">Fill in your symptoms to generate a clinical summary for your doctor</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm animate-fade-in">
                        {success}
                    </div>
                )}

                <div className="card-static p-6 space-y-6 animate-slide-up">
                    {/* Visit Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor&apos;s Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Dr. John Smith"
                                value={form.doctorName}
                                onChange={(e) => updateField('doctorName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Visit Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={form.visitDate}
                                onChange={(e) => updateField('visitDate', e.target.value)}
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* 1. Chief Complaint */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            1. Chief Complaint <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={`input-field ${validationErrors.chiefComplaint ? 'border-red-400 focus:ring-red-300' : ''}`}
                            placeholder="What is your main problem today?"
                            value={form.chiefComplaint}
                            onChange={(e) => updateField('chiefComplaint', e.target.value)}
                        />
                        {validationErrors.chiefComplaint && (
                            <p className="text-sm text-red-600 mt-1">{validationErrors.chiefComplaint}</p>
                        )}
                    </div>

                    {/* 2. When did it start */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">2. When did the problem start?</label>
                        <input type="date" className="input-field" value={form.problemStartDate} onChange={(e) => updateField('problemStartDate', e.target.value)} />
                    </div>

                    {/* 3. How did it start */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">3. How did it start?</label>
                        <div className="flex gap-4">
                            {['Sudden', 'Gradual'].map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="onsetType" value={type} checked={form.onsetType === type} onChange={(e) => updateField('onsetType', e.target.value)} className="w-4 h-4 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm text-gray-700">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 4. Where is the problem located */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">4. Where is the problem located?</label>
                        <input type="text" className="input-field" placeholder="e.g. chest, lower back, right knee" value={form.painLocation} onChange={(e) => updateField('painLocation', e.target.value)} />
                    </div>

                    {/* 5. Describe the sensation */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">5. Describe the sensation</label>
                        <div className="flex flex-wrap gap-2">
                            {PAIN_CHARACTERS.map((char) => (
                                <label key={char} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.painCharacter.includes(char) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                    <input type="checkbox" checked={form.painCharacter.includes(char)} onChange={() => toggleArrayField('painCharacter', char)} className="sr-only" />
                                    <span className="text-sm">{char}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 6. Severity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">6. Severity right now</label>
                        <div className="flex items-center gap-4">
                            <input type="range" min="1" max="10" value={form.severityScore} onChange={(e) => updateField('severityScore', parseInt(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                            <span className="text-2xl font-bold text-primary-600 min-w-[40px] text-center">{form.severityScore}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Mild</span><span>Severe</span></div>
                    </div>

                    {/* 7. What makes it worse */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">7. What makes it worse?</label>
                        <input type="text" className="input-field" placeholder="e.g. bending, walking, eating" value={form.aggravatingFactors} onChange={(e) => updateField('aggravatingFactors', e.target.value)} />
                    </div>

                    {/* 8. What makes it better */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">8. What makes it better?</label>
                        <input type="text" className="input-field" placeholder="e.g. rest, ice, medication" value={form.relievingFactors} onChange={(e) => updateField('relievingFactors', e.target.value)} />
                    </div>

                    {/* 9. Other symptoms */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">9. Other symptoms you have noticed</label>
                        <div className="flex flex-wrap gap-2">
                            {ASSOCIATED_SYMPTOMS.map((sym) => (
                                <label key={sym} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.associatedSymptoms.includes(sym) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                    <input type="checkbox" checked={form.associatedSymptoms.includes(sym)} onChange={() => toggleArrayField('associatedSymptoms', sym)} className="sr-only" />
                                    <span className="text-sm">{sym}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 10. Medicine taken */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">10. Have you taken any medicine for this?</label>
                        <input type="text" className="input-field" placeholder="e.g. Paracetamol 500mg" value={form.medicineTaken} onChange={(e) => updateField('medicineTaken', e.target.value)} />
                    </div>

                    {/* 11. Similar problem before */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">11. Similar problem before?</label>
                        <div className="flex gap-4 mb-2">
                            {[true, false].map((val) => (
                                <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="similarEpisodeBefore" checked={form.similarEpisodeBefore === val} onChange={() => updateField('similarEpisodeBefore', val)} className="w-4 h-4 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm text-gray-700">{val ? 'Yes' : 'No'}</span>
                                </label>
                            ))}
                        </div>
                        {form.similarEpisodeBefore && (
                            <input type="text" className="input-field animate-fade-in" placeholder="Please describe the previous episode" value={form.similarEpisodeDetails} onChange={(e) => updateField('similarEpisodeDetails', e.target.value)} />
                        )}
                    </div>

                    {/* 12. Recent changes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">12. Any recent changes?</label>
                        <input type="text" className="input-field" placeholder="e.g. travel, diet change, stress, new medicine" value={form.recentHistory} onChange={(e) => updateField('recentHistory', e.target.value)} />
                    </div>

                    {/* 13. Questions for doctor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">13. Questions for your doctor</label>
                        <div className="space-y-2">
                            {form.questionsForDoctor.map((q, i) => (
                                <div key={i} className="flex gap-2 animate-fade-in">
                                    <input type="text" className="input-field flex-1" placeholder={`Question ${i + 1}`} value={q} onChange={(e) => updateQuestion(i, e.target.value)} />
                                    <button type="button" onClick={() => removeQuestion(i)} className="p-2.5 hover:bg-red-50 rounded-xl text-red-400 hover:text-red-600 transition-colors"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addQuestion} className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"><Plus className="w-4 h-4" />Add Question</button>
                    </div>

                    {/* 14. Additional notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">14. Additional notes</label>
                        <textarea className="input-field min-h-[80px] resize-y" placeholder="Anything else you want to tell your doctor..." value={form.customNotes} onChange={(e) => updateField('customNotes', e.target.value)} />
                    </div>
                </div>

                {/* AI Summary Section */}
                {aiSummary && (
                    <div className="mt-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="section-title flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary-500" />
                                AI-Generated Clinical Summary
                            </h3>
                            <button type="button" onClick={handleGenerateSummary} disabled={aiLoading} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                                Regenerate
                            </button>
                        </div>
                        <div className="bg-gray-900 text-white font-mono text-sm rounded-lg p-4 max-h-96 overflow-auto whitespace-pre-wrap leading-relaxed">
                            {aiSummary}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                    <button type="button" onClick={() => handleSave('Draft')} disabled={saving} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save as Draft
                    </button>

                    <button type="button" onClick={handleGenerateSummary} disabled={aiLoading || !form.chiefComplaint.trim()} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {aiLoading ? 'Generating...' : 'Generate Summary'}
                    </button>

                    <button type="button" onClick={() => handleSave('Awaiting Doctor')} disabled={saving} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Visit
                    </button>

                    <button type="button" onClick={() => router.push('/visits')} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
            </main>
        </>
    );
}
