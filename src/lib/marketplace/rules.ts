export type PlanLimit = number | null;
export type ListingRecord = { status: string; featured: boolean };

/** Null means unlimited (still subject to fair use). Counts pending and active listings. */
export function canCreateListing(limit: PlanLimit, listings: ListingRecord[]): boolean {
  if (listings.some((item) => item.status === "draft" || item.status === "pending" || item.status === "active")) {
    return limit === null || listings.filter((item) => ["draft", "pending", "active"].includes(item.status)).length < limit;
  }
  return limit === null || limit > 0;
}

export function canPublishListing(input: { sellerApproved: boolean; moderationRequired: boolean; isAdmin: boolean }): boolean {
  return input.isAdmin || (input.sellerApproved && !input.moderationRequired);
}

export function canActivatePaidSubscription(input: { paid: boolean; paymentConfirmed: boolean; adminApproved: boolean }): boolean {
  return !input.paid || (input.paymentConfirmed && input.adminApproved);
}

export function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%,_]/g, "").slice(0, 120);
}
