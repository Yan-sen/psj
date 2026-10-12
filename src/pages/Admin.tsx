import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { FOOTER_KEYS } from "@/components/Layout";
import { BRAND } from "@/config";
import SpeciesTab from "@/components/admin/SpeciesTab";

const STATUSES = ["new", "quoted", "confirmed", "paid", "shipped", "delivered", "closed"] as const;
const STATUS_CN: Record<string, string> = {
  new: "新询盘",
  quoted: "已报价",
  confirmed: "已确认",
  paid: "已付款",
  shipped: "已发货",
  delivered: "已送达",
  closed: "已关闭",
};

function useAdminPassword() {
  const [pw, setPw] = useState(() => sessionStorage.getItem("psj-admin") ?? "");
  const save = (v: string) => {
    sessionStorage.setItem("psj-admin", v);
    setPw(v);
  };
  return { pw, save };
}

const inp =
  "border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-[#c9a227]";

// ---------- 询盘 ----------
type InquiryRow = {
  id: number;
  name: string;
  email: string;
  country: string;
  buyerType: string | null;
  quantity: string | null;
  speciesLabel: string | null;
  permitInfo: string | null;
  message: string | null;
  status: string;
  createdAt: string | Date;
  items: { id: number; speciesId: number | null; label: string; quantity: string | null }[];
};

