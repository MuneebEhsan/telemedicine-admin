"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Activity, User, AlertTriangle, CheckCircle,
  Lightbulb, Apple, Pill, ShoppingBag, Info, Clock, 
  Printer, Download, ShieldCheck, HeartPulse, ClipboardList
} from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

const riskConfig: Record<string, { label: string; bg: string; badge: string; icon: any; color: string }> = {
  low: {
    label: "Low Risk",
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
    color: "text-emerald-600",
  },
  moderate: {
    label: "Moderate Risk",
    bg: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertTriangle,
    color: "text-amber-600",
  },
  high: {
    label: "High Risk",
    bg: "bg-gradient-to-br from-rose-50 to-red-50 border-rose-100",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    icon: AlertTriangle,
    color: "text-rose-600",
  },
};

export default function SelfTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await adminApi.getSelfTestById(id);
        if (res.success) setData(res.data.result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Generating Report...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#0B132B]">Report Not Found</h3>
        <p className="text-slate-500 mb-6">The self-test result you are looking for does not exist or has been removed.</p>
        <Link href="/self-tests" className="px-6 py-2.5 bg-[#14B8A6] text-white rounded-lg font-medium hover:bg-[#0F3C3A] transition-all">
          Go Back
        </Link>
      </div>
    );
  }

  const risk = data.aiResponse?.riskLevel || "low";
  const cfg = riskConfig[risk] || riskConfig.low;
  const RiskIcon = cfg.icon;

  return (
    <>
      <Header title="Patient Assessment Report" />

      <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-8 print:p-0 print:max-w-full">
        {/* Top Navigation & Actions */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link href="/self-tests" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#14B8A6] transition-colors group">
            <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-[#14B8A6]/30 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Assessment List
          </Link>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </div>
        </div>

        {/* Hero Report Header */}
        <div className={cn("relative rounded-2xl border p-8 shadow-sm overflow-hidden", cfg.bg)}>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/80 shadow-sm">
                  <HeartPulse className={cn("w-8 h-8", cfg.color)} />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-black text-[#0B132B] tracking-tight">
                    Assessment Summary
                  </h1>
                  <p className="text-slate-500 text-sm flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Generated on {formatDate(data.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border shadow-sm", cfg.badge)}>
                  <RiskIcon className="w-4 h-4" />
                  {cfg.label.toUpperCase()}
                </div>
                {data.isFallback && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-full text-xs font-bold shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> SYSTEM GENERATED
                  </div>
                )}
              </div>
            </div>

            {/* Patient Context Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-xl shadow-[#0F3C3A]/5 min-w-[300px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0F3C3A] flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {data.user?.name?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Details</p>
                  <p className="text-lg font-bold text-[#0B132B]">{data.user?.name || "Anonymous Patient"}</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-semibold text-slate-900">{data.user?.phone || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[150px]">{data.user?.email || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Narrative */}
          {data.aiResponse?.summary && (
            <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/40 shadow-inner">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MessageSquareIcon size={14} className="text-[#14B8A6]" /> Clinical Interpretation
              </h3>
              <p className="text-[#0F3C3A] text-lg leading-relaxed font-medium italic">
                "{data.aiResponse.summary}"
              </p>
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Patient Input & Observations (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-[#14B8A6]" />
                </div>
                <h3 className="font-display font-black text-[#0B132B] text-sm uppercase tracking-wider">Patient Inputs</h3>
              </div>
              
              <div className="space-y-4">
                <AssessmentField label="Primary Concern" value={data.answers?.concern} icon={AlertTriangle} />
                <AssessmentField label="Assessment For" value={data.answers?.forWhom} icon={User} />
                <AssessmentField label="Symptom Duration" value={data.answers?.duration} icon={Clock} />
                <AssessmentField label="Pain Severity" value={data.answers?.severity} icon={Activity} />
                <AssessmentField label="Age Range" value={data.answers?.ageRange} icon={Info} />
                
                {data.answers?.additionalSymptoms && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Additional Symptoms Reported</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {data.answers.additionalSymptoms}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Advisory Notice */}
            {(data.aiResponse?.urgencyNote || data.aiResponse?.shouldConsultDoctor) && (
              <div className={cn("rounded-2xl border p-6 shadow-sm",
                data.aiResponse?.shouldConsultDoctor ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
              )}>
                <div className="flex gap-4">
                  <div className={cn("p-2 rounded-xl shrink-0", data.aiResponse?.shouldConsultDoctor ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={cn("font-black text-sm uppercase tracking-wider mb-2", data.aiResponse?.shouldConsultDoctor ? "text-red-900" : "text-amber-900")}>
                      Advisory Notice
                    </h4>
                    <p className={cn("text-sm leading-relaxed font-medium", data.aiResponse?.shouldConsultDoctor ? "text-red-700" : "text-amber-700")}>
                      {data.aiResponse.urgencyNote || "Based on the provided symptoms, a professional medical consultation is recommended."}
                    </p>
                    {data.aiResponse?.disclaimer && (
                      <p className="mt-4 text-[11px] text-slate-400 italic font-medium border-t border-black/5 pt-3">
                        {data.aiResponse.disclaimer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Recommendations & Logic (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Recommendations Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Recommendations */}
              <CardSection 
                title="AI Recommendations" 
                icon={Lightbulb} 
                iconBg="bg-amber-100 text-amber-600"
                items={data.aiResponse?.recommendations}
              />
              
              {/* Lifestyle Guidance */}
              <CardSection 
                title="Lifestyle Guidance" 
                icon={Activity} 
                iconBg="bg-emerald-100 text-emerald-600"
                items={data.aiResponse?.lifestyleTips}
              />
            </div>

            {/* Dietary Section */}
            {data.aiResponse?.dietaryAdvice && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                    <Apple className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-black text-[#0B132B] text-sm uppercase tracking-wider">Dietary Strategy</h3>
                </div>
                <div className="prose prose-sm max-w-none text-slate-600 leading-loose font-medium">
                  {data.aiResponse.dietaryAdvice}
                </div>
              </div>
            )}

            {/* Supplements & Products Section */}
            <div className="space-y-6">
              <h3 className="font-display font-black text-[#0B132B] text-lg px-2 flex items-center gap-2">
                <Pill className="text-[#14B8A6] w-6 h-6" /> Targeted Solutions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplements */}
                {data.aiResponse?.suggestedSupplements?.map((supp: any, i: number) => (
                  <div key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-[#14B8A6]/10 transition-colors">
                        <Pill className="w-6 h-6 text-blue-500 group-hover:text-[#14B8A6]" />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 group-hover:text-[#14B8A6]/50 transition-colors">SUPPLEMENT</span>
                    </div>
                    <h4 className="text-[#0B132B] font-black text-base mb-2">{supp.name}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">{supp.reason}</p>
                    {supp.dosageHint && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:border-blue-100 transition-colors">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-bold text-blue-600">{supp.dosageHint}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Matched Products */}
                {data.matchedProducts?.map((mp: any, i: number) => (
                  <div key={i} className="group bg-white rounded-2xl border border-[#14B8A6]/20 p-6 shadow-sm hover:shadow-xl hover:border-[#14B8A6]/50 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      {mp.product?.thumbnail ? (
                        <img 
                          src={mp.product.thumbnail} 
                          alt={mp.product.name} 
                          className="w-16 h-16 rounded-xl object-cover shadow-sm border border-slate-100 group-hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center text-[#14B8A6]">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-black text-[#14B8A6]/60 uppercase tracking-widest">Recommended Product</span>
                        <h4 className="text-[#0B132B] font-black text-base line-clamp-1">{mp.product?.name || mp.name}</h4>
                        {mp.product?.price && <p className="text-[#14B8A6] font-bold text-sm mt-0.5">₹{mp.product.price}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed bg-[#14B8A6]/5 p-3 rounded-lg border border-[#14B8A6]/10">
                      <span className="font-black text-[#14B8A6]/50 mr-1">RATIONALE:</span> {mp.reason || "Matched based on your specific health concerns."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Disclaimer Print Only */}
      <div className="hidden print:block mt-12 pt-8 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400 italic">
          This report is AI-generated for informational purposes and does not constitute official medical advice.
          Please consult with a qualified healthcare professional before starting any new treatment or supplement.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          .p-8 { padding: 0 !important; }
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
          .glass-panel { background: white !important; backdrop-filter: none !important; }
          .bg-gradient-to-br { background: #f8fafc !important; }
        }
      `}</style>
    </>
  );
}

function AssessmentField({ label, value, icon: Icon }: any) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 group transition-all hover:pl-1">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-slate-300 group-hover:text-[#14B8A6] transition-colors" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-black text-[#0B132B] capitalize bg-slate-50 px-2.5 py-1 rounded-md group-hover:bg-[#14B8A6]/5 transition-colors">{value}</span>
    </div>
  );
}

function CardSection({ title, icon: Icon, iconBg, items }: any) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-display font-black text-[#0B132B] text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <ul className="space-y-4">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-3 group">
            <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]/30 mt-2 shrink-0 group-hover:bg-[#14B8A6] group-hover:scale-125 transition-all" />
            <span className="text-sm text-slate-600 font-medium leading-relaxed group-hover:text-[#0F3C3A] transition-colors">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageSquareIcon({ size, className }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}
