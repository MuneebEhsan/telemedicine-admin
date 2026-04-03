import { Bell, Search } from "lucide-react";

export default function Header({ title }: { title: string }) {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-[#0B132B]/5 bg-white/50 backdrop-blur-md sticky top-0 z-10">
      <h1 className="text-xl font-display font-semibold text-[#0B132B]">{title}</h1>
      
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 w-64 bg-slate-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all placeholder:text-slate-400"
          />
        </div>
        
        <button className="relative text-slate-400 hover:text-[#0B132B] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="text-right">
            <p className="text-sm font-medium text-[#0B132B] leading-none">Admin User</p>
            <p className="text-xs text-slate-500 mt-1">Superadmin</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[#0B132B] font-display font-semibold text-sm">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
