export type AuthUserRecord = {
  readonly id: string;
  readonly phone: string;
  /** Empty string when the user has no email (JWT uses string only). */
  readonly email: string;
  readonly fullName: string;
  readonly passwordHash: string;
};
