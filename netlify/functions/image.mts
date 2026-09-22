import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const key = decodeURIComponent(url.pathname.replace("/api/image/", ""));
  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  const store = getStore("monzacar-car-images");
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = (result.metadata?.contentType as string) || "image/jpeg";

  return new Response(result.data as ArrayBuffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config: Config = {
  path: "/api/image/*",
};
