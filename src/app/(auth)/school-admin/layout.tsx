import type { ReactNode } from "react";

import { SchoolAdminSidebar } from "@/src/components/school-admin/SchoolAdminSidebar";
import { requireSchoolAdminSession } from "@/src/components/school-admin/school-admin-access";

export default async function SchoolAdminLayout({ children }: { children: ReactNode }) {
  await requireSchoolAdminSession();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <SchoolAdminSidebar />
        <div className="min-w-0 flex-1 border-slate-200 lg:border-l">{children}</div>
      </div>
    </div>
  );
}
