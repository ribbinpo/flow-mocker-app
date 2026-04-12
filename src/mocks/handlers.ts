import { http, HttpResponse } from "msw";

export const handlers = [
  // Auth endpoints
  http.post("https://api.example.com/auth/login", () => {
    return HttpResponse.json({
      data: {
        token: "mock-jwt-token-abc123",
        refreshToken: "mock-refresh-token-xyz789",
        userId: 1,
      },
    });
  }),

  http.get("https://api.example.com/user/profile", () => {
    return HttpResponse.json({
      data: {
        id: 1,
        name: "John Doe",
        email: "user@example.com",
        role: "admin",
      },
    });
  }),

  http.put("https://api.example.com/auth/refresh", () => {
    return HttpResponse.json({
      data: {
        token: "mock-refreshed-token-def456",
        refreshToken: "mock-new-refresh-token-uvw321",
      },
    });
  }),

  // Product endpoints
  http.get("https://api.example.com/products", () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "Product A", price: 19.99 },
        { id: 2, name: "Product B", price: 29.99 },
        { id: 3, name: "Product C", price: 39.99 },
      ],
      total: 3,
      page: 1,
    });
  }),

  http.post("https://api.example.com/products", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        data: {
          id: 4,
          ...(body as Record<string, unknown>),
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }),

  http.put("https://api.example.com/products/:id", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        id: Number(params.id),
        ...(body as Record<string, unknown>),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete("https://api.example.com/products/:id", ({ params }) => {
    return HttpResponse.json({
      data: { id: Number(params.id), deleted: true },
    });
  }),
];
