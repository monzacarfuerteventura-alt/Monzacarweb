import type { Config } from "@netlify/functions";
import { createToken, safeEqual } from "../../shared/auth.mts";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalido" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const { username, password } = body || {};
  const expectedUser = Netlify.env.get("ADMIN_USERNAME") || "";
  const expectedPass = Netlify.env.get("ADMIN_PASSWORD") || "";

  const valid =
    typeof username === "string" &&
    typeof password === "string" &&
    expectedUser.length > 0 &&
    expectedPass.length > 0 &&
    safeEqual(username, expectedUser) &&
    safeEqual(password, expectedPass);

  if (!valid) {
    return new Response(JSON.stringify({ error: "Usuario o contraseña incorrectos" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const token = createToken();
  return new Response(JSON.stringify({ token }), {
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/admin/login",
};
