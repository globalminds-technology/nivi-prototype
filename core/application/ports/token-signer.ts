export interface ReviewTokenPayload {
  invoiceId: string;
  sku: string;
}

export interface TokenSigner {
  signReviewToken(payload: ReviewTokenPayload, expiresInSeconds?: number): Promise<string>;
  verifyReviewToken(token: string): Promise<ReviewTokenPayload | null>;
}
