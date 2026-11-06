import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { BRAND } from "@/config";
import SpeciesTable from "@/components/SpeciesTable";
import { useLang, useT } from "@/i18n";

export default function Home() {
  const t = useT();
  const { lang } = useLang();
  const featured = trpc.species.list.useQuery({ featuredOnly: true });
  const cats = trpc.categories.list.useQuery();

  return (
    <div>
      {/* Hero */}
      <section
        className="relative border-b border-neutral-200 bg-[#06162d] bg-cover bg-center text-white"
        style={{ backgroundImage: "url(/hero.jpg)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#06162d]/95 via-[#06162d]/80 to-[#06162d]/40" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 md:flex-row md:py-32">
          <div className="flex-1">
            <div className="mb-4 text-xs uppercase tracking-[0.3em] text-[#c9a227]">
              {t("home.kicker")}
            </div>
            <h1 className="font-serif-display text-4xl font-bold leading-tight md:text-6xl">
              {BRAND.slogan}
            </h1>
            <p className="mt-4 font-serif-display text-xl italic text-[#c9a227]">
              {BRAND.sloganCn}
            </p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-neutral-300">{t("home.intro")}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/species"
                className="bg-[#c9a227] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#06162d] hover:bg-[#d8b64a]"
              >
                {t("home.browse")}
              </Link>
              <Link
                to="/inquiry"
                className="border border-white px-6 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-white hover:text-[#06162d]"
              >
                {t("nav.quote")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hamm show pre-order banner */}
      <section className="bg-[#c9a227] text-[#06162d]">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em]">{t("hamm.badge")}</div>
            <h2 className="mt-2 font-serif-display text-2xl font-bold md:text-3xl">{t("hamm.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#06162d]/80">{t("hamm.text")}</p>
            <div className="mt-3 inline-block border border-[#06162d] px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {t("hamm.deadline")}
            </div>
          </div>
          <Link
            to="/inquiry"
            className="shrink-0 bg-[#06162d] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#c9a227] hover:bg-[#0c2447]"
          >
            {t("hamm.cta")}
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-neutral-200 text-center md:grid-cols-4">
          {(
            [
              ["trust.1", "trust.1s"],
              ["trust.2", "trust.2s"],
              ["trust.3", "trust.3s"],
              ["trust.4", "trust.4s"],
            ] as const
          ).map(([a, b]) => (
            <div key={a} className="px-4 py-6">
              <div className="font-serif-display text-sm font-bold uppercase tracking-wider">{t(a)}</div>
              <div className="mt-1 text-xs text-neutral-500">{t(b)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Category index */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-serif-display text-2xl font-bold">{t("home.index")}</h2>
          <Link to="/species" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#06162d]">
            {t("home.viewAll")}
          </Link>
        </div>
        <div className="grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-3">
          {(cats.data ?? []).map((c) => (
            <Link
              key={c.slug}
              to={`/species?category=${c.slug}`}
              className="group bg-white p-6 hover:bg-[#f8f6ee]"
            >
              <div className="flex items-baseline justify-between">
                <div className="font-serif-display text-lg font-bold group-hover:text-[#c9a227]">
                  {lang === "en" ? c.labelEn : c.labelCn}
                </div>
                <div className="text-xs text-neutral-400">{lang === "en" ? c.labelCn : c.labelEn}</div>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {lang === "en" ? c.blurbEn : c.blurbCn}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured specimens */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif-display text-2xl font-bold">{t("home.featured")}</h2>
        </div>
        {featured.data ? (
          <SpeciesTable rows={featured.data} />
        ) : (
          <div className="border border-neutral-200 p-10 text-center text-sm text-neutral-400">
            {t("home.loading")}
          </div>
        )}
      </section>
    </div>
  );
}
