export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').replace(/^8/, '+7')
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
