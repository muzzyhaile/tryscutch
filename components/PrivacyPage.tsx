import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tighter">Privacy Policy</h1>
      <p className="text-zinc-600 leading-relaxed">
        This page is a placeholder privacy policy template. Replace the sections below with your
        actual information (data controller, processing purposes, retention, DPA/subprocessors, etc.).
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">1. Data Controller</h2>
        <p className="text-zinc-600 leading-relaxed">
          Company name, address, contact email.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">2. What We Collect</h2>
        <ul className="list-disc pl-5 text-zinc-600 space-y-1">
          <li>Account information (email, name, auth provider identifiers)</li>
          <li>Uploaded feedback content you provide for analysis</li>
          <li>Billing/subscription metadata (via Stripe)</li>
          <li>Usage metrics for quota enforcement</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">3. Why We Process Data</h2>
        <ul className="list-disc pl-5 text-zinc-600 space-y-1">
          <li>To provide the service (analysis, exports, storage)</li>
          <li>To secure the product and prevent abuse</li>
          <li>To process payments and manage subscriptions</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">4. Your Rights</h2>
        <p className="text-zinc-600 leading-relaxed">
          Describe user rights (access, deletion, rectification, portability, objection) and how to
          contact you.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">5. Contact</h2>
        <p className="text-zinc-600 leading-relaxed">privacy@your-domain.com</p>
      </section>

      <p className="text-xs text-zinc-400">
        Note: This is not legal advice. Have counsel review before publishing.
      </p>
    </article>
  );
};
