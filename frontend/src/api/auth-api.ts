const apiBaseUrl: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export type AuthSessionUser = {
  readonly id: string;
  readonly phone: string;
  readonly email: string | null;
  readonly fullName: string;
};

type AuthTokenResponse = {
  readonly accessToken: string;
  readonly tokenType: "Bearer";
  readonly expiresIn: string;
  readonly user: AuthSessionUser;
};

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const text: string = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Invalid JSON from server");
  }
}

function messageFromErrorPayload(payload: unknown, fallback: string): string {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("message" in payload)
  ) {
    return fallback;
  }
  const raw: unknown = (payload as { message: unknown }).message;
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && raw.every((item) => typeof item === "string")) {
    return raw.join(", ");
  }
  return fallback;
}

/**
 * Returns the current user if the httpOnly session cookie is valid; otherwise null.
 */
export async function fetchCurrentUser(): Promise<AuthSessionUser | null> {
  const response: Response = await fetch(`${apiBaseUrl}/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  if (response.status === 401) {
    return null;
  }
  const payload: unknown = await parseJsonOrThrow(response);
  if (!response.ok) {
    throw new Error(
      messageFromErrorPayload(
        payload,
        `Session check failed (${response.status})`,
      ),
    );
  }
  return payload as AuthSessionUser;
}

/**
 * Register against api-gateway; browser stores httpOnly cookie from Set-Cookie.
 */
export async function registerUser(input: {
  readonly fullName: string;
  readonly phone: string;
  readonly password: string;
  readonly email?: string;
}): Promise<AuthTokenResponse> {
  const response: Response = await fetch(`${apiBaseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      fullName: input.fullName,
      phone: input.phone,
      password: input.password,
      ...(input.email !== undefined && input.email.trim().length > 0
        ? { email: input.email.trim().toLowerCase() }
        : {}),
    }),
  });
  const payload: unknown = await parseJsonOrThrow(response);
  if (!response.ok) {
    throw new Error(
      messageFromErrorPayload(payload, `Register failed (${response.status})`),
    );
  }
  return payload as AuthTokenResponse;
}

/**
 * Login; cookie required for subsequent authenticated requests.
 */
export async function loginUser(input: {
  readonly phone: string;
  readonly password: string;
}): Promise<AuthTokenResponse> {
  const response: Response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      phone: input.phone,
      password: input.password,
    }),
  });
  const payload: unknown = await parseJsonOrThrow(response);
  if (!response.ok) {
    throw new Error(
      messageFromErrorPayload(payload, `Login failed (${response.status})`),
    );
  }
  return payload as AuthTokenResponse;
}

export async function logoutUser(): Promise<void> {
  const response: Response = await fetch(`${apiBaseUrl}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const payload: unknown = await parseJsonOrThrow(response);
    throw new Error(
      messageFromErrorPayload(payload, `Logout failed (${response.status})`),
    );
  }
}
