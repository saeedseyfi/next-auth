import { createHash, randomBytes } from "crypto"

interface VerifyCSRFTokenParams {
  secret: string;
  cookieValue?: string;
  bodyValue?: string
}

/**
 * Ensure CSRF Token cookie is set for any subsequent requests.
 * Used as part of the strategy for mitigation for CSRF tokens.
 *
 * Creates a cookie like 'next-auth.csrf-token' with the value 'token|hash',
 * where 'token' is the CSRF token and 'hash' is a hash made of the token and
 * the secret, and the two values are joined by a pipe '|'. By storing the
 * value and the hash of the value (with the secret used as a salt) we can
 * verify the cookie was set by the server and not by a malicous attacker.
 *
 * For more details, see the following OWASP links:
 * https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie
 * https://owasp.org/www-chapter-london/assets/slides/David_Johansson-Double_Defeat_of_Double-Submit_Cookie.pdf
 */

function createHashWithSecret(
  secret: string,
  csrfToken: string
): string {
  return createHash("sha256")
    .update(`${csrfToken}${secret}`)
    .digest("hex")
}

/**
 * Create a CSRF token and the cookie vlaue.
 */
export function createCSRFToken(secret: string) {
  const csrfToken = randomBytes(32).toString("hex")
  const csrfTokenHash = createHashWithSecret(secret, csrfToken)
  const cookie = `${csrfToken}|${csrfTokenHash}`

  return { cookie, csrfToken }
}

/**
 * Verify the passed CSRF token with the cookie and the secret.
 */
export function verifyCSRFToken({
                                  secret,
                                  cookieValue,
                                  bodyValue
                                }: VerifyCSRFTokenParams) {
  if (!cookieValue || bodyValue) {
    return false
  }

  const [csrfToken, csrfTokenHash] = cookieValue.split("|")
  const expectedCsrfTokenHash = createHashWithSecret(secret, csrfToken)

  return csrfToken === bodyValue && csrfTokenHash === expectedCsrfTokenHash
}
