"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Save, Settings2, Truck, CreditCard, Stethoscope, Clock, MapPin, Phone, Mail, Globe, HelpCircle, FileText } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface FAQItem {
  question: string;
  answer: string;
}

function FAQEditor({
  setting,
  saving,
  onSave,
}: {
  setting: any;
  saving: boolean;
  onSave: (key: string, value: FAQItem[], description?: string) => void;
}) {
  const [items, setItems] = useState<FAQItem[]>([]);

  // Sync state with setting.value when it changes
  useEffect(() => {
    if (setting && Array.isArray(setting.value)) {
      setItems(setting.value);
    }
  }, [setting]);

  if (!setting) return null;

  const handleItemChange = (index: number, field: "question" | "answer", val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { question: "", answer: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Homepage FAQs List</h3>
          <p className="text-xs text-slate-500">Configure frequently asked questions rendered on the website homepage.</p>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F3C3A] font-semibold text-xs rounded-lg transition-all"
        >
          + Add FAQ
        </button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {items.map((item, index) => (
          <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3 relative group">
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors text-xl font-bold"
              title="Remove FAQ"
            >
              ×
            </button>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Question {index + 1}</label>
              <input
                type="text"
                value={item.question}
                onChange={(e) => handleItemChange(index, "question", e.target.value)}
                placeholder="e.g. How do consultations work?"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Answer</label>
              <textarea
                value={item.answer}
                onChange={(e) => handleItemChange(index, "answer", e.target.value)}
                placeholder="Provide a detailed, helpful answer..."
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 resize-none"
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
            No FAQs configured. Click "+ Add FAQ" to create one.
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex justify-end">
        <button
          onClick={() => onSave(setting.key, items, setting.description)}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save FAQs</>}
        </button>
      </div>
    </div>
  );
}

function RichTextField({
  setting,
  label,
  desc,
  saving,
  onSave,
}: {
  setting: any;
  label: string;
  desc?: string;
  saving: boolean;
  onSave: (key: string, value: string, description?: string) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (setting) {
      setValue(setting.value || "");
    }
  }, [setting]);

  const imageHandler = useMemo(() => {
    return function(this: any) {
      const quill = this.quill;
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          try {
            const response = await adminApi.uploadAdminImage(file, "about");
            if (response.success && response.data?.url) {
              const url = response.data.url;
              const range = quill.getSelection();
              if (range) {
                quill.insertEmbed(range.index, "image", url);
                quill.setSelection(range.index + 1);
              } else {
                quill.insertEmbed(quill.getLength(), "image", url);
              }
            }
          } catch (error) {
            console.error("Failed to upload image inside Quill:", error);
            alert("Failed to upload image");
          }
        }
      };
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'align',
    'link', 'image'
  ];

  if (!setting) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {desc && <p className="text-xs text-slate-500 mb-3">{desc}</p>}
      <div className="space-y-3 max-w-3xl">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <ReactQuill
            theme="snow"
            value={value}
            onChange={setValue}
            modules={modules}
            formats={formats}
            className="min-h-[250px] mb-12"
            placeholder="Write about your telemedicine pharmacy..."
          />
        </div>
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onSave(setting.key, value, setting.description)}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save About Us</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [areaInput, setAreaInput] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAdminSettings();
      if (data.success) {
        setSettings(data.data.settings || data.data);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleUpdate = async (key: string, value: any, description?: string) => {
    try {
      setSaving(key);
      await adminApi.updateSetting(key, value, description);
      await loadSettings();
    } catch (error: any) {
      alert(error.message || "Failed to update setting");
    } finally {
      setSaving(null);
    }
  };

  const getSetting = (key: string) => settings.find(s => s.key === key);

  const deliveryCharge = getSetting('delivery_charge');
  const codEnabled = getSetting('cod_enabled');
  const maxCod = getSetting('max_cod_amount');
  const consultationFee = getSetting('default_consultation_fee');
  const slotDuration = getSetting('slot_duration_minutes');
  const rxReviewHours = getSetting('prescription_review_hours');
  const minOrder = getSetting('min_order_amount');
  const deliveryAreas = getSetting('delivery_areas');

  const contactPhone = getSetting('contact_phone');
  const contactEmail = getSetting('contact_email');
  const workingHours = getSetting('working_hours');
  const location = getSetting('location');
  const socialFacebook = getSetting('social_facebook');
  const socialInstagram = getSetting('social_instagram');
  const socialTwitter = getSetting('social_twitter');
  const socialLinkedIn = getSetting('social_linkedin');
  const aboutUs = getSetting('about_us');
  const faqs = getSetting('faqs');

  const NumberField = ({ setting, label, desc, id }: { setting: any; label: string; desc?: string; id: string }) => {
    if (!setting) return null;
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        {desc && <p className="text-xs text-slate-500 mb-3">{desc}</p>}
        <div className="flex gap-4">
          <input type="number" defaultValue={setting.value} id={id}
            className="w-1/2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
          <button
            onClick={() => {
              const val = (document.getElementById(id) as HTMLInputElement).value;
              handleUpdate(setting.key, Number(val), setting.description);
            }}
            disabled={saving === setting.key}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {saving === setting.key ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>
    );
  };

  const TextField = ({ setting, label, desc, id }: { setting: any; label: string; desc?: string; id: string }) => {
    if (!setting) return null;
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        {desc && <p className="text-xs text-slate-500 mb-3">{desc}</p>}
        <div className="flex gap-4 max-w-2xl">
          <input type="text" defaultValue={setting.value} id={id}
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
          <button
            onClick={() => {
              const val = (document.getElementById(id) as HTMLInputElement).value;
              handleUpdate(setting.key, val, setting.description);
            }}
            disabled={saving === setting.key}
            className="btn-primary flex items-center gap-2 px-6 flex-shrink-0"
          >
            {saving === setting.key ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>
    );
  };

  const TextAreaField = ({ setting, label, desc, id }: { setting: any; label: string; desc?: string; id: string }) => {
    if (!setting) return null;
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        {desc && <p className="text-xs text-slate-500 mb-3">{desc}</p>}
        <div className="space-y-3 max-w-2xl">
          <textarea defaultValue={setting.value} id={id} rows={5}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all resize-y" />
          <button
            onClick={() => {
              const val = (document.getElementById(id) as HTMLTextAreaElement).value;
              handleUpdate(setting.key, val, setting.description);
            }}
            disabled={saving === setting.key}
            className="btn-primary flex items-center gap-2 px-6 flex-shrink-0"
          >
            {saving === setting.key ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>
    );
  };


  const handleAddArea = () => {
    if (!areaInput.trim() || !deliveryAreas) return;
    const current = Array.isArray(deliveryAreas.value) ? deliveryAreas.value : [];
    if (current.includes(areaInput.trim())) { setAreaInput(""); return; }
    const updated = [...current, areaInput.trim()];
    handleUpdate(deliveryAreas.key, updated, deliveryAreas.description);
    setAreaInput("");
  };

  const handleRemoveArea = (area: string) => {
    if (!deliveryAreas) return;
    const current = Array.isArray(deliveryAreas.value) ? deliveryAreas.value : [];
    handleUpdate(deliveryAreas.key, current.filter((a: string) => a !== area), deliveryAreas.description);
  };

  return (
    <>
      <Header title="System Settings" />
      <div className="p-8 max-w-4xl mx-auto animate-fade-in space-y-6">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading configurations...</div>
        ) : (
          <>
            {/* Delivery Configuration */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-[#F8FAFC]">
                <Truck className="w-5 h-5 text-[#0F3C3A]" />
                <h2 className="text-lg font-display font-semibold text-[#0B132B]">Delivery & Shipping</h2>
              </div>
              <div className="p-6 space-y-6">
                <NumberField setting={deliveryCharge} label="Standard Delivery Charge (₹)" desc={deliveryCharge?.description} id="deliveryCharge" />
                <NumberField setting={minOrder} label="Minimum Order Amount (₹)" desc={minOrder?.description || "Minimum order value to place an order"} id="minOrder" />
              </div>
            </div>

            {/* Payment Configuration */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-[#F8FAFC]">
                <CreditCard className="w-5 h-5 text-[#0F3C3A]" />
                <h2 className="text-lg font-display font-semibold text-[#0B132B]">Payment Methods</h2>
              </div>
              <div className="p-6 space-y-6">
                {codEnabled && (
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                    <div>
                      <h3 className="font-medium text-[#0B132B]">Cash on Delivery (COD)</h3>
                      <p className="text-sm text-slate-500 mt-1">{codEnabled.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={codEnabled.value} className="sr-only peer"
                        onChange={(e) => handleUpdate(codEnabled.key, e.target.checked, codEnabled.description)}
                        disabled={saving === codEnabled.key} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                    </label>
                  </div>
                )}
                <NumberField setting={maxCod} label="Maximum Order Value for COD (₹)" desc={maxCod?.description} id="maxCod" />
              </div>
            </div>

            {/* Consultation & Scheduling */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-[#F8FAFC]">
                <Stethoscope className="w-5 h-5 text-[#0F3C3A]" />
                <h2 className="text-lg font-display font-semibold text-[#0B132B]">Consultation & Scheduling</h2>
              </div>
              <div className="p-6 space-y-6">
                <NumberField setting={consultationFee} label="Default Consultation Fee (₹)" desc={consultationFee?.description || "Fee charged for each consultation"} id="consultationFee" />
                <NumberField setting={slotDuration} label="Slot Duration (Minutes)" desc={slotDuration?.description || "Duration of each appointment slot"} id="slotDuration" />
                <NumberField setting={rxReviewHours} label="Prescription Review Hours" desc={rxReviewHours?.description || "Max hours for prescription review"} id="rxReviewHours" />
              </div>
            </div>

            {/* Delivery Areas */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-[#F8FAFC]">
                <MapPin className="w-5 h-5 text-[#0F3C3A]" />
                <h2 className="text-lg font-display font-semibold text-[#0B132B]">Delivery Areas</h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500">Add pincodes or city names where delivery is available. Leave empty to allow all areas.</p>
                <div className="flex gap-3">
                  <input value={areaInput} onChange={e => setAreaInput(e.target.value)} placeholder="Enter pincode or city"
                    onKeyDown={e => e.key === "Enter" && handleAddArea()}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20" />
                  <button onClick={handleAddArea} className="btn-primary px-5 text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(deliveryAreas?.value) ? deliveryAreas.value : []).map((area: string) => (
                    <span key={area} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14B8A6]/10 text-[#0F3C3A] rounded-full text-sm font-medium">
                      {area}
                      <button onClick={() => handleRemoveArea(area)} className="hover:text-red-500 transition-colors">×</button>
                    </span>
                  ))}
                  {(!deliveryAreas?.value || (Array.isArray(deliveryAreas.value) && deliveryAreas.value.length === 0)) && (
                    <span className="text-xs text-slate-400 italic">All areas (no restrictions)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact & Location Configuration */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-[#F8FAFC]">
                <Phone className="w-5 h-5 text-[#0F3C3A]" />
                <h2 className="text-lg font-display font-semibold text-[#0B132B]">Contact & Location</h2>
              </div>
              <div className="p-6 space-y-6">
                <TextField setting={contactPhone} label="Contact Phone Number" desc={contactPhone?.description} id="contactPhone" />
                <TextField setting={contactEmail} label="Contact Email Address" desc={contactEmail?.description} id="contactEmail" />
                <TextField setting={workingHours} label="Working Hours" desc={workingHours?.description} id="workingHours" />
                <TextField setting={location} label="Location / Physical Address" desc={location?.description} id="location" />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-[#F8FAFC]">
                <Globe className="w-5 h-5 text-[#0F3C3A]" />
                <h2 className="text-lg font-display font-semibold text-[#0B132B]">Social Media Handles</h2>
              </div>
              <div className="p-6 space-y-6">
                <TextField setting={socialFacebook} label="Facebook URL" desc={socialFacebook?.description} id="socialFacebook" />
                <TextField setting={socialInstagram} label="Instagram URL" desc={socialInstagram?.description} id="socialInstagram" />
                <TextField setting={socialTwitter} label="Twitter / X URL" desc={socialTwitter?.description} id="socialTwitter" />
                <TextField setting={socialLinkedIn} label="LinkedIn URL" desc={socialLinkedIn?.description} id="socialLinkedIn" />
              </div>
            </div>

            {/* About Page Content */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-[#F8FAFC]">
                <FileText className="w-5 h-5 text-[#0F3C3A]" />
                <h2 className="text-lg font-display font-semibold text-[#0B132B]">About Page Text</h2>
              </div>
              <div className="p-6 space-y-6">
                <RichTextField setting={aboutUs} label="About Us Description" desc={aboutUs?.description} saving={saving === aboutUs?.key} onSave={handleUpdate} />
              </div>
            </div>

            {/* FAQ Configuration */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-[#F8FAFC]">
                <HelpCircle className="w-5 h-5 text-[#0F3C3A]" />
                <h2 className="text-lg font-display font-semibold text-[#0B132B]">Frequently Asked Questions</h2>
              </div>
              <div className="p-6">
                <FAQEditor setting={faqs} saving={saving === faqs?.key} onSave={handleUpdate} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
