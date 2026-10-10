/** Port: current time. Injected so offer-expiry logic is deterministic in tests. */
export interface Clock {
  now(): Date;
}
