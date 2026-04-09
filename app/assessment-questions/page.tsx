"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, GripVertical, ClipboardCheck, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";

interface Option {
  value: string;
  label: string;
  icon: string;
  desc: string;
}

interface Question {
  _id: string;
  field: string;
  title: string;
  copy: string;
  type: "grid" | "grid-sm" | "stack" | "textarea";
  options: Option[];
  placeholder: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
}

const emptyQuestion: Omit<Question, "_id"> = {
  field: "",
  title: "",
  copy: "",
  type: "stack",
  options: [],
  placeholder: "",
  isRequired: true,
  sortOrder: 0,
  isActive: true,
};

const emptyOption: Option = { value: "", label: "", icon: "", desc: "" };

const typeLabels: Record<string, string> = {
  grid: "Grid (large cards)",
  "grid-sm": "Grid (small cards)",
  stack: "Stack (list)",
  textarea: "Free text input",
};

export default function AssessmentQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Question, "_id">>(emptyQuestion);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAssessmentQuestions();
      if (data.success) setQuestions(data.data.questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyQuestion, sortOrder: questions.length });
    setModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingId(q._id);
    setForm({
      field: q.field,
      title: q.title,
      copy: q.copy || "",
      type: q.type,
      options: q.options?.length ? q.options.map(o => ({ ...o })) : [],
      placeholder: q.placeholder || "",
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
      isActive: q.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.field || !form.title) return alert("Field name & title are required");
    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateAssessmentQuestion(editingId, form);
      } else {
        await adminApi.createAssessmentQuestion(form);
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      alert(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await adminApi.seedAssessmentQuestions();
      alert(res.message || "Seed complete");
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSeeding(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await adminApi.deleteAssessmentQuestion(deleteModal.id);
      setDeleteModal({ open: false, id: "", title: "" });
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Options helpers
  const addOption = () => setForm({ ...form, options: [...form.options, { ...emptyOption }] });
  const removeOption = (i: number) => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) });
  const updateOption = (i: number, key: keyof Option, val: string) => {
    const opts = [...form.options];
    opts[i] = { ...opts[i], [key]: val };
    // Auto-fill value from label
    if (key === "label" && !opts[i].value) {
      opts[i].value = val.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    }
    setForm({ ...form, options: opts });
  };

  return (
    <>
      <Header title="Assessment Questions" />

      <div className="p-8 max-w-5xl mx-auto animate-fade-in">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-500">Manage the self-test questionnaire steps shown to users on the assessment page.</p>
          </div>
          <div className="flex gap-3">
            {questions.length === 0 && (
              <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" /> {seeding ? "Seeding..." : "Seed Defaults"}
              </button>
            )}
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Step
            </button>
          </div>
        </div>

        {/* Questions list */}
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
            <div className="grid grid-cols-[40px_1fr_140px_100px_80px_80px] gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>#</span>
              <span>Question</span>
              <span>Type</span>
              <span>Options</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="px-6 py-10 text-center text-slate-400">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium mb-1">No questions yet</p>
                <p className="text-slate-400 text-sm">Click &ldquo;Seed Defaults&rdquo; to load the standard questionnaire, or add steps manually.</p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q._id}>
                  <div className="grid grid-cols-[40px_1fr_140px_100px_80px_80px] gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                    <span className="text-slate-400 font-mono text-sm">{q.sortOrder}</span>
                    <div>
                      <button onClick={() => setExpandedId(expandedId === q._id ? null : q._id)} className="text-left group">
                        <p className="font-medium text-[#0B132B] group-hover:text-[#14B8A6] transition-colors flex items-center gap-1.5">
                          {q.title}
                          {expandedId === q._id ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </p>
                      </button>
                      <p className="text-xs text-slate-400 mt-0.5">field: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{q.field}</code></p>
                    </div>
                    <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-full text-center">
                      {typeLabels[q.type] || q.type}
                    </span>
                    <span className="text-sm text-slate-600 font-medium text-center">{q.options?.length || "—"}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${q.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}>
                      {q.isActive ? "Active" : "Off"}
                    </span>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(q)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteModal({ open: true, id: q._id, title: q.title })} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Expanded preview */}
                  {expandedId === q._id && q.options?.length > 0 && (
                    <div className="px-10 pb-4">
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 shadow-sm">
                            {opt.icon && <i className={`${opt.icon} text-[#14B8A6] text-[10px]`} />}
                            {opt.label}
                          </span>
                        ))}
                      </div>
                      {q.copy && <p className="text-xs text-slate-400 mt-2 italic">{q.copy}</p>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden relative">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#0B132B]">{editingId ? "Edit Question Step" : "Add Question Step"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Field & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Field Name *</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                    value={form.field} onChange={e => setForm({ ...form, field: e.target.value.replace(/[^a-zA-Z0-9]/g, "") })}
                    placeholder="e.g. concern" disabled={!!editingId} />
                  <p className="text-[10px] text-slate-400 mt-1">Unique key used in answers (no spaces)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                    value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
                    <option value="grid">Grid (large cards)</option>
                    <option value="grid-sm">Grid (small cards)</option>
                    <option value="stack">Stack (list)</option>
                    <option value="textarea">Free text</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="What would you like help with today?" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle (copy)</label>
                <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  value={form.copy} onChange={e => setForm({ ...form, copy: e.target.value })}
                  placeholder="Select the area you want help with." />
              </div>

              {form.type === "textarea" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                    value={form.placeholder} onChange={e => setForm({ ...form, placeholder: e.target.value })}
                    placeholder="E.g., feeling tired, headaches..." />
                </div>
              )}

              {/* Options */}
              {form.type !== "textarea" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Options</label>
                    <button type="button" onClick={addOption} className="text-xs text-[#14B8A6] font-semibold hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <GripVertical className="w-4 h-4 text-slate-300 mt-2 shrink-0" />
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Label *" value={opt.label}
                            onChange={e => updateOption(i, "label", e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/30" />
                          <input type="text" placeholder="Value" value={opt.value}
                            onChange={e => updateOption(i, "value", e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/30" />
                          <input type="text" placeholder="Icon (e.g. fas fa-heart)" value={opt.icon}
                            onChange={e => updateOption(i, "icon", e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/30" />
                          <input type="text" placeholder="Description" value={opt.desc}
                            onChange={e => updateOption(i, "desc", e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/30" />
                        </div>
                        <button onClick={() => removeOption(i)} className="p-1 text-red-400 hover:text-red-600 mt-1.5 shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {form.options.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-3">No options added yet. Click &ldquo;Add Option&rdquo; above.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Sort & Toggles */}
              <div className="flex items-center gap-4 pt-2">
                <div className="w-24">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                    value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                </div>
                <div className="flex items-center pt-6 gap-2">
                  <input type="checkbox" id="isRequired" checked={form.isRequired}
                    onChange={e => setForm({ ...form, isRequired: e.target.checked })}
                    className="w-4 h-4 text-[#14B8A6] rounded border-slate-300 focus:ring-[#14B8A6]" />
                  <label htmlFor="isRequired" className="text-sm font-medium text-slate-700">Required</label>
                </div>
                <div className="flex items-center pt-6 gap-2">
                  <input type="checkbox" id="isActive" checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#14B8A6] rounded border-slate-300 focus:ring-[#14B8A6]" />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active</label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="btn-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Step" : "Create Step"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-[#0B132B]">Delete Question?</h2>
              <p className="text-sm text-slate-500">Are you sure you want to delete <span className="font-semibold">&ldquo;{deleteModal.title}&rdquo;</span>?</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-3 bg-slate-50">
              <button onClick={() => setDeleteModal({ open: false, id: "", title: "" })} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors w-full">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors w-full">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
