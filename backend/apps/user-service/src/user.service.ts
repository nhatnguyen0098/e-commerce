import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { verifyJwt } from '@common/utils/verify-jwt';
import type {
  CreateUserRequest,
  GetUserByEmailResponse,
  GetUserByPhoneResponse,
  UpdateUserRequest,
  UserResponse,
  UserSavedAddressDto,
} from '@contracts/users/users.contracts';
import type { Prisma } from '@prisma-user/client';
import { UserRepository } from './user.repository';

const MAX_SAVED_ADDRESSES: number = 20;
const MAX_RECIPIENT_NAME_LEN: number = 120;
const MAX_PHONE_LEN: number = 40;
const MAX_LINE1_LEN: number = 240;
const MAX_WARD_LEN: number = 120;
const MAX_LABEL_LEN: number = 80;
const MAX_POSTAL_LEN: number = 32;
const MIN_PHONE_DIGITS: number = 8;
const USER_NOT_FOUND_MESSAGE: string = 'User not found';
const INVALID_PHONE_MESSAGE: string = 'Invalid phone number';
const PHONE_IN_USE_MESSAGE: string = 'Phone already in use';
const EMAIL_IN_USE_MESSAGE: string = 'Email already in use';
const PHONE_OR_EMAIL_IN_USE_MESSAGE: string = 'Phone or email already in use';
const UNAUTHORIZED_MESSAGE: string = 'Unauthorized';
const FORBIDDEN_MESSAGE: string = 'Forbidden';
const NO_FIELDS_TO_UPDATE_MESSAGE: string = 'No fields to update';

@Injectable()
export class UserService {
  public constructor(private readonly userRepository: UserRepository) {}
  public async checkUserExists(userId: string): Promise<boolean> {
    const row = await this.userRepository.findUserById(userId);
    return row !== null;
  }
  /**
   * Get user details by identifier from PostgreSQL.
   */
  public async getUserById(userId: string): Promise<UserResponse> {
    const row = await this.userRepository.findUserById(userId);
    if (row) {
      return this.toUserResponse(row);
    }
    return {
      id: userId,
      fullName: 'Unknown User',
      phone: '',
      email: null,
      addresses: [],
    };
  }

