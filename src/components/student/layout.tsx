// src/components/StudentLayout.tsx
import React from 'react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">A</div>
          <span className="text-xl font-bold text-white tracking-tight">AI Academy</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon="🏠" label="Dashboard" active />
          <NavItem icon="📚" label="My Learning" />
          <NavItem icon="🤖" label="AI Tutor" />
          <NavItem icon="🛠️" label="Projects" />
        </nav>

        <div className="p-4 m-4 bg-[#1E293B] rounded-xl border border-slate-700">
          <p className="text-xs font-semibold text-slate-500 uppercase">Your Level</p>
          <p className="text-lg font-bold text-white">Level 8</p>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2">
            <div className="bg-blue-500 h-full rounded-full w-[65%]"></div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: string, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}