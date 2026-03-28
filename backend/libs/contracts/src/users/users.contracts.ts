/** Saved shipping/contact address on the user profile (stored as JSON array). */
export type UserSavedAddressDto = {
  readonly id: string;
  readonly label?: string;
  readonly recipientName: string;
  readonly phone: string;
  readonly line1: string;
  readonly line2?: string;
  readonly ward: string;
  readonly district: string;
  readonly city: string;
  readonly postalCode?: string;
};

export type UserResponse = {
  readonly id: string;
  readonly fullName: string;
  readonly phone: string;
  readonly email: string | null;
  readonly addresses: readonly UserSavedAddressDto[];
};

export type GetUserByIdRequest = {
  readonly userId: string;
  readonly accessToken: string;
};

export type UserCheckExistsRequest = {
  readonly userId: string;
};

export type UserCheckExistsResponse = {
  readonly exists: boolean;
};

/** Internal: auth-service sends bcrypt hash; never expose via HTTP. */
export type CreateUserRequest = {
  readonly phone: string;
  readonly fullName: string;
  readonly passwordHash: string;
  readonly email?: string;
};

export type GetUserByEmailRequest = {
  readonly email: string;
};

/** Internal: includes password hash for auth-service login only. */
export type GetUserByEmailResponse = {
  readonly found: boolean;
  readonly user: {
    readonly id: string;
    readonly phone: string;
    readonly email: string;
    readonly fullName: string;
    readonly passwordHash: string;
  } | null;
};

export type GetUserByPhoneRequest = {
  readonly phone: string;
};

/** Internal: includes password hash for auth-service login only. */
export type GetUserByPhoneResponse = {
  readonly found: boolean;
  readonly user: {
    readonly id: string;
    readonly phone: string;
    readonly email: string;
    readonly fullName: string;
    readonly passwordHash: string;
  } | null;
};

export type UpdateUserRequest = {
  readonly accessToken: string;
  readonly userId: string;
  readonly fullName?: string;
  /** Omit to leave unchanged; `null` or empty string clears email. */
  readonly email?: string | null;
  readonly phone?: string;
  /** Replaces the entire saved address list when provided. */
  readonly addresses?: readonly UserSavedAddressDto[];
};

/** HTTP body for PATCH /users/:id (gateway forwards to user-service). */
export type UpdateUserProfilePayload = {
  readonly fullName?: string;
  readonly email?: string | null;
  readonly phone?: string;
  readonly addresses?: readonly UserSavedAddressDto[];
};

export const USER_MESSAGE_PATTERN = {
  getUserById: 'get-user-by-id',
  checkExists: 'user-check-exists',
  createUser: 'user-create',
  getUserByEmail: 'user-get-by-email',
  getUserByPhone: 'user-get-by-phone',
  updateUser: 'user-update',
} as const;
