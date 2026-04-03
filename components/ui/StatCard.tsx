import { cn, formatPrice } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  isCurrency?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, trendValue, isCurrency }: StatCardProps) {
  const formattedValue = isCurrency && typeof value === 'number' ? formatPrice(value) : value;

  return (
    <div className="bento-card p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-[#14B8A6]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0F3C3A]" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-display font-semibold text-[#0B132B]">
          {formattedValue}
        </p>
        
        {trend && trendValue && (
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              trend === "up" ? "bg-green-100 text-green-700" : 
              trend === "down" ? "bg-red-100 text-red-700" : 
              "bg-slate-100 text-slate-700"
            )}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "−"} {trendValue}
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
