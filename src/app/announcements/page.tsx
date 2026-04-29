import Link from "next/link";
import PublicFooter from "@/components/PublicFooter";

export default function AnnouncementsPage() {
  const announcements = [
    {
      id: 1,
      title: "New Feature: Real-time Analytics",
      date: "2026-04-25",
      excerpt: "Track your queue performance with our brand new analytics dashboard.",
    },
    {
      id: 2,
      title: "System Maintenance",
      date: "2026-04-20",
      excerpt: "Scheduled maintenance on May 1st, 2026. Minimal downtime expected.",
    },
    {
      id: 3,
      title: "Now supporting 10+ languages",
      date: "2026-04-15",
      excerpt: "We've expanded our localization to support even more businesses worldwide.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
            <div className="relative w-10 h-10 flex items-center justify-center bg-blue-600 rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M4 6H20M4 12H16M4 18H12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Free<span className="text-blue-600">Queue</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Announcements</h1>
        <p className="text-lg text-slate-600 mb-12">Stay up to date with the latest news and updates from FreeQueue.</p>

        <div className="space-y-8">
          {announcements.map((item) => (
            <article key={item.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <time className="text-sm font-bold text-blue-600 uppercase tracking-widest">{item.date}</time>
              <h2 className="text-2xl font-bold text-slate-900 mt-2 mb-4">{item.title}</h2>
              <p className="text-slate-600 leading-relaxed">{item.excerpt}</p>
              <button className="mt-6 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2">
                Read full story
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </button>
            </article>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
