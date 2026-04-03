"use client";

import { useEffect, useState } from "react";
import { Save, Settings2, Truck, CreditCard } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";

export default function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUpdate = async (key: string, value: any, description?: string) => {
    try {
      setSaving(key);
      await adminApi.updateSetting(key, value, description);
      // alert("Saved successfully!");
      // reload slightly to ensure sync
      await loadSettings();
    } catch (error: any) {
      alert(error.message || "Failed to update setting");
    } finally {
      setSaving(null);
    }
  };

  // Group settings for UX (if backend returns linear list)
  const deliveryCharge = settings.find(s => s.key === 'delivery_charge');
  const codEnabled = settings.find(s => s.key === 'cod_enabled');
  const maxCod = settings.find(s => s.key === 'max_cod_amount');
  
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
                
                {deliveryCharge && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Standard Delivery Charge (₹)</label>
                    <p className="text-xs text-slate-500 mb-3">{deliveryCharge.description}</p>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        defaultValue={deliveryCharge.value}
                        id="deliveryCharge"
                        className="w-1/2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('deliveryCharge') as HTMLInputElement).value;
                          handleUpdate(deliveryCharge.key, Number(val), deliveryCharge.description);
                        }}
                        disabled={saving === deliveryCharge.key}
                        className="btn-primary flex items-center gap-2 px-6"
                      >
                        {saving === deliveryCharge.key ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                      </button>
                    </div>
                  </div>
                )}
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
                      <input 
                        type="checkbox" 
                        defaultChecked={codEnabled.value} 
                        className="sr-only peer"
                        onChange={(e) => handleUpdate(codEnabled.key, e.target.checked, codEnabled.description)}
                        disabled={saving === codEnabled.key}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                    </label>
                  </div>
                )}

                {maxCod && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Order Value for COD (₹)</label>
                    <p className="text-xs text-slate-500 mb-3">{maxCod.description}</p>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        defaultValue={maxCod.value}
                        id="maxCod"
                        className="w-1/2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('maxCod') as HTMLInputElement).value;
                          handleUpdate(maxCod.key, Number(val), maxCod.description);
                        }}
                        disabled={saving === maxCod.key}
                        className="btn-primary flex items-center gap-2 px-6"
                      >
                        {saving === maxCod.key ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Other Settings Mapping */}
            <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm pt-4">
               <div className="px-6 py-2 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><Settings2 className="w-5 h-5 text-slate-400" /><h3 className="text-base font-semibold text-slate-700">Advanced Settings</h3></div>
               </div>
               <div className="divide-y divide-slate-100">
                 {settings.filter(s => !['delivery_charge', 'cod_enabled', 'max_cod_amount'].includes(s.key)).map((setting: any) => (
                    <div key={setting.key || Math.random()} className="p-4 flex items-center justify-between px-6 hover:bg-slate-50 transition-colors">
                       <div>
                          <p className="font-mono text-sm text-[#0B132B]">{setting.key}</p>
                          <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-medium bg-slate-100 px-3 py-1 rounded inline-block">{JSON.stringify(setting.value)}</p>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
