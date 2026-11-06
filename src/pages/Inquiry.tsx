import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useT } from "@/i18n";
import { useBasket } from "@/providers/basket";

const inputCls =
  "w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#c9a227]";

export default function Inquiry() {
  const t = useT();
  const [params] = useSearchParams();
  const speciesId = params.get("species") ? Number(params.get("species")) : undefined;
  const item = trpc.species.byId.useQuery(
    { id: speciesId! },
    { enabled: speciesId !== undefined }
  );
  const basket = useBasket();
  const create = trpc.inquiries.create.useMutation();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "",
    buyerType: "wholesaler",
    permitInfo: "",
    message: "",
  });

  // 兼容旧入口 ?species=ID：自动把该物种放入询盘篮
  useEffect(() => {
    const d = item.data;
    if (d && !basket.has(d.id)) {
      basket.toggle({
        id: d.id,
        latinName: d.latinName,
        chineseName: d.chineseName,
        morph: d.morph,
        size: d.size,
        priceUsd: d.priceUsd,
        showPrice: d.showPrice,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.data]);

  const selected = basket.items;

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const items = selected.map((i) => ({
      speciesId: i.id,
      label: `${i.latinName} · ${i.morph ?? "—"} · ${i.size ?? "—"}`,
      quantity: i.quantity || undefined,
    }));
    create.mutate(
      {
        speciesId: selected[0]?.id,
        speciesLabel: items.map((i) => i.label).join("；") || undefined,
        quantity: undefined,
        ...form,
        items: items.length ? items : undefined,
      },
      {
        onSuccess: () => {
          basket.clear();
          setDone(true);
        },
      }
    );
  };

  if (done)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-serif-display text-3xl font-bold">{t("i.done")}</h1>
        <p className="mt-4 text-sm leading-7 text-neutral-500">{t("i.doneMsg")}</p>
        <Link to="/species" className="mt-8 inline-block border border-[#06162d] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-[#06162d] hover:text-white">
          {t("i.continue")}
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-serif-display text-3xl font-bold">{t("i.title")}</h1>

      {/* Hamm show pickup notice */}
      <div className="mt-4 border border-[#c9a227] bg-[#c9a227]/10 px-4 py-3 text-sm leading-6 text-[#06162d]">
        {t("hamm.inq")}
      </div>

      {/* 已选物种清单 */}
      {selected.length > 0 ? (
        <div className="mt-4 border border-neutral-200">
          <div className="border-b border-neutral-200 bg-[#f8f6ee] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
            {t("i.selected")} ({selected.length})
          </div>
          {selected.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 py-2.5 text-sm last:border-b-0">
              <div className="min-w-0 flex-1">
                <span className="latin-name font-bold">{i.latinName}</span>
                <span className="ml-2 text-neutral-500">
                  {i.chineseName ?? ""} · {i.morph ?? "—"} · {i.size ?? "—"}
                </span>
                {i.showPrice && i.priceUsd && (
                  <span className="ml-2 text-xs text-neutral-400">${i.priceUsd}</span>
                )}
              </div>
              <input
                value={i.quantity}
                onChange={(e) => basket.setQty(i.id, e.target.value)}
                placeholder={t("b.qtyPh")}
                className="w-28 border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-[#c9a227]"
              />
              <button type="button" onClick={() => basket.remove(i.id)} className="text-xs text-red-600 underline">
                {t("b.remove")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
          {t("i.orPick")}
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">{t("i.name")}</label>
          <input required className={inputCls} value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">{t("i.email")}</label>
          <input required type="email" className={inputCls} value={form.email} onChange={set("email")} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">{t("i.country")}</label>
            <input required className={inputCls} value={form.country} onChange={set("country")} placeholder={t("i.countryPh")} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">{t("i.buyerType")}</label>
            <select className={inputCls} value={form.buyerType} onChange={set("buyerType")}>
              <option value="wholesaler">{t("i.bt1")}</option>
              <option value="breeder">{t("i.bt2")}</option>
              <option value="institution">{t("i.bt3")}</option>
              <option value="individual">{t("i.bt4")}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
            {t("i.permit")} {t("i.ifApp")}
          </label>
          <textarea
            className={inputCls}
            rows={3}
            value={form.permitInfo}
            onChange={set("permitInfo")}
            placeholder={t("i.permitPh")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">{t("i.msg")}</label>
          <textarea className={inputCls} rows={4} value={form.message} onChange={set("message")} />
        </div>
        <button
          disabled={create.isPending}
          className="w-full bg-[#06162d] py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#0d2342] disabled:opacity-50"
        >
          {create.isPending ? t("i.sending") : t("i.submit")}
        </button>
        {create.isError && <p className="text-sm text-red-600">{t("i.fail")}</p>}
      </form>
    </div>
  );
}
