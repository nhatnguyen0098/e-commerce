import { Buffer } from 'node:buffer';

const UUID_RE: RegExp =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CursorParts = {
  readonly name: string;
  readonly id: string;
};

function isValidUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/**
 * Encodes / decodes opaque catalog product list cursors (sort: name asc, id asc).
 */
export const catalogListCursorCodec = {
  encode(parts: CursorParts): string {
    const payload: string = JSON.stringify({
      n: parts.name,
      i: parts.id,
    });
    return Buffer.from(payload, 'utf8').toString('base64url');
  },

  decode(raw: string): CursorParts | null {
    const trimmed: string = raw.trim();
    if (trimmed.length === 0) {
      return null;
    }
    try {
      const json: unknown = JSON.parse(
        Buffer.from(trimmed, 'base64url').toString('utf8'),
      );
      if (typeof json !== 'object' || json === null) {
        return null;
      }
      const record = json as Record<string, unknown>;
      const name: unknown = record.n;
      const id: unknown = record.i;
      if (typeof name !== 'string' || typeof id !== 'string') {
        return null;
      }
      if (name.length > 512 || !isValidUuid(id)) {
        return null;
      }
      return { name, id };
    } catch {
      return null;
    }
  },
} as const;
