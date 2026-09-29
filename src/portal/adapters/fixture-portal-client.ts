import fs from 'node:fs';
import path from 'node:path';
import type { Meter, MeterQuery, Transformer, TransformerQuery } from '../../domain';
import { parseMetersResponse, transformerSchema } from '../../domain';
import type { PortalClient } from '../PortalClient';

export class FixturePortalClient implements PortalClient {
  private readonly meters: Meter[];
  private readonly transformers: Transformer[];

  constructor(meters: Meter[], transformers: Transformer[]) {
    this.meters = meters;
    this.transformers = transformers;
  }

  static createFromFile(): FixturePortalClient {
    const fixturePath = path.resolve(__dirname, '../../fixtures/meters.fixture.json');
    const raw = fs.readFileSync(fixturePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const transformerPath = path.resolve(__dirname, '../../fixtures/transformers.fixture.json');
    const transformerRaw = fs.readFileSync(transformerPath, 'utf8');
    const transformers = (JSON.parse(transformerRaw) as unknown[]).map((item) => transformerSchema.parse(item));
    return new FixturePortalClient(parseMetersResponse(parsed), transformers);
  }

  async listMeters(filters: MeterQuery = {}): Promise<Meter[]> {
    return this.meters.filter((meter) => {
      if (filters.status && meter.installStatus !== filters.status) return false;
      if (filters.make && !meter.make.toLowerCase().includes(filters.make.toLowerCase())) return false;
      if (filters.phaseType && meter.phaseType !== filters.phaseType) return false;
      if (filters.dtCode && meter.dtCode !== filters.dtCode) return false;
      return true;
    }).sort((a, b) => a.meterId.localeCompare(b.meterId));
  }

  async getMeter(meterId: string): Promise<Meter | null> {
    return this.meters.find((meter) => meter.meterId === meterId) ?? null;
  }

  async listTransformers(filters: TransformerQuery = { page: 1, limit: 20 }): Promise<{ items: Transformer[]; total: number }> {
    const search = filters.search?.toLowerCase();
    const filtered = this.transformers.filter((transformer) => {
      if (search && !`${transformer.code} ${transformer.name} ${transformer.feeder}`.toLowerCase().includes(search)) return false;
      if (filters.feeder && transformer.feeder.toLowerCase() !== filters.feeder.toLowerCase()) return false;
      if (filters.capacityKva && transformer.capacityKva !== filters.capacityKva) return false;
      return true;
    }).sort((a, b) => a.code.localeCompare(b.code));
    const start = (filters.page - 1) * filters.limit;
    return { items: filtered.slice(start, start + filters.limit), total: filtered.length };
  }

  async getTransformer(code: string): Promise<Transformer | null> {
    return this.transformers.find((transformer) => transformer.code === code) ?? null;
  }

}
