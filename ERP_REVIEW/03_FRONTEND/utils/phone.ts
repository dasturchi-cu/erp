/** Normalize Uzbek phone input to E.164 (+998XXXXXXXXX). */
export function normalizePhoneUz(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  if (/^\+[1-9]\d{1,14}$/.test(trimmed.replace(/\s/g, ''))) {
    return trimmed.replace(/\s/g, '');
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+998${digits}`;
  }

  return trimmed.replace(/\s/g, '');
}
