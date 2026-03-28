const apiBaseUrl: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export type UserSavedAddress = {
  readonly id: string
  readonly label?: string
  readonly recipientName: string
  readonly phone: string
  readonly line1: string
  readonly line2?: string
  readonly ward: string
  readonly district: string
  readonly city: string
  readonly postalCode?: string
}

export type UserProfile = {
  readonly id: string
  readonly fullName: string
  readonly phone: string
  readonly email: string | null
  readonly addresses: readonly UserSavedAddress[]
}

export type UpdateUserProfileBody = {
  readonly fullName?: string
  readonly email?: string | null
  readonly phone?: string
  readonly addresses?: readonly UserSavedAddress[]
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const text: string = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('Invalid JSON from server')
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const response: Response = await fetch(`${apiBaseUrl}/users/${userId}`, {
    method: 'GET',
    credentials: 'include',
  })
  const payload: unknown = await parseJsonOrThrow(response)
  if (!response.ok) {
    throw new Error('Could not load profile')
  }
  return payload as UserProfile
}

export async function updateUserProfile(
  userId: string,
  body: UpdateUserProfileBody,
): Promise<UserProfile> {
  const response: Response = await fetch(`${apiBaseUrl}/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const payload: unknown = await parseJsonOrThrow(response)
  if (!response.ok) {
    throw new Error('Could not update profile')
  }
  return payload as UserProfile
}
