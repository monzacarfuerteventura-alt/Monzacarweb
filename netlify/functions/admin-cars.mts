import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../../shared/auth.mts";

function carsStore() {
  return getStore("monzacar-cars");
}

async function readAll(): Promise<any[]> {
  const store = carsStore();
  return (await store.get("all", { type: "json" })) || [];
}

async function writeAll(cars: any[]) {
  const store = carsStore();
  await store.setJSON("all", cars);
}

export default async (req: Request) => {
  if (!requireAuth(req)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const cars = await readAll();

  if (req.method === "GET") {
    const sorted = [...cars].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    return new Response(JSON.stringify(sorted), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const now = Date.now();
    const car = {
      id: randomUUID(),
      marca: String(body.marca || "").trim(),
      modelo: String(body.modelo || "").trim(),
      version: String(body.version || "").trim(),
      anio: String(body.anio || "").trim(),
      km: String(body.km || "").trim(),
      precio: String(body.precio || "").trim(),
      combustible: String(body.combustible || "").trim(),
      cambio: String(body.cambio || "").trim(),
      descripcion: String(body.descripcion || "").trim(),
      garantia: !!body.garantia,
      fotos: Array.isArray(body.fotos) ? body.fotos : [],
      publicado: !!body.publicado,
      destacado: !!body.destacado,
      orden: typeof body.orden === "number" ? body.orden : cars.length,
      createdAt: now,
      updatedAt: now,
    };
    cars.push(car);
    await writeAll(cars);
    return new Response(JSON.stringify(car), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "PUT") {
    const body = await req.json();
    const idx = cars.findIndex((c: any) => c.id === body.id);
    if (idx === -1) {
      return new Response(JSON.stringify({ error: "No encontrado" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    cars[idx] = { ...cars[idx], ...body, id: cars[idx].id, updatedAt: Date.now() };
    await writeAll(cars);
    return new Response(JSON.stringify(cars[idx]), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const idx = cars.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      return new Response(JSON.stringify({ error: "No encontrado" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    const [removed] = cars.splice(idx, 1);
    await writeAll(cars);

    try {
      const imgStore = getStore("monzacar-car-images");
      const { blobs } = await imgStore.list({ prefix: `${removed.id}/` });
      await Promise.all(blobs.map((b: any) => imgStore.delete(b.key)));
    } catch {
      // limpieza best-effort, no bloquea el borrado del coche
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/admin/cars",
};
