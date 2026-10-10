import type { TokenSigner } from "../../ports/token-signer";

export class IssueReviewLink {
  constructor(private readonly tokenSigner: TokenSigner) {}

  async execute(invoiceId: string, sku: string, expiresInDays = 30): Promise<string> {
    const expiresInSeconds = expiresInDays * 24 * 60 * 60;
    return this.tokenSigner.signReviewToken({ invoiceId, sku }, expiresInSeconds);
  }
}
