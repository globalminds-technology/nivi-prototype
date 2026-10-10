export type DomainErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "OUT_OF_STOCK"
  | "UNAUTHORIZED"
  | "PAYMENT_VERIFICATION_FAILED";

/**
 * Base for all expected business failures. Presentation maps `code` to an
 * HTTP status / user message; anything that isn't a DomainError is a bug or
 * an infrastructure outage.
 */
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION", message, details);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, key: string) {
    super("NOT_FOUND", `${entity} not found: ${key}`, { entity, key });
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFLICT", message, details);
  }
}

export class OutOfStockError extends DomainError {
  constructor(items: ReadonlyArray<{ sku: string; requested: number; available: number }>) {
    super("OUT_OF_STOCK", "Some items are no longer available in the requested quantity", { items });
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Not authorized") {
    super("UNAUTHORIZED", message);
  }
}

export class PaymentVerificationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("PAYMENT_VERIFICATION_FAILED", message, details);
  }
}

export const isDomainError = (e: unknown): e is DomainError => e instanceof DomainError;
