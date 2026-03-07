export function shouldShowCopyItem(
  text: string | undefined,
  textSelected: boolean,
  email: string | null | undefined
): boolean {
  return (
    textSelected ||
    Boolean(email) ||
    (typeof text === 'string' && text.length > 0)
  )
}
