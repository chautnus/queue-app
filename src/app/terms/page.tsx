import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for QueueApp.",
};

export default function TermsPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: March 2026</p>

          <div className="card p-6 sm:p-8 space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using QueueApp, you agree to be bound by these Terms of Service. If you
                do not agree to these terms, please do not use the service. We reserve the right to update
                these terms at any time, and continued use of the service constitutes acceptance of any
                changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Service Description</h2>
              <p>
                QueueApp provides a digital queue management platform that allows businesses to create and
                manage virtual queues. Customers can join queues by scanning QR codes and receive real-time
                updates on their position. The service is provided on an &ldquo;as-is&rdquo; and
                &ldquo;as-available&rdquo; basis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. User Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the service in compliance with all applicable laws and regulations</li>
                <li>Not misuse, abuse, or attempt to disrupt the service</li>
                <li>Not use the service for any unlawful or unauthorized purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Usage</h2>
              <p>
                We collect and process data necessary to provide the queue management service. This
                includes queue activity, user preferences, and usage analytics. For full details on how we
                handle your data, please refer to our{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Intellectual Property</h2>
              <p>
                All content, trademarks, and intellectual property associated with QueueApp are owned by
                QueueApp and its licensors. You may not copy, modify, distribute, or reverse-engineer any
                part of the service without prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, QueueApp and its affiliates shall not be liable for
                any indirect, incidental, special, consequential, or punitive damages arising from your use
                of the service. Our total liability shall not exceed the amount you have paid us in the
                twelve months preceding any claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Termination</h2>
              <p>
                We may suspend or terminate your access to the service at any time for violation of these
                terms or for any reason at our sole discretion. You may also delete your account at any
                time through the account settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Contact</h2>
              <p>
                If you have questions about these terms, please contact us at{" "}
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
            <Link href="/terms" className="text-slate-900 font-medium">Terms</Link>
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
