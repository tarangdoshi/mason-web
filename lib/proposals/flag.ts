/** Proposal Builder master switch on the web side. Off unless explicitly "true". */
export function proposalsEnabled(value: string | undefined = process.env.NEXT_PUBLIC_PROPOSALS_ENABLED): boolean {
  return value === "true";
}
