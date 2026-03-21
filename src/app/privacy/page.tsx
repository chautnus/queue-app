import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for QueueApp.",
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: March 2026</p>

          <div className="card p-6 sm:p-8 space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
              <p className="mb-3">We collect information in the following ways:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Account information:</strong> Name, email address, and password when you register
                </li>
                <li>
                  <strong>Queue data:</strong> Queue configurations, service names, and operational settings
                </li>
                <li>
                  <strong>Customer data:</strong> Names and phone numbers provided when joining a queue
                </li>
                <li>
                  <strong>Usage data:</strong> How you interact with the service, including page views and
                  feature usage
                </li>
                <li>
                  <strong>Device information:</strong> Browser type, operating system, and device identifiers
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Information</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide, maintain, and improve the queue management service</li>
                <li>Send real-time updates and notifications about queue status</li>
                <li>Generate analytics and reports for queue owners</li>
                <li>Communicate important service updates and changes</li>
                <li>Prevent fraud and ensure security of the platform</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share data in the following limited
                circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>With service providers who help us operate the platform (hosting, analytics)</li>
                <li>When required by law, regulation, or legal process</li>
                <li>To protect the rights, safety, and property of QueueApp and its users</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Retention</h2>
              <p>
                We retain your account data for as long as your account is active. Queue and customer data
                is retained for up to 90 days after queue completion to support analytics and reporting.
                You may request deletion of your data at any time by contacting us or deleting your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including encryption
                in transit (TLS) and at rest, secure authentication, and regular security reviews. However,
                no method of transmission or storage is 100% secure, and we cannot guarantee absolute
                security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for optional data processing</li>
                <li>Lodge a complaint with a data protection authority</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Cookies</h2>
              <p>
                We use essential cookies for authentication and session management. We may also use
                analytics cookies to understand how the service is used. You can manage cookie preferences
                through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Contact</h2>
              <p>
                If you have questions or concerns about this privacy policy or your data, please contact
                us at{" "}
                <a href="mailto:support@queueapp.dev" className="text-blue-600 hover:underline">
                  support@queueapp.dev
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/about" className="hover:text-slate-900 transition-colors">About</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-slate-900 font-medium">Privacy</Link>
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
