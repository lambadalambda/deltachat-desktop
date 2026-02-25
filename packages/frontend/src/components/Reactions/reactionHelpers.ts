export type ReactionPayloadMode = 'set' | 'toggle'

/**
 * Returns the payload expected by `sendReaction`.
 */
export function buildReactionPayload(
  currentReaction: string | undefined,
  nextReaction: string,
  mode: ReactionPayloadMode
): string[] {
  if (mode === 'toggle' && currentReaction === nextReaction) {
    return []
  }

  return [nextReaction]
}

export function canShowQuickReactButton(
  canSendReaction: boolean,
  isFromSelf: boolean
): boolean {
  return canSendReaction && !isFromSelf
}