function exportCsv(rows: InquiryRow[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["编号", "姓名", "邮箱", "国家/地区", "买家类型", "物种明细", "许可信息", "留言", "状态", "提交时间"];
  const lines = rows.map((q) => [
    q.id,
    q.name,
    q.email,
    q.country,
    q.buyerType,
    q.items.length ? q.items.map((i) => `${i.label}${i.quantity ? ` × ${i.quantity}` : ""}`).join("；") : q.speciesLabel,
    q.permitInfo,
    q.message,
    STATUS_CN[q.status] ?? q.status,
    new Date(q.createdAt).toLocaleString(),
  ].map(esc).join(","));
  const csv = "﻿" + [head.map(esc).join(","), ...lines].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `询盘-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function InquiriesTab({ pw }: { pw: string }) {
  const utils = trpc.useUtils();
  const inquiries = trpc.inquiries.list.useQuery({ password: pw });
  const setStatus = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => utils.inquiries.list.invalidate(),
  });
  const rows = (inquiries.data ?? []) as InquiryRow[];
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500">共 {rows.length} 条询盘</div>
        <button
          onClick={() => exportCsv(rows)}
          disabled={!rows.length}
          className="border border-[#06162d] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#06162d] hover:text-white disabled:opacity-40"
        >
          导出 Excel（CSV）
        </button>
      </div>
      {rows.length === 0 && (
        <div className="border border-neutral-200 p-10 text-center text-sm text-neutral-400">
          暂无询盘
        </div>
      )}
      {rows.map((q) => (
        <div key={q.id} className="border border-neutral-200 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold">#{q.id} {q.name}</span>
              <span className="ml-2 text-neutral-500">{q.email} · {q.country} · {q.buyerType}</span>
            </div>
            <select
              value={q.status}
              onChange={(e) => setStatus.mutate({ password: pw, id: q.id, status: e.target.value })}
              className="border border-neutral-300 px-2 py-1 text-xs"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CN[s]}</option>
              ))}
            </select>
          </div>
          {q.items.length > 0 ? (
            <div className="mt-2 border border-neutral-100">
              {q.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between border-b border-neutral-100 px-3 py-1.5 text-neutral-600 last:border-b-0">
                  <span className="latin-name">{it.label}</span>
                  {it.quantity && <span className="ml-2 text-neutral-500">数量: {it.quantity}</span>}
                </div>
              ))}
            </div>
          ) : (
            q.speciesLabel && <div className="mt-1 text-neutral-600">物种: {q.speciesLabel}</div>
          )}
          {q.quantity && !q.items.length && <div className="text-neutral-600">数量: {q.quantity}</div>}
          {q.permitInfo && <div className="mt-1 text-neutral-600">许可: {q.permitInfo}</div>}
          {q.message && <div className="mt-1 whitespace-pre-wrap text-neutral-500">{q.message}</div>}
          <div className="mt-1 text-xs text-neutral-400">{new Date(q.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

// ---------- 分类 ----------
function CategoriesTab({ pw }: { pw: string }) {
  const utils = trpc.useUtils();
  const cats = trpc.categories.list.useQuery();
  const upsert = trpc.categories.upsert.useMutation({
    onSuccess: () => utils.categories.list.invalidate(),
  });
  const remove = trpc.categories.remove.useMutation({
    onSuccess: () => utils.categories.list.invalidate(),
  });
  const blank = { slug: "", labelEn: "", labelCn: "", blurbEn: "", blurbCn: "", sortOrder: 99 };
  const [form, setForm] = useState({ ...blank });

  return (
    <div className="mt-6 max-w-3xl">
      <p className="mb-4 text-sm text-neutral-500">
        自定义前台物种分类。slug 用英文小写短横线（如 geckos），删除分类时其中物种会自动归入第一个剩余分类。
      </p>
      <div className="space-y-3">
        {(cats.data ?? []).map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2 border border-neutral-200 p-3 text-sm">
            <code className="bg-neutral-100 px-2 py-1 text-xs">{c.slug}</code>
            <input defaultValue={c.labelEn} className={`${inp} w-36`} placeholder="英文分类名"
              onBlur={(e) => e.target.value !== c.labelEn && upsert.mutate({ password: pw, id: c.id, slug: c.slug, labelEn: e.target.value, labelCn: c.labelCn })} />
            <input defaultValue={c.labelCn} className={`${inp} w-28`} placeholder="中文分类名"
              onBlur={(e) => e.target.value !== c.labelCn && upsert.mutate({ password: pw, id: c.id, slug: c.slug, labelEn: c.labelEn, labelCn: e.target.value })} />
            <input defaultValue={c.blurbEn ?? ""} className={`${inp} flex-1`} placeholder="英文简介"
              onBlur={(e) => e.target.value !== (c.blurbEn ?? "") && upsert.mutate({ password: pw, id: c.id, slug: c.slug, labelEn: c.labelEn, labelCn: c.labelCn, blurbEn: e.target.value, blurbCn: c.blurbCn ?? "" })} />
            <input defaultValue={c.blurbCn ?? ""} className={`${inp} flex-1`} placeholder="中文简介"
              onBlur={(e) => e.target.value !== (c.blurbCn ?? "") && upsert.mutate({ password: pw, id: c.id, slug: c.slug, labelEn: c.labelEn, labelCn: c.labelCn, blurbEn: c.blurbEn ?? "", blurbCn: e.target.value })} />
            <input type="number" defaultValue={c.sortOrder} className={`${inp} w-16`} title="排序"
              onBlur={(e) => Number(e.target.value) !== c.sortOrder && upsert.mutate({ password: pw, id: c.id, slug: c.slug, labelEn: c.labelEn, labelCn: c.labelCn, sortOrder: Number(e.target.value) })} />
            <button
              onClick={() => confirm(`删除分类 ${c.labelCn}？其中物种将归入其他分类。`) && remove.mutate({ password: pw, id: c.id })}
              className="text-xs text-red-600 underline"
            >
              删除
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 border border-dashed border-neutral-300 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">新增分类</div>
        <div className="flex flex-wrap gap-2">
          <input className={`${inp} w-32`} placeholder="slug *" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className={`${inp} w-36`} placeholder="英文分类名 *" value={form.labelEn} onChange={(e) => setForm({ ...form, labelEn: e.target.value })} />
          <input className={`${inp} w-28`} placeholder="中文分类名 *" value={form.labelCn} onChange={(e) => setForm({ ...form, labelCn: e.target.value })} />
          <input type="number" className={`${inp} w-16`} placeholder="排序" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          <button
            onClick={() => {
              if (!form.slug || !form.labelEn || !form.labelCn) return alert("slug、英文名、中文名必填");
              upsert.mutate({ password: pw, ...form });
              setForm({ ...blank });
            }}
            className="bg-[#06162d] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- 页脚设置 ----------
const SETTING_LABELS: Record<(typeof FOOTER_KEYS)[number], { label: string; fallback: string }> = {
  footer_phone: { label: "电话 / WhatsApp", fallback: BRAND.phone },
  footer_email: { label: "邮箱 Email", fallback: BRAND.email },
  footer_address: { label: "地址 Address", fallback: BRAND.address },
  footer_a1: { label: "服务保障 第 1 行", fallback: "100% legal export with CITES permits" },
  footer_a2: { label: "服务保障 第 2 行", fallback: "Live Arrival Guarantee" },
  footer_a3: { label: "服务保障 第 3 行", fallback: "Expert packing & air transport" },
  footer_a4: { label: "服务保障 第 4 行", fallback: "Exported to 20+ countries and regions" },
  social_facebook: { label: "Facebook 主页链接", fallback: "https://facebook.com/你的主页" },
  social_instagram: { label: "Instagram 主页链接", fallback: "https://instagram.com/你的账号" },
};

function SettingsTab({ pw }: { pw: string }) {
  const utils = trpc.useUtils();
  const all = trpc.settings.adminAll.useQuery({ password: pw });
  const setSetting = trpc.settings.set.useMutation({
    onSuccess: () => {
      utils.settings.all.invalidate();
      utils.settings.adminAll.invalidate();
    },
  });
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    if (all.data) setVals(all.data);
  }, [all.data]);

  return (
    <div className="mt-6 max-w-2xl space-y-5">
      <p className="text-sm text-neutral-500">
        修改网站页脚的联系方式与服务保障文案，保存后前台立即生效。留空则显示默认内容。
      </p>
      {FOOTER_KEYS.map((key) => (
        <div key={key}>
          <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
            {SETTING_LABELS[key].label}
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              value={vals[key] ?? ""}
              placeholder={SETTING_LABELS[key].fallback}
              onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
            />
            <button
              onClick={() => setSetting.mutate({ password: pw, key, value: vals[key] ?? "" })}
              disabled={setSetting.isPending}
              className="border border-[#06162d] px-4 text-xs font-semibold uppercase tracking-wider hover:bg-[#06162d] hover:text-white disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </div>
      ))}

      <div className="border-t border-neutral-200 pt-5">
        <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
          统计代码（百度统计 / Google Analytics，粘贴完整 script 代码）
        </label>
        <textarea
          className="h-28 w-full border border-neutral-300 px-3 py-2 font-mono text-xs outline-none focus:border-[#c9a227]"
          value={vals["head_code"] ?? ""}
          placeholder="<!-- 在此粘贴统计平台给的代码 -->"
          onChange={(e) => setVals((v) => ({ ...v, head_code: e.target.value }))}
        />
        <button
          onClick={() => setSetting.mutate({ password: pw, key: "head_code", value: vals["head_code"] ?? "" })}
          disabled={setSetting.isPending}
          className="mt-2 border border-[#06162d] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#06162d] hover:text-white disabled:opacity-50"
        >
          保存统计代码
        </button>
        <p className="mt-1 text-xs text-neutral-400">保存后全站页面自动加载该代码，1 分钟内生效。</p>
      </div>

      <NotifySettings pw={pw} vals={vals} setVals={setVals} setSetting={setSetting} />
    </div>
  );
}

// ---------- 询盘邮件通知 ----------
const NOTIFY_FIELDS: { key: string; label: string; ph: string; pwd?: boolean }[] = [
  { key: "smtp_host", label: "SMTP 服务器", ph: "QQ 邮箱：smtp.qq.com ・ 163：smtp.163.com" },
  { key: "smtp_port", label: "SMTP 端口", ph: "465（推荐）或 587" },
  { key: "smtp_user", label: "发信邮箱账号", ph: "yourname@qq.com" },
  { key: "smtp_pass", label: "SMTP 授权码（不是登录密码）", ph: "邮箱设置里生成的授权码", pwd: true },
  { key: "notify_email", label: "接收通知的邮箱", ph: "询盘通知发到这个邮箱" },
];

function NotifySettings({
  pw,
  vals,
  setVals,
  setSetting,
}: {
  pw: string;
  vals: Record<string, string>;
  setVals: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSetting: ReturnType<typeof trpc.settings.set.useMutation>;
}) {
  const testMail = trpc.settings.sendTestMail.useMutation();
  const [msg, setMsg] = useState("");

  const saveAll = () =>
    Promise.all(
      NOTIFY_FIELDS.map((f) =>
        setSetting.mutateAsync({ password: pw, key: f.key, value: vals[f.key] ?? "" })
      )
    ).then(() => setMsg("✅ 已保存"));

  return (
    <div className="border-t border-neutral-200 pt-5">
      <div className="mb-1 text-sm font-semibold">询盘邮件通知</div>
      <p className="mb-4 text-xs text-neutral-500">
        填好 SMTP 配置后，每个新询盘会实时发邮件到接收邮箱。授权码在邮箱网页版「设置 → 账户 → POP3/SMTP」里开启生成。
      </p>
      <div className="space-y-3">
        {NOTIFY_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">{f.label}</label>
            <input
              type={f.pwd ? "password" : "text"}
              className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              value={vals[f.key] ?? ""}
              placeholder={f.ph}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={saveAll}
          disabled={setSetting.isPending}
          className="bg-[#06162d] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#0d2342] disabled:opacity-50"
        >
          保存通知配置
        </button>
        <button
          onClick={() =>
            saveAll().then(() =>
              testMail.mutateAsync({ password: pw }).then(
                () => setMsg("✅ 测试邮件已发送，请查收（留意垃圾邮件）"),
                (e) => setMsg(`❌ 发送失败：${e.message}`)
              )
            )
          }
          disabled={testMail.isPending || setSetting.isPending}
          className="border border-[#06162d] px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#06162d] hover:text-white disabled:opacity-50"
        >
          {testMail.isPending ? "发送中…" : "保存并发送测试邮件"}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-neutral-600">{msg}</p>}
    </div>
  );
}

// ---------- 主页面 ----------
export default function Admin() {
  const { pw, save } = useAdminPassword();
  const [input, setInput] = useState("");
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<"inquiries" | "species" | "categories" | "settings">("inquiries");
  const verify = trpc.settings.set.useMutation();

  if (!pw) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24">
        <h1 className="font-serif-display text-2xl font-bold">管理后台登录</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            verify.mutate(
              { password: input, key: "__probe__", value: "1" },
              {
                onSuccess: () => save(input),
                onError: () => setErr(true),
              }
            );
          }}
        >
          <input
            type="password"
            className={`${inp} w-full py-2.5`}
            placeholder="密码"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setErr(false);
            }}
          />
          {err && <p className="text-sm text-red-600">密码错误</p>}
          <button
            disabled={verify.isPending}
            className="w-full bg-[#06162d] py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#0d2342] disabled:opacity-50"
          >
            {verify.isPending ? "验证中…" : "登录"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif-display text-3xl font-bold">管理后台</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem("psj-admin");
            location.reload();
          }}
          className="text-xs text-neutral-400 underline"
        >
          退出登录
        </button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["inquiries", "species", "categories", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border px-4 py-2 text-xs uppercase tracking-wider ${
              tab === t ? "border-[#06162d] bg-[#06162d] text-white" : "border-neutral-300 text-neutral-500"
            }`}
          >
            {t === "inquiries" ? "询盘" : t === "species" ? "物种" : t === "categories" ? "分类" : "页脚设置"}
          </button>
        ))}
      </div>

      {tab === "inquiries" && <InquiriesTab pw={pw} />}
      {tab === "species" && <SpeciesTab pw={pw} />}
      {tab === "categories" && <CategoriesTab pw={pw} />}
      {tab === "settings" && <SettingsTab pw={pw} />}
    </div>
  );
}
