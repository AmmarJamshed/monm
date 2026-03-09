import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — MonM',
  description: 'MonM Privacy Policy. How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--wa-bg)] text-[var(--wa-text)]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--wa-accent)] hover:underline mb-8 text-sm font-medium">
          ← Back to MonM
        </Link>

        <h1 className="font-display text-3xl font-bold text-[var(--wa-header)] mb-2">
          Privacy Policy
        </h1>
        <p className="text-[var(--wa-text-muted)] text-sm mb-10">
          MonM Security Messenger · Last updated: February 2025
        </p>

        <div className="space-y-8 text-[var(--wa-text)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">1. Introduction</h2>
            <p>
              MonM (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a privacy-first secure messaging application. This Privacy Policy explains how we collect, use, store, and protect your information when you use the MonM app, PWA, or website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect only what is necessary to provide the service:</p>
            <ul className="list-disc pl-6 space-y-1 text-[var(--wa-text-muted)]">
              <li><strong className="text-[var(--wa-text)]">Account data:</strong> Name, phone number or username you provide during signup</li>
              <li><strong className="text-[var(--wa-text)]">Messages:</strong> Encrypted end-to-end; we cannot read message content</li>
              <li><strong className="text-[var(--wa-text)]">Media:</strong> Files you send are encrypted and stored via third-party storage (IPFS)</li>
              <li><strong className="text-[var(--wa-text)]">Device data:</strong> Basic app usage for connectivity (e.g. WebSocket sessions)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">3. How We Use Your Data</h2>
            <p>
              We use your data solely to operate MonM: delivering messages, maintaining your account, and improving the service. We do not sell, rent, or share your personal data with advertisers or third parties for marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">4. Security & Encryption</h2>
            <p>
              Messages are encrypted (AES-256-GCM) before transmission. We use industry-standard security practices. On Android, the app uses FLAG_SECURE to help prevent screenshots of sensitive content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">5. Third-Party Services</h2>
            <p className="mb-3">MonM may use:</p>
            <ul className="list-disc pl-6 space-y-1 text-[var(--wa-text-muted)]">
              <li>Hosting and API providers (e.g. Render, Netlify)</li>
              <li>Decentralized storage (IPFS) for media</li>
              <li>Blockchain networks for integrity/audit (invisible to users)</li>
            </ul>
            <p className="mt-3">
              Each has its own privacy practices. We choose providers that align with our privacy standards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">6. Data Retention</h2>
            <p>
              We retain your account and message data for as long as your account is active. You may request deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">7. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete, or export your data. Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">8. Children</h2>
            <p>
              MonM is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has provided us data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">9. Changes</h2>
            <p>
              We may update this policy from time to time. We will notify users of material changes via the app or email where appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--wa-header)] mb-3">10. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at the support channel provided in the MonM app or via the app&apos;s official website.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--wa-border)]">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--wa-accent)] hover:underline text-sm font-medium">
            ← Back to MonM
          </Link>
        </div>
      </div>
    </div>
  );
}
