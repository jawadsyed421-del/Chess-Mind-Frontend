// Lichess OAuth2 (PKCE). Lichess needs no client registration for public clients; the user
// signs in on lichess.org, which proves they own the account. We only read their username.
const CLIENT_ID = 'chessmind-web';
const REDIRECT_PATH = '/auth/lichess';

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const random = n => b64url(crypto.getRandomValues(new Uint8Array(n)));

export async function startLichessLogin(next = '/') {
  const verifier = random(48);
  const state = random(16);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  sessionStorage.setItem('lichess_pkce', JSON.stringify({ verifier, state, next }));
  const url = new URL('https://lichess.org/oauth');
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: window.location.origin + REDIRECT_PATH,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  }).toString();
  window.location.href = url.toString();
}

/** Completes the login on the redirect page and returns { username, next }. */
export async function finishLichessLogin(params) {
  const saved = JSON.parse(sessionStorage.getItem('lichess_pkce') || 'null');
  sessionStorage.removeItem('lichess_pkce');
  if (params.get('error')) throw new Error('Lichess sign-in was cancelled.');
  if (!saved || params.get('state') !== saved.state || !params.get('code')) {
    throw new Error('Lichess sign-in could not be verified. Please try again.');
  }
  const tokenRes = await fetch('https://lichess.org/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.get('code'),
      code_verifier: saved.verifier,
      redirect_uri: window.location.origin + REDIRECT_PATH,
      client_id: CLIENT_ID,
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) throw new Error('Lichess did not return a valid sign-in.');
  // The ChessMind server asks Lichess who owns this token and issues its own ownership proof.
  const proof = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/profile/verify-lichess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token.access_token }),
  });
  const data = await proof.json();
  if (!proof.ok) throw new Error(data.error || 'Could not verify your Lichess account.');
  // The Lichess token itself is discarded; only ChessMind's ownership proof is kept.
  return { username: data.username, ownershipToken: data.token, next: saved.next || '/' };
}
