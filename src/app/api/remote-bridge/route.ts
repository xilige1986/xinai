export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";

const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient };
const prisma = prismaGlobal.prisma ?? new PrismaClient();
if (!prismaGlobal.prisma) prismaGlobal.prisma = prisma;

type ApiOk<T = any> = { success: true; message?: string; data?: T };
type ApiFail = { success: false; message: string };

const CATEGORIES = [
  { catid: 1, catname: "AI生产力", parentid: 0 },
  { catid: 2, catname: "AI视频", parentid: 0 },
  { catid: 3, catname: "AI文本", parentid: 0 },
  { catid: 4, catname: "AI商业", parentid: 0 },
  { catid: 5, catname: "AI图像", parentid: 0 },
  { catid: 6, catname: "AI自动化", parentid: 0 },
  { catid: 7, catname: "AI艺术", parentid: 0 },
  { catid: 8, catname: "AI音频", parentid: 0 },
  { catid: 9, catname: "AI编程", parentid: 0 },
  { catid: 10, catname: "AI大模型", parentid: 0 },
];

function slugifyDomain(domain: string) {
  const d = (domain || "").trim().toLowerCase().replace(/^www\./i, "");
  const base = d.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base;
}

function buildSlugFromDomain(domain: string, title: string) {
  const base = slugifyDomain(domain);
  const suffix = createHash("sha1").update(title || "").digest("hex").slice(0, 6);
  const b = base ? base : `tool`;
  // slug 不包含中文（base 只有 a-z0-9 和 -, suffix 只有 hex）
  return `${b}-${suffix}`.slice(0, 100);
}

function mapStatus(inStatus: any): number {
  const n = Number(inStatus ?? 0);
  if (n === 3) return 1; // 发布
  if (n === 1) return 2; // 拒绝
  return 0; // 待审
}

async function parseUrlEncodedBody(req: Request) {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const obj: Record<string, string> = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function guessExt(contentType: string | null): string {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("gif")) return ".gif";
  if (ct.includes("svg")) return ".svg";
  return ".png";
}

async function downloadImageToLocal(
  remoteUrl: string,
  refererUrl: string | null,
  originUrl: string | null
): Promise<{ localUrl: string | null; error?: string; savedFilePath?: string }> {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000);

    const res = await fetch(remoteUrl, {
      method: "GET",
      signal: ac.signal,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "image/*,*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        Referer: refererUrl ?? (process.env.REMOTE_BRIDGE_REFERER || "https://www.okrvv.cn/"),
        Origin: originUrl ?? (process.env.REMOTE_BRIDGE_ORIGIN || "https://www.okrvv.cn"),
      },
    });

    clearTimeout(t);

    if (!res.ok) {
      return { localUrl: null, error: `image fetch failed: HTTP ${res.status}` };
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type");
    const ext = guessExt(contentType);

    const filename = `${randomUUID()}${ext}`;

    // standalone 部署时 process.cwd() 可能指向 .next/standalone，
    // 里面也可能有 package.json，导致找错根目录。
    // 这里优先判断是否存在 src/app 或 next.config.* 来定位真实项目根。
    const findProjectRoot = (startDir: string) => {
      let dir = startDir;
      for (let i = 0; i < 10; i++) {
        const hasSrcApp = fsSync.existsSync(path.join(dir, "src", "app"));
        const hasNextConfig =
          fsSync.existsSync(path.join(dir, "next.config.js")) ||
          fsSync.existsSync(path.join(dir, "next.config.mjs")) ||
          fsSync.existsSync(path.join(dir, "next.config.ts"));

        if (hasSrcApp || hasNextConfig) return dir;

        // 如果误命中 .next/standalone，则向上回退两级
        const standaloneNeedle = path.join(".next", "standalone");
        if (dir.includes(standaloneNeedle)) {
          const up2 = path.resolve(dir, "..", "..");
          return up2;
        }

        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
      return startDir;
    };

    const projectRoot = findProjectRoot(process.cwd());
    const dir = path.join(projectRoot, "public", "uploads", "general");
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    return { localUrl: `/uploads/general/${filename}`, savedFilePath: filePath };
  } catch (e: any) {
    return { localUrl: null, error: e?.message ? String(e.message) : "unknown error" };
  }
}

