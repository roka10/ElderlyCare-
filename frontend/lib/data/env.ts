export function getElderlyPersonId(): string | null {
  const id = process.env.NEXT_PUBLIC_ELDERLY_PERSON_ID || process.env.ELDERLY_PERSON_ID || null
  return id
}

