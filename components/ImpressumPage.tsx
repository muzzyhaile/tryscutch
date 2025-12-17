import React from 'react';

export const ImpressumPage: React.FC = () => {
  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tighter">Impressum</h1>
      <p className="text-zinc-600 leading-relaxed">
        This is the site notice ("Impressum"). Replace the placeholders with the legally required
        details for your business (Germany/EEA rules vary by entity type and offering).
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Provider</h2>
        <p className="text-zinc-600 leading-relaxed">
          Company / Sole proprietor name<br />
          Street address<br />
          Postal code, City<br />
          Country
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Contact</h2>
        <p className="text-zinc-600 leading-relaxed">
          Email: contact@your-domain.com<br />
          Phone: +49 ...
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Represented by</h2>
        <p className="text-zinc-600 leading-relaxed">Managing director / owner name</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Register / VAT</h2>
        <p className="text-zinc-600 leading-relaxed">
          Commercial register: ...<br />
          Register court: ...<br />
          VAT ID (USt-IdNr.): ...
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Responsible for content</h2>
        <p className="text-zinc-600 leading-relaxed">
          Name, address (if different)
        </p>
      </section>

      <p className="text-xs text-zinc-400">
        Note: This is not legal advice. Have counsel review before publishing.
      </p>
    </article>
  );
};
