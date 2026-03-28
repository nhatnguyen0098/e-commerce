type ExtractBearerTokenInput = {
  readonly authorizationHeader: string | string[] | undefined;
};

/**
 * Parses a Bearer token from an Authorization header value.
 */
export function extractBearerToken(
  input: ExtractBearerTokenInput,
): string | null {
  const { authorizationHeader } = input;
  if (!authorizationHeader || Array.isArray(authorizationHeader)) {
    return null;
  }
  const [tokenType, accessToken] = authorizationHeader.split(' ');
  if (tokenType !== 'Bearer' || !accessToken) {
    return null;
  }
  return accessToken;
}