export async function POST(req: Request) {
  try {
    const form = await parseUrlEncodedBody(req);
    const action = (form.action || "").trim();
    const token = (form.token || "").trim();

    const expected = process.env.REMOTE_BRIDGE_TOKEN || "";
    if (!expected || token !== expected) {
      return NextResponse.json<ApiFail>(
        { success: false, message: "Authentication failed" },
        { status: 401 }
      );
    }

    if (action === "ping") {
      return NextResponse.json<ApiOk>({ success: true, data: { server_time: new Date().toISOString() } });
    }

    if (action === "get_categories") {
      return NextResponse.json<ApiOk>({
        success: true,
        data: { categories: CATEGORIES },
      });
    }

    if (action === "import_brand") {
      const itemStr = form.item || "";
      if (!itemStr) {
        return NextResponse.json<ApiFail>({ success: false, message: "Missing item" }, { status: 400 });
      }

      let item: any;
      try {
        item = JSON.parse(itemStr);
      } catch {
        return NextResponse.json<ApiFail>({ success: false, message: "Invalid item JSON" }, { status: 400 });
      }

      const title = String(item.title || "").trim();
      const catid = Number(item.catid ?? item.categoryId ?? 0);
      const useCaseId = Number(item.useCaseId ?? 0);
      const domain = String(item.domain ?? "").trim();

      if (title.length < 2) return NextResponse.json<ApiFail>({ success: false, message: "Invalid title" }, { status: 400 });
      if (!catid) return NextResponse.json<ApiFail>({ success: false, message: "Missing catid/categoryId" }, { status: 400 });
      if (!useCaseId) return NextResponse.json<ApiFail>({ success: false, message: "Missing useCaseId" }, { status: 400 });

      const slug = buildSlugFromDomain(domain, title);

      const existed = await prisma.tool.findUnique({ where: { slug } });
      if (existed) {
        return NextResponse.json<ApiOk>({ success: true, message: "skipped", data: {} });
      }

      // 你要求的映射：
      // Tool.shortDesc ← item.content
      // Tool.description ← item.content
      const contentRaw = String(item.content ?? "").trim();
      const shortDesc = contentRaw.slice(0, 200);
      const description = contentRaw;

      const websiteUrl = String(item.homepage ?? "").trim().slice(0, 500);

      const remoteThumb = item.thumb ? String(item.thumb).trim() : "";
      let imageDownloaded = false;
      let imageDownloadError: string | undefined = undefined;
      let imageUrlToSave: string | null = null;
      let imageSavedPath: string | null = null;

      if (remoteThumb) {
        const remoteThumbOrigin = (() => {
          try {
            const u = new URL(remoteThumb);
            return `${u.protocol}//${u.host}`;
          } catch {
            return null;
          }
        })();

        const remoteDomainHost = domain ? domain.replace(/^www\./i, "") : "";

        const candidates: Array<{ referer: string | null; origin: string | null }> = [];
        if (remoteThumbOrigin) {
          candidates.push({ referer: remoteThumbOrigin + "/", origin: remoteThumbOrigin });
        }
        if (remoteDomainHost) {
          candidates.push({ referer: `https://${remoteDomainHost}/`, origin: `https://${remoteDomainHost}` });
          candidates.push({ referer: `https://www.${remoteDomainHost}/`, origin: `https://www.${remoteDomainHost}` });
        }
        candidates.push({
          referer: process.env.REMOTE_BRIDGE_REFERER || "https://www.okrvv.cn/",
          origin: process.env.REMOTE_BRIDGE_ORIGIN || "https://www.okrvv.cn",
        });

        let lastError: string | undefined = undefined;
        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i];
          const dl = await downloadImageToLocal(remoteThumb, c.referer, c.origin);
          if (dl.localUrl) {
            imageUrlToSave = dl.localUrl;
            imageDownloaded = true;
            imageDownloadError = undefined;
            imageSavedPath = dl.savedFilePath ?? null;
            break;
          }
          lastError = dl.error;
        }
        imageDownloadError = lastError;
      } else {
        imageDownloadError = "missing thumb in item";
      }

      const created = await prisma.tool.create({
        data: {
          name: title,
          slug,
          shortDesc: shortDesc || " ",
          description: description || " ",

          websiteUrl,
          imageUrl: imageUrlToSave,

          pricingType: "Free",
          status: mapStatus(item.status),

          categoryId: catid,
          useCaseId: useCaseId,

          subCategoryId: null,
          sortOrder: 0,
        },
        select: { id: true },
      });

      return NextResponse.json<ApiOk>({
        success: true,
        message: "imported",
        data: {
          itemid: created.id,
          imageDownloaded,
          imageDownloadError: imageDownloadError ?? null,
          imageUrl: imageUrlToSave,
          imageSavedPath,
        },
      });
    }

    return NextResponse.json<ApiFail>({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json<ApiFail>(
      { success: false, message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}