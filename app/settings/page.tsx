"use client";

import { useEffect, useState } from "react";
import { Save, Settings2, Truck, CreditCard, Stethoscope, Clock, MapPin } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";

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
          </>
        )}
      </div>
    </>
  );
}
