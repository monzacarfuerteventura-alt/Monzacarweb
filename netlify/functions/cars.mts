import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const store = getStore("monzacar-cars");
  const cars = (await store.get("all", { type: "json" })) || [];

  const published = cars
    .filter((c: any) => c.publicado)
    .sort((a: any, b: any) => {
      if (!!b.destacado !== !!a.destacado) return b.destacado ? 1 : -1;
      return (a.orden ?? 0) - (b.orden ?? 0);
    });

  return new Response(JSON.stringify(published), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=30",
    },
  });
};

export const config: Config = {
  path: "/api/cars",
};
