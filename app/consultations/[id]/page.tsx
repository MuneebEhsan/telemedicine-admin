"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, User, Stethoscope, MessageSquare, FileText,
  FlaskConical, Video, Phone, Clock, CheckCircle, XCircle,
  Activity, Upload
} from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

const TABS = [
  { id: "messages", label: "Chat Messages", icon: MessageSquare },
  { id: "prescriptions", label: "Prescriptions", icon: FileText },
  { id: "labtests", label: "Lab Tests", icon: FlaskConical },
];

const msgTypeStyles: Record<string, string> = {
  text: "",
  system: "italic text-slate-400",
  delay_notice: "text-amber-600",
  prescription: "text-blue-700 font-medium",
  lab_test: "text-purple-700 font-medium",
  lab_upload: "text-green-700 font-medium",
  call_initiated: "text-indigo-700 font-medium",
};

const statusConfig: Record<string, string> = {
  booked: "bg-blue-100 text-blue-800",
  in_progress: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("messages");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await adminApi.getConsultationById(id);
        if (res.success) setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-slate-500">Consultation not found.</div>;
  }

  const { appointment, messages = [], prescriptions = [], labTests = [] } = data;
  const status = appointment?.status || "unknown";

  return (
    <>
      <Header title="Consultation Details" />

      <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-6">
        {/* Back */}
        <Link href="/consultations" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0F3C3A] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Consultations
        </Link>

        {/* Summary Card */}
        <div className="glass-panel rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap gap-6 items-start">
            {/* Appointment Meta */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-[#0B132B]">#{appointment.appointmentNumber}</span>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", statusConfig[status] || "bg-slate-100 text-slate-700")}>
                  {status.replace(/_/g, " ")}
                </span>
                {appointment.callType && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-600 capitalize">
                    {appointment.callType === "video" ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                    {appointment.callType}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient */}
                <InfoCard
                  icon={User}
                  label="Patient"
                  primary={appointment.patient?.name || "—"}
                  secondary={appointment.patient?.phone}
                />
                {/* Doctor */}
                <InfoCard
                  icon={Stethoscope}
                  label="Doctor"
                  primary={appointment.doctor?.doctorProfile?.professionalName || appointment.doctor?.name || "—"}
                  secondary={appointment.doctor?.doctorProfile?.specialization}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 min-w-[200px] space-y-2">
              <TimelineItem label="Booked" value={formatDate(appointment.createdAt)} icon={Clock} />
              {appointment.actualStartTime && (
                <TimelineItem label="Started" value={formatDate(appointment.actualStartTime)} icon={Activity} />
              )}
              {appointment.actualEndTime && (
                <TimelineItem label="Ended" value={formatDate(appointment.actualEndTime)} icon={CheckCircle} />
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-5 grid grid-cols-3 gap-4">
            <StatBadge label="Messages" value={messages.length} color="text-slate-700" />
            <StatBadge label="Prescriptions" value={prescriptions.length} color="text-blue-700" />
            <StatBadge label="Lab Tests" value={labTests.length} color="text-purple-700" />
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[#14B8A6] text-[#0F3C3A]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Messages */}
            {activeTab === "messages" && (
              messages.length === 0 ? (
                <EmptyState icon={MessageSquare} text="No messages in this consultation." />
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {messages.map((msg: any) => (
                    <div
                      key={msg._id}
                      className={cn(
                        "flex gap-3",
                        msg.senderRole === "doctor" ? "flex-row-reverse" : ""
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                        msg.senderRole === "doctor" ? "bg-blue-100 text-blue-700" :
                        msg.senderRole === "system" ? "bg-slate-200 text-slate-500" :
                        "bg-[#14B8A6]/20 text-[#0F3C3A]"
                      )}>
                        {msg.senderRole === "system" ? "S" : msg.sender?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>

                      {/* Bubble */}
                      <div className={cn(
                        "max-w-[70%] rounded-xl px-4 py-2.5",
                        msg.senderRole === "doctor" ? "bg-blue-50 border border-blue-100" :
                        msg.senderRole === "system" ? "bg-slate-100 border border-slate-200" :
                        "bg-white border border-slate-200"
                      )}>
                        {msg.senderRole !== "system" && (
                          <p className="text-xs font-semibold text-slate-500 mb-0.5">
                            {msg.sender?.name || msg.senderRole}
                          </p>
                        )}
                        <p className={cn("text-sm", msgTypeStyles[msg.type] || "text-slate-700")}>
                          {msg.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(msg.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Prescriptions */}
            {activeTab === "prescriptions" && (
              prescriptions.length === 0 ? (
                <EmptyState icon={FileText} text="No prescriptions in this consultation." />
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx: any) => (
                    <div key={rx._id} className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <p className="font-semibold text-[#0B132B]">By: {rx.doctor?.doctorProfile?.professionalName || rx.doctor?.name || "Doctor"}</p>
                          <p className="text-xs text-slate-400">{formatDate(rx.createdAt)}</p>
                        </div>
                        {rx.diagnosis && (
                          <div className="bg-blue-50 rounded-lg px-3 py-1.5 text-xs text-blue-800 border border-blue-100">
                            Diagnosis: {rx.diagnosis}
                          </div>
                        )}
                      </div>

                      {rx.chiefComplaints && (
                        <p className="text-sm text-slate-600 mb-3"><span className="font-medium">Chief Complaints:</span> {rx.chiefComplaints}</p>
                      )}

                      {/* Medicines */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-slate-100 rounded-lg overflow-hidden">
                          <thead className="bg-slate-50 text-slate-500 text-xs">
                            <tr>
                              <th className="px-3 py-2 text-left">Medicine</th>
                              <th className="px-3 py-2 text-left">Dosage</th>
                              <th className="px-3 py-2 text-left">Frequency</th>
                              <th className="px-3 py-2 text-left">Duration</th>
                              <th className="px-3 py-2 text-left">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rx.medicines?.map((med: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium text-[#0B132B]">{med.name}</td>
                                <td className="px-3 py-2 text-slate-600">{med.dosage}</td>
                                <td className="px-3 py-2 text-slate-600">{med.frequency}</td>
                                <td className="px-3 py-2 text-slate-600">{med.duration}</td>
                                <td className="px-3 py-2 text-slate-500 text-xs">{med.instructions || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {rx.notes && <p className="mt-3 text-sm text-slate-500 italic">Notes: {rx.notes}</p>}
                      {rx.followUp && <p className="text-sm text-slate-500">Follow-up: {rx.followUp}</p>}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Lab Tests */}
            {activeTab === "labtests" && (
              labTests.length === 0 ? (
                <EmptyState icon={FlaskConical} text="No lab tests ordered in this consultation." />
              ) : (
                <div className="space-y-4">
                  {labTests.map((lt: any) => (
                    <div key={lt._id} className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-slate-400">{formatDate(lt.createdAt)}</p>
                      </div>

                      {/* Tests ordered */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {lt.tests?.map((t: any, i: number) => (
                          <div key={i} className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-1.5">
                            <p className="text-sm font-medium text-purple-800">{t.name}</p>
                            {t.instructions && <p className="text-xs text-purple-600">{t.instructions}</p>}
                          </div>
                        ))}
                      </div>

                      {/* Uploaded docs */}
                      {lt.uploadedDocuments?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Upload className="w-3 h-3" /> Uploaded Results
                          </p>
                          <div className="space-y-1.5">
                            {lt.uploadedDocuments.map((doc: any, i: number) => (
                              <a
                                key={i}
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-[#14B8A6] hover:underline"
                              >
                                <FileText className="w-4 h-4 shrink-0" />
                                {doc.documentName}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {lt.notes && <p className="mt-3 text-sm text-slate-500 italic">Notes: {lt.notes}</p>}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoCard({ icon: Icon, label, primary, secondary }: any) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
      <Icon className="w-4 h-4 text-[#14B8A6] mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-[#0B132B] text-sm">{primary}</p>
        {secondary && <p className="text-xs text-slate-500">{secondary}</p>}
      </div>
    </div>
  );
}

function TimelineItem({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
      <span className="text-slate-500 text-xs">{label}:</span>
      <span className="text-slate-700 text-xs">{value}</span>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="py-12 flex flex-col items-center text-slate-400 gap-3">
      <Icon className="w-10 h-10 text-slate-300" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
