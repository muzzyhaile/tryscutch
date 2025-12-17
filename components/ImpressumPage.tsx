import React from 'react';

export const ImpressumPage: React.FC = () => {
  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tighter">Site Notice</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Site Notice</h2>
        <p className="text-zinc-600 leading-relaxed">Information pursuant to § 5 DDG (Digital Services Act)</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Provider</h2>
        <p className="text-zinc-600 leading-relaxed">
          Mussie Haile
          <br />
          Guiding-Ventures
          <br />
          Lohmühlenstraße 65
          <br />
          12435 Berlin
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Contact</h2>
        <p className="text-zinc-600 leading-relaxed">
          Phone: +4917687053245
          <br />
          E-mail: admin@guidingventures.com
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">VAT ID</h2>
        <p className="text-zinc-600 leading-relaxed">
          Sales tax identification number according to Sect. 27 a of the Sales Tax Law:
          <br />
          DE348867516
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Person responsible for editorial</h2>
        <p className="text-zinc-600 leading-relaxed">Mussie Haile</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">EU dispute resolution</h2>
        <p className="text-zinc-600 leading-relaxed">
          The European Commission provides a platform for online dispute resolution (ODR):{' '}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-zinc-950 transition-colors"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          .
          <br />
          Our e-mail address can be found above in the site notice.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Dispute resolution proceedings in front of a consumer arbitration board</h2>
        <p className="text-zinc-600 leading-relaxed">
          We are not willing or obliged to participate in dispute resolution proceedings in front of a consumer arbitration board.
        </p>
      </section>
    </article>
  );
};
