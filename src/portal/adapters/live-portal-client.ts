import type { Meter, MeterQuery, Transformer, TransformerQuery } from '../../domain';
import type { PortalClient } from '../PortalClient';
import { PortalNotImplementedError } from '../PortalClient';

export class LivePortalClient implements PortalClient {
  async listMeters(_filters?: MeterQuery): Promise<Meter[]> {
    throw new PortalNotImplementedError(
      'Live portal access requires a trusted session and a verified request-signing implementation. The signing algorithm is intentionally not guessed.'
    );
  }

  async getMeter(_meterId: string): Promise<Meter | null> {
    throw new PortalNotImplementedError(
      'Live portal access requires a trusted session and a verified request-signing implementation. The signing algorithm is intentionally not guessed.'
    );
  }

  async listTransformers(_filters?: TransformerQuery): Promise<{ items: Transformer[]; total: number }> {
    throw new PortalNotImplementedError(
      'Live transformer access requires a trusted session and verified request-signing implementation.'
    );
  }

  async getTransformer(_code: string): Promise<Transformer | null> {
    throw new PortalNotImplementedError(
      'Live transformer access requires a trusted session and verified request-signing implementation.'
    );
  }

}
