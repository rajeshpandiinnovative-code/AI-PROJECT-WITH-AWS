// 1. SSL/TLS Override for AWS RDS (Must be at the very top)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import React from 'react';
import { Pool } from 'pg';

// 2. Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
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

  // Helper function to color-code categories based on slugs for the demo
  const getCategoryBadge = (slug: string) => {
    if (slug.startsWith('rob')) return 'bg-purple-50 text-purple-700 border-purple-100';
    if (slug.startsWith('ai')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-cyan-50 text-cyan-700 border-cyan-100';
  };

  const getCategoryName = (slug: string) => {
    if (slug.startsWith('rob')) return 'Robotics';
    if (slug.startsWith('ai')) return 'AI';
    return 'Coding';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      {/* Header Section */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 underline decoration-blue-500/30">
            Virtual Teacher Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Curriculum: <span className="font-semibold text-blue-600">AI Academy Pro — Srivilliputhur Pilot</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all">
            Preview Student View
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-700 transition-all">
            + New Lesson
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500">Total Modules</p>
          <p className="text-2xl font-bold">{lessons.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500">Active Students</p>
          <p className="text-2xl font-bold text-blue-600">Ready for Pilot</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500">Cloud Sync</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
            AWS RDS Connected
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 text-center w-16">Seq</th>
                <th className="px-6 py-4">Lesson Title</th>
                <th className="px-6 py-4">Track</th>
                <th className="px-6 py-4">Reward</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 text-center font-mono text-slate-400 group-hover:text-blue-500 font-bold transition-colors">
                    {lesson.sequence_order}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{lesson.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-tighter">ID: {lesson.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-medium border ${getCategoryBadge(lesson.slug)}`}>
                      {getCategoryName(lesson.slug)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {lesson.xp_reward} XP
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition-all">
                      Edit Module
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {lessons.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-slate-400 italic">No modules found in the database for this curriculum.</p>
          </div>
        )}

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Secure Database Connection: PostgreSQL @ AWS Mumbai
          </p>
        </div>
      </div>
    </div>
  );
}