// In-memory verification code store
const codeStore = new Map<string, { code: string; expiresAt: number; sentAt: number }>();

export function getStoredCode(phone: string): string | null {
  const entry = codeStore.get(phone);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    codeStore.delete(phone);
    return null;
  }
  return entry.code;
}

export function storeCode(phone: string, code: string) {
  codeStore.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    sentAt: Date.now(),
  });
}

export function canSendCode(phone: string): boolean {
  const entry = codeStore.get(phone);
  if (!entry) return true;
  return Date.now() - entry.sentAt >= 60 * 1000;
}
