import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../../shared/auth.mts";

export default async (req: Request) => {
  if (!requireAuth(req)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (!key) {
      return new Response(JSON.stringify({ error: "Falta key" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const store = getStore("monzacar-car-images");
    await store.delete(key);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json();
  const { carId, filename, contentType, dataBase64 } = body || {};
  if (!carId || !dataBase64) {
    return new Response(JSON.stringify({ error: "Datos incompletos" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const safeName = String(filename || "foto.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${carId}/${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
  const buffer = Buffer.from(dataBase64, "base64");

  const store = getStore("monzacar-car-images");
  await store.set(key, buffer, {
    metadata: { contentType: contentType || "image/jpeg" },
  });

  return new Response(
    JSON.stringify({ url: `/api/image/${encodeURIComponent(key)}`, key }),
    { status: 201, headers: { "content-type": "application/json" } }
  );
};

export const config: Config = {
  path: "/api/admin/upload",
};
