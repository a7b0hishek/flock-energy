import type { Meter, MeterQuery, Transformer, TransformerQuery } from '../domain';

export interface PortalClient {
  listMeters(filters?: MeterQuery): Promise<Meter[]>;
  getMeter(meterId: string): Promise<Meter | null>;
  listTransformers(filters?: TransformerQuery): Promise<{ items: Transformer[]; total: number }>;
  getTransformer(code: string): Promise<Transformer | null>;
}

export class PortalNotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortalNotImplementedError';
  }
}