  /**
   * Create a user row (credentials stored for auth login).
   */
  public async createUser(
    requestBody: CreateUserRequest,
  ): Promise<UserResponse> {
    const normalizedPhone: string = this.normalizePhone(requestBody.phone);
    if (normalizedPhone.length === 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Phone is required',
      });
    }
    const optionalEmail: string | undefined = this.normalizeOptionalEmail(
      requestBody.email,
    );
    try {
      const row = await this.userRepository.createUser({
        phone: normalizedPhone,
        email: optionalEmail ?? null,
        fullName: requestBody.fullName.trim(),
        passwordHash: requestBody.passwordHash,
      });
      return this.toUserResponse(row);
    } catch (error: unknown) {
      if (this.isPrismaUniqueViolation(error)) {
        this.throwConflict(PHONE_OR_EMAIL_IN_USE_MESSAGE);
      }
      throw error;
    }
  }

  /**
   * Load user by email for auth-service login (includes password hash).
   */
  public async getUserByEmail(email: string): Promise<GetUserByEmailResponse> {
    const normalizedEmail: string = this.normalizeEmail(email);
    const row = await this.userRepository.findUserByEmail(normalizedEmail);
    if (!row) {
      return { found: false, user: null };
    }
    return this.toFoundUserResponse(row);
  }

  /**
   * Load user by phone for auth-service login (includes password hash).
   */
  public async getUserByPhone(phone: string): Promise<GetUserByPhoneResponse> {
    const normalizedPhone: string = this.normalizePhone(phone);
    if (normalizedPhone.length === 0) {
      return { found: false, user: null };
    }
    const row = await this.userRepository.findUserByPhone(normalizedPhone);
    if (!row) {
      return { found: false, user: null };
    }
    return this.toFoundUserResponse(row);
  }

  /**
   * Update profile fields for the authenticated user (must match JWT subject).
   */
  public async updateUser(
    requestBody: UpdateUserRequest,
  ): Promise<UserResponse> {
    const authUserId: string = this.verifyUpdatePermission(requestBody);
    const fullName: string | undefined = requestBody.fullName?.trim();
    const current = await this.userRepository.findUserById(requestBody.userId);
    if (current === null) {
      throw new RpcException(USER_NOT_FOUND_MESSAGE);
    }
    const data: Prisma.UserUpdateInput = {};
    if (fullName !== undefined && fullName.length > 0) {
      data.fullName = fullName;
    }
    if (requestBody.email !== undefined) {
      if (requestBody.email === null || requestBody.email.trim() === '') {
        data.email = null;
      } else {
        data.email = this.normalizeEmail(requestBody.email);
      }
    }
    if (requestBody.phone !== undefined) {
      const nextPhone: string = this.normalizePhone(requestBody.phone);
      if (nextPhone.length < MIN_PHONE_DIGITS) {
        this.throwBadRequest(INVALID_PHONE_MESSAGE);
      }
      if (nextPhone !== current.phone) {
        const taken = await this.userRepository.findUserByPhone(nextPhone);
        if (taken !== null && taken.id !== authUserId) {
          this.throwConflict(PHONE_IN_USE_MESSAGE);
        }
      }
      data.phone = nextPhone;
    }
    if (requestBody.addresses !== undefined) {
      data.addresses = this.validateAndSerializeAddresses(
        requestBody.addresses,
      );
    }
    if (Object.keys(data).length === 0) {
      throw new RpcException(NO_FIELDS_TO_UPDATE_MESSAGE);
    }
    try {
      const row = await this.userRepository.updateUser({
        userId: requestBody.userId,
        data,
      });
      return this.toUserResponse(row);
    } catch (error: unknown) {
      if (this.isPrismaUniqueViolation(error)) {
        const target = this.readPrismaUniqueTarget(error);
        this.throwConflict(
          target === 'phone' ? PHONE_IN_USE_MESSAGE : EMAIL_IN_USE_MESSAGE,
        );
      }
      if (this.isPrismaRecordNotFound(error)) {
        throw new RpcException(USER_NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }

  private verifyUpdatePermission(requestBody: UpdateUserRequest): string {
    const verifyResult = verifyJwt({ accessToken: requestBody.accessToken });
    if (!verifyResult.isValid || !verifyResult.user) {
      throw new RpcException(UNAUTHORIZED_MESSAGE);
    }
    if (verifyResult.user.id !== requestBody.userId) {
      throw new RpcException(FORBIDDEN_MESSAGE);
    }
    return verifyResult.user.id;
  }

  private throwBadRequest(message: string): never {
    throw new RpcException({
      status: HttpStatus.BAD_REQUEST,
      message,
    });
  }

  private throwConflict(message: string): never {
    throw new RpcException({
      status: HttpStatus.CONFLICT,
      message,
    });
  }

  private toUserResponse(row: {
    id: string;
    email: string | null;
    phone: string;
    fullName: string;
    addresses: Prisma.JsonValue;
  }): UserResponse {
    return {
      id: row.id,
      fullName: row.fullName,
      phone: row.phone,
      email: row.email,
      addresses: this.parseStoredAddresses(row.addresses),
    };
  }

  private toFoundUserResponse(row: {
    readonly id: string;
    readonly phone: string;
    readonly email: string | null;
    readonly fullName: string;
    readonly passwordHash: string;
  }): GetUserByEmailResponse {
    return {
      found: true,
      user: {
        id: row.id,
        phone: row.phone,
        email: row.email ?? '',
        fullName: row.fullName,
        passwordHash: row.passwordHash,
      },
    };
  }

  private parseStoredAddresses(value: Prisma.JsonValue): UserSavedAddressDto[] {
    if (value === null || !Array.isArray(value)) {
      return [];
    }
    const out: UserSavedAddressDto[] = [];
    for (const item of value) {
      if (typeof item !== 'object' || item === null) {
        continue;
      }
      const rec = item as Record<string, unknown>;
      const id: unknown = rec.id;
      const recipientName: unknown = rec.recipientName;
      const phone: unknown = rec.phone;
      const line1: unknown = rec.line1;
      const ward: unknown = rec.ward;
      const district: unknown = rec.district;
      const city: unknown = rec.city;
      if (
        typeof id !== 'string' ||
        typeof recipientName !== 'string' ||
        typeof phone !== 'string' ||
        typeof line1 !== 'string' ||
        typeof ward !== 'string' ||
        typeof district !== 'string' ||
        typeof city !== 'string'
      ) {
        continue;
      }
      const labelRaw: unknown = rec.label;
      const line2Raw: unknown = rec.line2;
      const postalRaw: unknown = rec.postalCode;
      const label: string | undefined =
        typeof labelRaw === 'string' && labelRaw.trim().length > 0
          ? labelRaw.trim()
          : undefined;
      const line2: string | undefined =
        typeof line2Raw === 'string' && line2Raw.trim().length > 0
          ? line2Raw.trim()
          : undefined;
      const postalCode: string | undefined =
        typeof postalRaw === 'string' && postalRaw.trim().length > 0
          ? postalRaw.trim()
          : undefined;
      out.push({
        id: id.trim(),
        ...(label !== undefined ? { label } : {}),
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        line1: line1.trim(),
        ...(line2 !== undefined ? { line2 } : {}),
        ward: ward.trim(),
        district: district.trim(),
        city: city.trim(),
        ...(postalCode !== undefined ? { postalCode } : undefined),
      });
    }
    return out;
  }

  private validateAndSerializeAddresses(
    raw: readonly UserSavedAddressDto[],
  ): Prisma.InputJsonValue {
    if (raw.length > MAX_SAVED_ADDRESSES) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `At most ${MAX_SAVED_ADDRESSES} saved addresses`,
      });
    }
    const seenIds: Set<string> = new Set();
    const serialized: Record<string, unknown>[] = [];
    for (const entry of raw) {
      const id: string = entry.id.trim();
      if (id.length < 8 || id.length > 64 || seenIds.has(id)) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid address id',
        });
      }
      seenIds.add(id);
      const recipientName: string = entry.recipientName.trim();
      const phone: string = this.normalizePhone(entry.phone);
      const line1: string = entry.line1.trim();
      const ward: string = entry.ward.trim();
      const district: string = entry.district.trim();
      const city: string = entry.city.trim();
      if (
        recipientName.length === 0 ||
        phone.length < MIN_PHONE_DIGITS ||
        line1.length === 0 ||
        ward.length === 0 ||
        district.length === 0 ||
        city.length === 0
      ) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Incomplete saved address',
        });
      }
      if (
        recipientName.length > MAX_RECIPIENT_NAME_LEN ||
        phone.length > MAX_PHONE_LEN ||
        line1.length > MAX_LINE1_LEN ||
        ward.length > MAX_WARD_LEN ||
        district.length > MAX_WARD_LEN ||
        city.length > MAX_WARD_LEN
      ) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Saved address field too long',
        });
      }
      const labelRaw: string | undefined = entry.label;
      const line2Raw: string | undefined = entry.line2;
      const postalRaw: string | undefined = entry.postalCode;
      const label: string | undefined =
        labelRaw !== undefined && labelRaw.trim().length > 0
          ? labelRaw.trim().slice(0, MAX_LABEL_LEN)
          : undefined;
      const line2: string | undefined =
        line2Raw !== undefined && line2Raw.trim().length > 0
          ? line2Raw.trim().slice(0, MAX_LINE1_LEN)
          : undefined;
      const postalCode: string | undefined =
        postalRaw !== undefined && postalRaw.trim().length > 0
          ? postalRaw.trim().slice(0, MAX_POSTAL_LEN)
          : undefined;
      serialized.push({
        id,
        ...(label !== undefined ? { label } : {}),
        recipientName,
        phone,
        line1,
        ...(line2 !== undefined ? { line2 } : {}),
        ward,
        district,
        city,
        ...(postalCode !== undefined ? { postalCode } : undefined),
      });
    }
    return serialized as Prisma.InputJsonValue;
  }

  private readPrismaUniqueTarget(error: unknown): string | null {
    if (typeof error !== 'object' || error === null || !('meta' in error)) {
      return null;
    }
    const meta = (error as { meta?: { target?: unknown } }).meta;
    const target: unknown = meta?.target;
    if (Array.isArray(target) && target.length > 0) {
      const first: unknown = target[0];
      return typeof first === 'string' ? first : null;
    }
    return null;
  }

  private normalizePhone(phone: string): string {
    return phone.trim().replace(/\s+/g, '');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeOptionalEmail(
    email: string | null | undefined,
  ): string | undefined {
    if (email === undefined || email === null || email.trim().length === 0) {
      return undefined;
    }
    return this.normalizeEmail(email);
  }

  private isPrismaUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }

  private isPrismaRecordNotFound(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    );
  }
}
