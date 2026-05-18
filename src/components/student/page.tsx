// 1. SSL/TLS Override for AWS RDS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import React from 'react';
import { Pool } from 'pg';
import StudentLayout from '@/components/student/StudentLayout';

// 2. Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function getLessons() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT id, title, slug, sequence_order, xp_reward
      FROM lab_curriculum_lessons 
      WHERE curriculum_id = 'e1000003-0000-4000-8000-000000000002'
      ORDER BY sequence_order ASC
    `);
    return res.rows;
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  } finally {
    client.release();
  }
}

export default async function LessonsPage() {
  const lessons = await getLessons();

  return (
    <StudentLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header with Stats Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">
              Curriculum Path
            </h2>
            <p className="text-slate-500 font-medium">
              Srivilliputhur Pilot: <span className="text-blue-600 font-bold">Robotics & AI Mastery</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Available Modules</p>
              <p className="text-xl font-black text-slate-800">{lessons.length}</p>
            </div>
            <div className="bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <p className="text-[10px] font-bold text-blue-100 uppercase">Total XP</p>
              <p className="text-xl font-black text-white">3,500</p>
            </div>
          </div>
        </div>

        {/* Lesson Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {lessons.map((lesson) => {
            const isRobotics = lesson.slug.startsWith('rob');
            const isAI = lesson.slug.startsWith('ai');

            return (
              <div 
                key={lesson.id} 
                className="group relative bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Background Accent Decor */}
                <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 transition-transform group-hover:scale-150 ${
                  isRobotics ? 'bg-purple-600' : isAI ? 'bg-amber-600' : 'bg-cyan-600'
                }`} />

                <div className="flex justify-between items-start mb-6">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                    isRobotics ? 'bg-purple-50 text-purple-600' : isAI ? 'bg-amber-50 text-amber-600' : 'bg-cyan-50 text-cyan-600'
                  }`}>
                    {isRobotics ? '🤖' : isAI ? '🧠' : '💻'}
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    Step {lesson.sequence_order}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${isRobotics ? 'bg-purple-400' : 'bg-cyan-400'}`} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      {isRobotics ? 'Robotics Engineering' : isAI ? 'Artificial Intelligence' : 'Software Logic'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Completion Reward</span>
                    <span className="text-sm font-black text-emerald-600">+{lesson.xp_reward} XP</span>
                  </div>
                  <button className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors shadow-md">
                    START MISSION
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {lessons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <span className="text-5xl mb-4">🛰️</span>
             <h3 className="text-lg font-bold text-slate-800 italic">No Modules Discovered</h3>
             <p className="text-slate-400 text-sm">Synchronize with AWS RDS to pull new curriculum data.</p>
          </div>
        )}

        <footer className="mt-12 text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                AI Academy Pro © 2026 | Srivilliputhur Pilot Deployment
            </p>
        </footer>
      </div>
    </StudentLayout>
  );
}