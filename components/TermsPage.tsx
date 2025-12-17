import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tighter">Terms &amp; Conditions</h1>
      <p className="text-zinc-600 leading-relaxed">
        This page is a placeholder terms template. Replace with your actual Terms (service scope,
        acceptable use, disclaimers, liability limits, governing law, billing/refunds, etc.).
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">1. Service</h2>
        <p className="text-zinc-600 leading-relaxed">
          Describe what the product does and what is included.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">2. Accounts</h2>
        <p className="text-zinc-600 leading-relaxed">
          Explain account creation, security responsibilities, and termination.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">3. Billing</h2>
        <p className="text-zinc-600 leading-relaxed">
          Outline subscription billing, renewals, cancellations, and refunds.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">4. Acceptable Use</h2>
        <p className="text-zinc-600 leading-relaxed">
          Define prohibited behavior and content.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">5. Limitation of Liability</h2>
        <p className="text-zinc-600 leading-relaxed">
          Add the limitation clauses appropriate for your jurisdiction and customer type.
        </p>
      </section>

      <p className="text-xs text-zinc-400">
        Note: This is not legal advice. Have counsel review before publishing.
      </p>
    </article>
  );
};
