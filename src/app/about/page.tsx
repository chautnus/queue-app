import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about QueueApp and our mission to modernize queue management.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
              <rect width="28" height="28" rx="8" fill="#2563eb" />
              <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            QueueApp
          </Link>
          <Link href="/" className="btn-ghost text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">About QueueApp</h1>

          <div className="card p-6 sm:p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">What is QueueApp?</h2>
              <p className="text-slate-600 leading-relaxed">
                QueueApp is a modern, digital queue management platform designed for businesses of all sizes.
                It replaces traditional paper ticket systems with a seamless, mobile-first experience that
                customers and staff love. No hardware to buy, no apps to install &mdash; just scan a QR code
                and join the queue.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed">
                We believe that waiting in line should not be a frustrating experience. Our mission is to
                give every business &mdash; from local clinics and government offices to restaurants and
                retail stores &mdash; the tools to manage queues efficiently, reduce wait times, and deliver
                a better customer experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Key Benefits</h2>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Set up in under 60 seconds with zero hardware</li>
                <li>Customers join via QR code &mdash; no app download needed</li>
                <li>Real-time updates and push notifications</li>
                <li>Multiple services and counters per queue</li>
                <li>Display board for waiting areas</li>
                <li>Analytics and insights to optimize operations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                Have questions, feedback, or partnership inquiries? We would love to hear from you.
              </p>
              <p className="mt-2 text-slate-600">
                Email:{" "}
                <a href="mailto:support@queueapp.dev" className="text-blue-600 hover:underline">
                  support@queueapp.dev
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/about" className="text-slate-900 font-medium">About</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="mailto:support@queueapp.dev" className="hover:text-slate-900 transition-colors">Contact</Link>
          </nav>
          <span className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} QueueApp. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
