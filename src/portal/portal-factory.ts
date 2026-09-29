import { config } from '../config';
import type { PortalClient } from './PortalClient';
import { FixturePortalClient } from './adapters/fixture-portal-client';
import { LivePortalClient } from './adapters/live-portal-client';

export function createPortalClient(): PortalClient {
  if (config.DATA_SOURCE === 'live') {
    return new LivePortalClient();
  }

  return FixturePortalClient.createFromFile();
}
