// AES-256-GCM client-side encryption for Password Vault
// Master password never leaves the client / is never stored in DB

const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 256

async function deriveKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as any, iterations: 310000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function encryptVaultEntry(
  masterPassword: string,
  payload: { password: string; notes?: string }
): Promise<{ encrypted_payload: string; encryption_meta: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(masterPassword, salt)

  const plaintext = new TextEncoder().encode(JSON.stringify(payload))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    plaintext
  )

  return {
    encrypted_payload: toBase64(ciphertext),
    encryption_meta: JSON.stringify({
      salt: toBase64(salt),
      iv: toBase64(iv),
      version: 1,
    }),
  }
}

export async function decryptVaultEntry(
  masterPassword: string,
  encrypted_payload: string,
  encryption_meta: string
): Promise<{ password: string; notes?: string } | null> {
  try {
    const meta = JSON.parse(encryption_meta)
    const salt = fromBase64(meta.salt)
    const iv = fromBase64(meta.iv)
    const key = await deriveKey(masterPassword, salt)
    const ciphertext = fromBase64(encrypted_payload)

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      ciphertext as any
    )
    return JSON.parse(new TextDecoder().decode(plaintext))
  } catch {
    return null
  }
}

// Verify test: store an encrypted test payload in localStorage
const VAULT_TEST_KEY = 'vault_verify_v1'

export async function setVaultMasterPassword(
  masterPassword: string
): Promise<void> {
  const { encrypted_payload, encryption_meta } = await encryptVaultEntry(
    masterPassword,
    { password: '__verify__', notes: 'vault_check' }
  )
  localStorage.setItem(
    VAULT_TEST_KEY,
    JSON.stringify({ encrypted_payload, encryption_meta })
  )
}

export async function verifyVaultMasterPassword(
  masterPassword: string
): Promise<boolean> {
  const stored = localStorage.getItem(VAULT_TEST_KEY)
  if (!stored) return false
  try {
    const { encrypted_payload, encryption_meta } = JSON.parse(stored)
    const result = await decryptVaultEntry(
      masterPassword,
      encrypted_payload,
      encryption_meta
    )
    return result?.password === '__verify__'
  } catch {
    return false
  }
}

export function hasVaultMasterPassword(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(VAULT_TEST_KEY)
}

export function clearVaultSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('vault_session_key')
}

export function saveVaultSessionKey(masterPassword: string): void {
  sessionStorage.setItem('vault_session_key', masterPassword)
}

export function getVaultSessionKey(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('vault_session_key')
}
