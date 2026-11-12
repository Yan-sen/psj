import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");
  const prerenderPath = path.join(distPath, "__prerender");

  const snapName = (p: string) =>
    (p === "/" ? "index" : p.replace(/^\//, "").replace(/\//g, "_")) + ".html";

  // 首页特判：dist 里有真实 index.html，会被 serveStatic 直接命中而跳过快照
  app.get("/", (c) => {
    try {
      const snap = path.join(prerenderPath, "index.html");
      if (fs.existsSync(snap)) return c.html(fs.readFileSync(snap, "utf-8"));
    } catch {}
    const indexPath = path.resolve(distPath, "index.html");
    return c.html(fs.readFileSync(indexPath, "utf-8"));
  });

  app.use("*", serveStatic({ root: "./dist/public" }));

  app.notFound((c) => {
    // SPA 回退：非 API 的 GET 请求优先返回预渲染快照（SEO），否则返回 index.html
    if (c.req.method === "GET" && !c.req.path.startsWith("/api/")) {
      const snap = path.join(prerenderPath, snapName(c.req.path));
      try {
        if (fs.existsSync(snap)) return c.html(fs.readFileSync(snap, "utf-8"));
      } catch {}
      const indexPath = path.resolve(distPath, "index.html");
      const content = fs.readFileSync(indexPath, "utf-8");
      // 物种详情页没有预渲染快照 = 该物种不存在，返回真实 404（避免谷歌判软404）
      if (/^\/species\/\d+\/?$/.test(c.req.path)) {
        return c.html(content, 404);
      }
      return c.html(content);
    }
    return c.json({ error: "Not Found" }, 404);
  });
}
