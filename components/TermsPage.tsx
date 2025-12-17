import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tighter">Terms &amp; Conditions</h1>
      <p className="text-zinc-600 leading-relaxed">
        These Terms &amp; Conditions (“Terms”) govern your access to and use of the Scutch website and
        application (the “Service”). By using the Service, you agree to these Terms.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">1. Provider</h2>
        <p className="text-zinc-600 leading-relaxed">
          The Service is operated by the Provider identified in the{' '}
          <a href="/impressum" className="underline underline-offset-4 hover:text-zinc-950 transition-colors">
            Site Notice
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">2. The Service</h2>
        <p className="text-zinc-600 leading-relaxed">
          The Service helps you upload, store, analyze, and export feedback and related content. The
          Service may include AI-assisted features. Outputs are generated automatically and may be
          inaccurate or incomplete.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">3. Accounts</h2>
        <p className="text-zinc-600 leading-relaxed">
          You are responsible for maintaining the confidentiality of your account and for all
          activities under your account. You must provide accurate information and keep it up to date.
          We may suspend or terminate access if we reasonably believe you have violated these Terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">4. Your Content</h2>
        <p className="text-zinc-600 leading-relaxed">
          You retain your rights to content you upload or submit (“User Content”). You grant us a
          limited, non-exclusive license to host, process, and display your User Content solely to
          provide and improve the Service (including running analyses you request).
        </p>
        <p className="text-zinc-600 leading-relaxed">
          You represent that you have the necessary rights to submit User Content and that doing so
          does not violate applicable law or third-party rights.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">5. Acceptable Use</h2>
        <ul className="list-disc pl-5 text-zinc-600 space-y-1">
          <li>Do not use the Service to violate laws or infringe rights.</li>
          <li>Do not upload malware or attempt to disrupt, probe, or reverse engineer the Service.</li>
          <li>Do not attempt to access other users’ data without authorization.</li>
          <li>Do not use the Service to generate or distribute unlawful content.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">6. Plans, Billing, and Cancellation</h2>
        <p className="text-zinc-600 leading-relaxed">
          Paid plans are billed in advance and processed through our payment provider. Plan features
          and usage limits are described in the Service. You can cancel at any time; cancellation
          takes effect at the end of the current billing period unless stated otherwise at checkout.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">7. Availability and Changes</h2>
        <p className="text-zinc-600 leading-relaxed">
          We may modify, suspend, or discontinue parts of the Service at any time. We may update these
          Terms; if changes are material, we will provide reasonable notice in the Service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">8. Disclaimer</h2>
        <p className="text-zinc-600 leading-relaxed">
          The Service is provided “as is” and “as available.” To the extent permitted by law, we
          disclaim warranties of merchantability, fitness for a particular purpose, and
          non-infringement. You are responsible for reviewing outputs and making your own decisions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">9. Limitation of Liability</h2>
        <p className="text-zinc-600 leading-relaxed">
          To the extent permitted by law, we are not liable for indirect, incidental, special,
          consequential, or punitive damages, or for loss of profits, revenue, data, or goodwill.
          Nothing in these Terms limits liability where such limitation is prohibited by applicable
          law (including mandatory consumer rights).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">10. Contact</h2>
        <p className="text-zinc-600 leading-relaxed">
          Contact details are available in the{' '}
          <a href="/impressum" className="underline underline-offset-4 hover:text-zinc-950 transition-colors">
            Site Notice
          </a>
          .
        </p>
      </section>
    </article>
  );
};
