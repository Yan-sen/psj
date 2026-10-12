import { useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import type { AppRouter } from "../../../api/router";
import type { inferRouterOutputs } from "@trpc/server";

type SpeciesRow = inferRouterOutputs<AppRouter>["species"]["adminList"][number];

const inp =
  "border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-[#c9a227]";

const emptyForm = {
  category: "chinese_snake",
  groupName: "",
  latinName: "",
  chineseName: "",
  morph: "",
  size: "",
  priceUsd: "",
  stock: 0,
  showPrice: true,
  venomous: false,
  citesAppendix: "",
  featured: false,
};

type FormState = typeof emptyForm;

function toData(f: FormState) {
  return {
    ...f,
    chineseName: f.chineseName || null,
    morph: f.morph || null,
    size: f.size || null,
    priceUsd: f.priceUsd || null,
    citesAppendix: f.citesAppendix || null,
  };
}

// 纯数字价格才能参与批量调价
const NUMERIC_PRICE = /^\d+(\.\d+)?$/;

export default function SpeciesTab({ pw }: { pw: string }) {
  const utils = trpc.useUtils();
  const list = trpc.species.adminList.useQuery({ password: pw });
  const cats = trpc.categories.list.useQuery();
  const invalidate = () => {
    utils.species.list.invalidate();
    utils.species.adminList.invalidate();
  };
  const update = trpc.species.update.useMutation();
  const create = trpc.species.create.useMutation({
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm({ ...emptyForm });
    },
  });
  const remove = trpc.species.remove.useMutation({ onSuccess: invalidate });
  const uploadImage = trpc.species.uploadImage.useMutation({ onSuccess: invalidate });

  // 新增表单
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  // 筛选 / 搜索 / 分页
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 行内编辑
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>({ ...emptyForm });

  // 批量选择
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkMsg, setBulkMsg] = useState("");

  const rows = useMemo(() => {
    let arr = (list.data ?? []) as SpeciesRow[];
    if (filterCat) arr = arr.filter((s) => s.category === filterCat);
    const q = search.trim().toLowerCase();
    if (q)
      arr = arr.filter((s) =>
        [s.latinName, s.chineseName ?? "", s.morph ?? "", s.groupName]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    return arr;
  }, [list.data, filterCat, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageRows = rows.slice((curPage - 1) * pageSize, curPage * pageSize);

  const setF = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({
      ...f,
      [k]:
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : k === "stock"
            ? Number(e.target.value)
            : e.target.value,
    }));

  const setE = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm((f) => ({
      ...f,
      [k]:
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : k === "stock"
            ? Number(e.target.value)
            : e.target.value,
    }));

  const startEdit = (s: SpeciesRow) => {
    setEditingId(s.id);
    setEditForm({
      category: s.category,
      groupName: s.groupName,
      latinName: s.latinName,
      chineseName: s.chineseName ?? "",
      morph: s.morph ?? "",
      size: s.size ?? "",
      priceUsd: s.priceUsd ?? "",
      stock: s.stock,
      showPrice: s.showPrice,
      venomous: s.venomous,
      citesAppendix: s.citesAppendix ?? "",
      featured: s.featured,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    update.mutate(
      { password: pw, id: editingId, data: toData(editForm) },
      {
        onSuccess: () => {
          invalidate();
          setEditingId(null);
        },
      }
    );
  };

  const saveNew = () => {
    if (!form.latinName || !form.groupName) {
      alert("拉丁学名和分组名必填");
      return;
    }
    create.mutate({ password: pw, data: toData(form) });
  };

  const onPickImage = (id: number, file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      alert("图片请小于 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(",")[1];
      uploadImage.mutate({ password: pw, id, filename: file.name, dataBase64: b64 });
    };
    reader.readAsDataURL(file);
  };

  // ---------- 批量操作 ----------
  const toggleOne = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOnPage = pageRows.length > 0 && pageRows.every((s) => selected.has(s.id));
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allOnPage) pageRows.forEach((r) => n.delete(r.id));
      else pageRows.forEach((r) => n.add(r.id));
      return n;
    });

  const selectedRows = rows.filter((r) => selected.has(r.id));

  async function bulkRun(fn: (s: SpeciesRow) => Promise<boolean>, doneText: string) {
    let ok = 0, skip = 0;
    for (const s of selectedRows) {
      try {
        (await fn(s)) ? ok++ : skip++;
      } catch {
        skip++;
      }
    }
    await invalidate();
    setBulkMsg(`✅ ${doneText}：成功 ${ok} 条${skip ? `，跳过 ${skip} 条` : ""}`);
    setSelected(new Set());
  }

  const bulk = {
    async priceAdjust() {
      const v = prompt("输入调价百分比（如 5 表示 +5%，-10 表示 -10%）。仅对纯数字价格生效：");
      if (v === null) return;
      const pct = Number(v);
      if (!isFinite(pct)) return alert("请输入数字");
      await bulkRun(async (s) => {
        if (!s.priceUsd || !NUMERIC_PRICE.test(s.priceUsd.trim())) return false;
        const next = Math.round(Number(s.priceUsd) * (1 + pct / 100) * 100) / 100;
        await update.mutateAsync({ password: pw, id: s.id, data: { priceUsd: String(next) } });
        return true;
      }, `批量调价 ${pct > 0 ? "+" : ""}${pct}%`);
    },
    async priceSet() {
      const v = prompt("输入要统一设置的价格（纯数字，美元）：");
      if (v === null) return;
      if (!NUMERIC_PRICE.test(v.trim())) return alert("请输入纯数字价格");
      await bulkRun(async (s) => {
        await update.mutateAsync({ password: pw, id: s.id, data: { priceUsd: v.trim() } });
        return true;
      }, "批量设置价格");
    },
    async setCategory() {
      const opts = (cats.data ?? []).map((c, i) => `${i + 1}. ${c.labelCn} ${c.labelEn}`).join("\n");
      const v = prompt(`输入目标分类序号：\n${opts}`);
      if (v === null) return;
      const c = (cats.data ?? [])[Number(v) - 1];
      if (!c) return alert("序号无效");
      await bulkRun(async (s) => {
        await update.mutateAsync({ password: pw, id: s.id, data: { category: c.slug } });
        return true;
      }, `批量改分类为「${c.labelCn}」`);
    },
    async flag(key: "showPrice" | "featured", val: boolean, label: string) {
      await bulkRun(async (s) => {
        await update.mutateAsync({ password: pw, id: s.id, data: { [key]: val } });
        return true;
      }, label);
    },
    async clearStock() {
      if (!confirm(`确定将已选 ${selectedRows.length} 条库存清零？`)) return;
      await bulkRun(async (s) => {
        await update.mutateAsync({ password: pw, id: s.id, data: { stock: 0 } });
        return true;
      }, "库存清零");
    },
    async remove() {
      if (!confirm(`确定删除已选 ${selectedRows.length} 条物种？此操作不可恢复！`)) return;
      await bulkRun(async (s) => {
        await remove.mutateAsync({ password: pw, id: s.id });
        return true;
      }, "批量删除");
    },
  };

  const editRow = (s: SpeciesRow) => (
    <tr key={s.id} className="border-t border-[#c9a227] bg-[#f8f6ee]">
      <td className="px-3 py-2" />
      <td className="px-3 py-2" colSpan={8}>
        <div className="grid gap-2 md:grid-cols-4">
          <label className="text-xs text-neutral-500">拉丁学名 *
            <input className={`${inp} mt-0.5 w-full`} value={editForm.latinName} onChange={setE("latinName")} /></label>
          <label className="text-xs text-neutral-500">中文名
            <input className={`${inp} mt-0.5 w-full`} value={editForm.chineseName} onChange={setE("chineseName")} /></label>
          <label className="text-xs text-neutral-500">分组名 *
            <input className={`${inp} mt-0.5 w-full`} value={editForm.groupName} onChange={setE("groupName")} /></label>
          <label className="text-xs text-neutral-500">品系
            <input className={`${inp} mt-0.5 w-full`} value={editForm.morph} onChange={setE("morph")} /></label>
          <label className="text-xs text-neutral-500">规格
            <input className={`${inp} mt-0.5 w-full`} value={editForm.size} onChange={setE("size")} /></label>
          <label className="text-xs text-neutral-500">价格（美元）
            <input className={`${inp} mt-0.5 w-full`} value={editForm.priceUsd} onChange={setE("priceUsd")} /></label>
          <label className="text-xs text-neutral-500">库存
            <input type="number" className={`${inp} mt-0.5 w-full`} value={editForm.stock} onChange={setE("stock")} /></label>
          <label className="text-xs text-neutral-500">CITES 附录
            <input className={`${inp} mt-0.5 w-full`} value={editForm.citesAppendix} onChange={setE("citesAppendix")} /></label>
          <label className="text-xs text-neutral-500">分类
            <select className={`${inp} mt-0.5 w-full`} value={editForm.category} onChange={setE("category")}>
              {(cats.data ?? []).map((c) => (
                <option key={c.slug} value={c.slug}>{c.labelCn} {c.labelEn}</option>
              ))}
            </select></label>
          <span className="flex items-center gap-4 pt-4 text-xs">
            <label className="flex items-center gap-1"><input type="checkbox" checked={editForm.showPrice} onChange={setE("showPrice")} className="accent-[#c9a227]" />公开价格</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={editForm.venomous} onChange={setE("venomous")} className="accent-[#c9a227]" />毒蛇</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={editForm.featured} onChange={setE("featured")} className="accent-[#c9a227]" />首页精选</label>
          </span>
          <span className="flex items-end gap-2 md:col-span-2">
            <button onClick={saveEdit} disabled={update.isPending}
              className="bg-[#06162d] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#0d2342] disabled:opacity-50">
              {update.isPending ? "保存中…" : "保存"}
            </button>
            <button onClick={() => setEditingId(null)} className="text-xs text-neutral-500 underline">取消</button>
          </span>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="mt-6">
      {/* 工具条 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => { setShowForm(!showForm); setForm({ ...emptyForm }); }}
          className="border border-[#06162d] px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#06162d] hover:text-white"
        >
          {showForm ? "收起" : "+ 新增物种"}
        </button>
        <select
          value={filterCat}
          onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
          className="border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
        >
          <option value="">全部分类</option>
          {(cats.data ?? []).map((c) => (
            <option key={c.slug} value={c.slug}>{c.labelCn} {c.labelEn}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="搜索学名 / 中文名 / 品系…"
          className={`${inp} w-56`}
        />
        <span className="text-xs text-neutral-400">共 {rows.length} 条</span>
      </div>

      {/* 新增表单 */}
      {showForm && (
        <div className="mb-6 grid gap-3 border border-neutral-200 bg-[#f8f6ee] p-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">分类 *</label>
            <select className={`${inp} w-full`} value={form.category} onChange={setF("category")}>
              {(cats.data ?? []).map((c) => (
                <option key={c.slug} value={c.slug}>{c.labelCn} {c.labelEn}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">分组名 *（同物种归组，如 Ptyas mucosus）</label>
            <input className={`${inp} w-full`} value={form.groupName} onChange={setF("groupName")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">拉丁学名 *</label>
            <input className={`${inp} w-full`} value={form.latinName} onChange={setF("latinName")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">中文名</label>
            <input className={`${inp} w-full`} value={form.chineseName} onChange={setF("chineseName")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">品系</label>
            <input className={`${inp} w-full`} value={form.morph} onChange={setF("morph")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">规格</label>
            <input className={`${inp} w-full`} value={form.size} onChange={setF("size")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">价格（美元，如 150 或 3000/对）</label>
            <input className={`${inp} w-full`} value={form.priceUsd} onChange={setF("priceUsd")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">库存</label>
            <input type="number" className={`${inp} w-full`} value={form.stock} onChange={setF("stock")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">CITES 附录（如 II，可空）</label>
            <input className={`${inp} w-full`} value={form.citesAppendix} onChange={setF("citesAppendix")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.showPrice} onChange={setF("showPrice")} className="h-4 w-4 accent-[#c9a227]" />
            公开显示价格
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.venomous} onChange={setF("venomous")} className="h-4 w-4 accent-[#c9a227]" />
            毒蛇
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={setF("featured")} className="h-4 w-4 accent-[#c9a227]" />
            首页精选
          </label>
          <div className="md:col-span-3">
            <button
              onClick={saveNew}
              disabled={create.isPending}
              className="bg-[#06162d] px-6 py-2 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#0d2342] disabled:opacity-50"
            >
              创建物种
            </button>
          </div>
        </div>
      )}

      {/* 批量操作条 */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 border border-[#c9a227] bg-[#f8f6ee] px-4 py-2.5 text-sm">
          <span className="font-semibold">已选 {selected.size} 条</span>
          <button onClick={bulk.priceAdjust} className="border border-neutral-300 px-3 py-1 text-xs hover:border-[#06162d]">按 % 调价</button>
          <button onClick={bulk.priceSet} className="border border-neutral-300 px-3 py-1 text-xs hover:border-[#06162d]">统一价格</button>
          <button onClick={bulk.setCategory} className="border border-neutral-300 px-3 py-1 text-xs hover:border-[#06162d]">改分类</button>
          <button onClick={() => bulk.flag("showPrice", true, "批量公开价格")} className="border border-neutral-300 px-3 py-1 text-xs hover:border-[#06162d]">公开价格</button>
          <button onClick={() => bulk.flag("showPrice", false, "批量隐藏价格")} className="border border-neutral-300 px-3 py-1 text-xs hover:border-[#06162d]">隐藏价格</button>
          <button onClick={() => bulk.flag("featured", true, "批量设为精选")} className="border border-neutral-300 px-3 py-1 text-xs hover:border-[#06162d]">设为精选</button>
          <button onClick={() => bulk.flag("featured", false, "批量取消精选")} className="border border-neutral-300 px-3 py-1 text-xs hover:border-[#06162d]">取消精选</button>
          <button onClick={bulk.clearStock} className="border border-neutral-300 px-3 py-1 text-xs hover:border-[#06162d]">库存清零</button>
          <button onClick={bulk.remove} className="border border-red-300 px-3 py-1 text-xs text-red-600 hover:border-red-600">批量删除</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-neutral-400 underline">取消选择</button>
        </div>
      )}
      {bulkMsg && <div className="mb-3 text-sm text-neutral-600">{bulkMsg}</div>}

      {/* 列表 */}
      <div className="overflow-x-auto border border-neutral-200">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#06162d] text-left text-[11px] uppercase tracking-wider text-white">
              <th className="px-3 py-2">
                <input type="checkbox" checked={allOnPage} onChange={toggleAll} className="h-4 w-4 accent-[#c9a227]" title="全选本页" />
              </th>
              <th className="px-3 py-2">图片</th>
              <th className="px-3 py-2">物种</th>
              <th className="px-3 py-2">分类</th>
              <th className="px-3 py-2">品系</th>
              <th className="px-3 py-2">价格（美元）</th>
              <th className="px-3 py-2">库存</th>
              <th className="px-3 py-2">精选</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) =>
              editingId === s.id ? (
                editRow(s)
              ) : (
                <tr key={s.id} className={`border-t border-neutral-200 ${selected.has(s.id) ? "bg-[#f8f6ee]" : ""}`}>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} className="h-4 w-4 accent-[#c9a227]" />
                  </td>
                  <td className="px-3 py-2">
                    <label className={`block h-12 w-12 cursor-pointer overflow-hidden border border-dashed text-center text-[10px] leading-[3rem] hover:border-[#c9a227] ${s.imageUrl ? "border-neutral-300" : "border-red-400 text-red-400"}`}>
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        "+ 图"
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onPickImage(s.id, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <span className="latin-name">{s.latinName}</span>
                    <span className="ml-1 text-xs text-neutral-400">{s.chineseName}</span>
                    {s.venomous && <span className="ml-1 border border-[#06162d] px-1 text-[10px]">毒</span>}
                    {s.citesAppendix && <span className="ml-1 bg-[#06162d] px-1 text-[10px] text-[#c9a227]">C{s.citesAppendix}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={s.category}
                      onChange={(e) => update.mutate({ password: pw, id: s.id, data: { category: e.target.value } }, { onSuccess: invalidate })}
                      className="border border-neutral-200 px-1 py-1 text-xs"
                    >
                      {(cats.data ?? []).map((c) => (
                        <option key={c.slug} value={c.slug}>{c.labelCn}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{s.morph ?? "—"}</td>
                  <td className="px-3 py-2">
                    <input
                      defaultValue={s.priceUsd ?? ""}
                      key={`p${s.id}-${s.priceUsd}`}
                      onBlur={(e) => {
                        if (e.target.value !== (s.priceUsd ?? ""))
                          update.mutate({ password: pw, id: s.id, data: { priceUsd: e.target.value || null } }, { onSuccess: invalidate });
                      }}
                      className={`${inp} w-24`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      defaultValue={s.stock}
                      key={`s${s.id}-${s.stock}`}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== s.stock) update.mutate({ password: pw, id: s.id, data: { stock: v } }, { onSuccess: invalidate });
                      }}
                      className={`${inp} w-16 ${s.stock === 0 ? "text-neutral-300" : ""}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={s.featured}
                      onChange={(e) => update.mutate({ password: pw, id: s.id, data: { featured: e.target.checked } }, { onSuccess: invalidate })}
                      className="h-4 w-4 accent-[#c9a227]"
                      title="首页精选"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => startEdit(s)} className="text-xs font-semibold text-[#06162d] underline">
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`确定删除 ${s.latinName} ${s.morph ?? ""}？`))
                          remove.mutate({ password: pw, id: s.id });
                      }}
                      className="ml-2 text-xs text-red-600 underline"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* 分页条 */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        <button
          onClick={() => setPage(curPage - 1)}
          disabled={curPage <= 1}
          className="border border-neutral-300 px-3 py-1 disabled:opacity-40"
        >
          上一页
        </button>
        <span>第 {curPage} / {totalPages} 页</span>
        <button
          onClick={() => setPage(curPage + 1)}
          disabled={curPage >= totalPages}
          className="border border-neutral-300 px-3 py-1 disabled:opacity-40"
        >
          下一页
        </button>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-neutral-300 px-2 py-1"
        >
          {[20, 50, 100].map((n) => (
            <option key={n} value={n}>每页 {n} 条</option>
          ))}
        </select>
      </div>
    </div>
  );
}
