import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tighter">Privacy Policy</h1>
      <p className="text-zinc-600 leading-relaxed">
        This Privacy Policy explains how we process personal data when you use this website and the
        Scutch application (the “Service”).
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">1. Controller</h2>
        <p className="text-zinc-600 leading-relaxed">
          The data controller (“Provider”) is the entity operating this Service. The Provider’s legal
          details and contact information are available in the{' '}
          <a href="/impressum" className="underline underline-offset-4 hover:text-zinc-950 transition-colors">
            Site Notice
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">2. Categories of Data</h2>
        <ul className="list-disc pl-5 text-zinc-600 space-y-1">
          <li>Account data (e.g., email address, authentication identifiers)</li>
          <li>Service content you provide (e.g., uploaded feedback, text you paste, generated reports)</li>
          <li>Usage and technical data (e.g., timestamps, feature usage, device/browser signals)</li>
          <li>Billing data (subscription status and payment-related metadata processed via our payment provider)</li>
          <li>Support communications (if you contact us)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">3. Purposes and Legal Bases (GDPR)</h2>
        <ul className="list-disc pl-5 text-zinc-600 space-y-1">
          <li>
            Providing the Service (account creation, analysis, storage, exports) – Art. 6(1)(b) GDPR
            (contract).
          </li>
          <li>
            Security and abuse prevention – Art. 6(1)(f) GDPR (legitimate interests).
          </li>
          <li>
            Billing and accounting – Art. 6(1)(b) GDPR and, where applicable, Art. 6(1)(c) GDPR (legal
            obligation).
          </li>
          <li>
            Optional cookies/technologies (where used) – Art. 6(1)(a) GDPR (consent).
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">4. Recipients and Processors</h2>
        <p className="text-zinc-600 leading-relaxed">
          We use service providers (processors) to operate the Service, such as hosting/database
          providers, authentication infrastructure, payment processing, and AI model providers used to
          perform analyses you request. These providers process data on our behalf and under
          appropriate agreements.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">5. International Transfers</h2>
        <p className="text-zinc-600 leading-relaxed">
          Depending on the providers used, data may be processed in countries outside the EEA. Where
          required, we rely on appropriate safeguards (e.g., adequacy decisions or standard contractual
          clauses).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">6. Retention</h2>
        <p className="text-zinc-600 leading-relaxed">
          We retain personal data only for as long as necessary for the purposes described above,
          including providing the Service and meeting legal obligations. You can delete content within
          the Service where available; account deletion requests can be made via the contact details in
          the Site Notice.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">7. Cookies and Similar Technologies</h2>
        <p className="text-zinc-600 leading-relaxed">
          We use essential storage (e.g., to keep you signed in and maintain security). If we use
          optional cookies/technologies, we will ask for your consent via a cookie banner.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">8. Your Rights</h2>
        <p className="text-zinc-600 leading-relaxed">
          Subject to the GDPR, you may have the right to access, rectification, erasure, restriction,
          data portability, and to object to processing. If processing is based on consent, you may
          withdraw consent at any time with effect for the future.
        </p>
        <p className="text-zinc-600 leading-relaxed">
          You also have the right to lodge a complaint with a supervisory authority.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">9. Contact</h2>
        <p className="text-zinc-600 leading-relaxed">
          For privacy-related inquiries, please use the contact information in the{' '}
          <a href="/impressum" className="underline underline-offset-4 hover:text-zinc-950 transition-colors">
            Site Notice
          </a>
          .
        </p>
      </section>
    </article>
  );
};
