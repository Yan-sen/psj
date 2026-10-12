import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import {
  deleteCategory,
  listCategories,
  seedCategoriesIfEmpty,
  upsertCategory,
} from "./queries/categories";
import { createSpecies, deleteSpecies } from "./queries/species";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

function assertAdmin(password?: string) {
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Wrong password" });
  }
}
import {
  categoryCounts,
  getSpeciesById,
  listSpecies,
  updateSpecies,
} from "./queries/species";

// 公开接口数据清洗：标"询价"（showPrice=false）的条目绝不返回真实价格
function sanitizePublic<T extends { showPrice: boolean; priceUsd: string | null }>(row: T): T {
  return row.showPrice ? row : { ...row, priceUsd: null };
}

const speciesInput = z.object({
  category: z.string(),
  groupName: z.string(),
  chineseName: z.string().nullable().optional(),
  latinName: z.string(),
  morph: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  priceUsd: z.string().nullable().optional(),
  showPrice: z.boolean().optional(),
  venomous: z.boolean().optional(),
  citesAppendix: z.string().nullable().optional(),
  stock: z.number().optional(),
  featured: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
});
import { createInquiry, listInquiries, updateInquiryStatus } from "./queries/inquiries";
import { getAllSettings, upsertSetting } from "./queries/settings";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  species: createRouter({
    list: publicQuery
      .input(
        z.object({
          category: z.string().optional(),
          search: z.string().optional(),
          featuredOnly: z.boolean().optional(),
        })
      )
      .query(async ({ input }) => (await listSpecies(input)).map(sanitizePublic)),
    byId: publicQuery
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const row = await getSpeciesById(input.id);
        return row ? sanitizePublic(row) : row;
      }),
    adminList: publicQuery
      .input(z.object({ password: z.string() }))
      .query(({ input }) => {
        assertAdmin(input.password);
        return listSpecies({});
      }),
    categoryCounts: publicQuery.query(() => categoryCounts()),
    update: publicQuery
      .input(z.object({ password: z.string(), id: z.number(), data: speciesInput.partial() }))
      .mutation(({ input }) => {
        assertAdmin(input.password);
        return updateSpecies(input.id, input.data);
      }),
    create: publicQuery
      .input(z.object({ password: z.string(), data: speciesInput }))
      .mutation(({ input }) => {
        assertAdmin(input.password);
        return createSpecies(input.data);
      }),
    remove: publicQuery
      .input(z.object({ password: z.string(), id: z.number() }))
      .mutation(({ input }) => {
        assertAdmin(input.password);
        return deleteSpecies(input.id);
      }),
    uploadImage: publicQuery
      .input(
        z.object({
          password: z.string(),
          id: z.number(),
          filename: z.string(),
          dataBase64: z.string(), // base64 payload without data: prefix
        })
      )
      .mutation(async ({ input }) => {
        assertAdmin(input.password);
        const fs = await import("node:fs");
        const path = await import("node:path");
        const ext = path.extname(input.filename).toLowerCase() || ".jpg";
        const safe = `species-${input.id}-${Date.now()}${ext}`;
        const buf = Buffer.from(input.dataBase64, "base64");
        for (const dir of ["public/uploads", "dist/public/uploads"]) {
          fs.mkdirSync(path.resolve(process.cwd(), dir), { recursive: true });
          fs.writeFileSync(path.resolve(process.cwd(), dir, safe), buf);
        }
        const url = `/uploads/${safe}`;
        const db = (await import("./queries/connection")).getDb();
        const { species } = await import("../db/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(species).set({ imageUrl: url }).where(eq(species.id, input.id));
        return { url };
      }),
  }),

  inquiries: createRouter({
    create: publicQuery
      .input(
        z.object({
          speciesId: z.number().optional(),
          speciesLabel: z.string().optional(),
          name: z.string().min(1),
          email: z.string().email(),
          country: z.string().min(1),
          buyerType: z.string().optional(),
          quantity: z.string().optional(),
          permitInfo: z.string().optional(),
          message: z.string().optional(),
          items: z
            .array(
              z.object({
                speciesId: z.number().optional(),
                label: z.string().min(1),
                quantity: z.string().optional(),
              })
            )
            .optional(),
        })
      )
      .mutation(({ input }) => {
        const { items, ...data } = input;
        return createInquiry(data, items ?? []).then(async (r) => {
          const { notifyNewInquiry } = await import("./queries/notify");
          void notifyNewInquiry({
            id: r.id,
            name: data.name,
            email: data.email,
            country: data.country,
            buyerType: data.buyerType,
            permitInfo: data.permitInfo,
            message: data.message,
            items: (items ?? []).map((i) => ({ label: i.label, quantity: i.quantity })),
          });
          const { sendBuyerAutoReply } = await import("./queries/notify");
          void sendBuyerAutoReply({
            name: data.name,
            email: data.email,
            items: (items ?? []).map((i) => ({ label: i.label, quantity: i.quantity })),
          });
          return r;
        });
      }),
    list: publicQuery
      .input(z.object({ password: z.string() }))
      .query(({ input }) => {
        assertAdmin(input.password);
        return listInquiries();
      }),
    updateStatus: publicQuery
      .input(z.object({ password: z.string(), id: z.number(), status: z.string() }))
      .mutation(({ input }) => {
        assertAdmin(input.password);
        return updateInquiryStatus(input.id, input.status);
      }),
  }),

  settings: createRouter({
    // 公开接口只放行页面展示需要的非敏感键；smtp_pass 等机密永不出接口
    all: publicQuery.query(async () => {
      const all = await getAllSettings();
      const pub: Record<string, string> = {};
      for (const [k, v] of Object.entries(all)) {
        if (k.startsWith("footer_") || k.startsWith("social_") || k === "head_code") pub[k] = v;
      }
      return pub;
    }),
    adminAll: publicQuery
      .input(z.object({ password: z.string() }))
      .query(({ input }) => {
        assertAdmin(input.password);
        return getAllSettings();
      }),
    set: publicQuery
      .input(z.object({ password: z.string(), key: z.string(), value: z.string() }))
      .mutation(({ input }) => {
        assertAdmin(input.password);
        return upsertSetting(input.key, input.value);
      }),
    sendTestMail: publicQuery
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        assertAdmin(input.password);
        const s = await getAllSettings();
        if (!s.notify_email) throw new TRPCError({ code: "BAD_REQUEST", message: "请先填写接收通知的邮箱" });
        const { sendTestMail } = await import("./queries/notify");
        await sendTestMail(s.notify_email);
        return { ok: true };
      }),
  }),

  categories: createRouter({
    list: publicQuery.query(async () => {
      await seedCategoriesIfEmpty();
      return listCategories();
    }),
    upsert: publicQuery
      .input(
        z.object({
          password: z.string(),
          id: z.number().optional(),
          slug: z.string().min(1),
          labelEn: z.string().min(1),
          labelCn: z.string().min(1),
          blurbEn: z.string().optional(),
          blurbCn: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        assertAdmin(input.password);
        const { password: _pw, ...data } = input;
        return upsertCategory(data);
      }),
    remove: publicQuery
      .input(z.object({ password: z.string(), id: z.number() }))
      .mutation(({ input }) => {
        assertAdmin(input.password);
        return deleteCategory(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
