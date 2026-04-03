"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="w-full flex-1 overflow-y-auto">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        {children}
      </main>
    </>
  );
}
