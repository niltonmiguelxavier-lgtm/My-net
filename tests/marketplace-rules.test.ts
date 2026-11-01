import { describe, expect, it } from "vitest";
import { canActivatePaidSubscription, canCreateListing, canPublishListing, sanitizeSearchTerm } from "../src/lib/marketplace/rules";

describe("regras do marketplace My Net", () => {
  it("aplica limite de anúncios activos e pendentes", () => {
    expect(canCreateListing(2, [{ status: "active", featured: false }, { status: "pending", featured: false }])).toBe(false);
    expect(canCreateListing(2, [{ status: "paused", featured: false }])).toBe(true);
    expect(canCreateListing(null, Array.from({ length: 100 }, () => ({ status: "active", featured: false })))).toBe(true);
  });
  it("não permite publicação pelo vendedor sem aprovação de moderação", () => {
    expect(canPublishListing({ sellerApproved: false, moderationRequired: false, isAdmin: false })).toBe(false);
    expect(canPublishListing({ sellerApproved: true, moderationRequired: true, isAdmin: false })).toBe(false);
    expect(canPublishListing({ sellerApproved: true, moderationRequired: false, isAdmin: false })).toBe(true);
  });
  it("não activa plano pago sem pagamento confirmado e aprovação", () => {
    expect(canActivatePaidSubscription({ paid: true, paymentConfirmed: false, adminApproved: true })).toBe(false);
    expect(canActivatePaidSubscription({ paid: true, paymentConfirmed: true, adminApproved: false })).toBe(false);
    expect(canActivatePaidSubscription({ paid: true, paymentConfirmed: true, adminApproved: true })).toBe(true);
    expect(canActivatePaidSubscription({ paid: false, paymentConfirmed: false, adminApproved: false })).toBe(true);
  });
  it("limpa caracteres de wildcard no filtro de pesquisa", () => {
    expect(sanitizeSearchTerm("  fibra_% óptica  ")).toBe("fibra óptica");
  });
});
