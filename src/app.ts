import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config';
import { meterQuerySchema, transformerQuerySchema, type Meter, type Transformer } from './domain';
import { createPortalClient } from './portal/portal-factory';

function buildError(code: string, message: string, details?: unknown) {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };
}

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function metersToCsv(meters: Meter[]) {
  const headers = [
    'meterId', 'serialNo', 'make', 'phaseType', 'installStatus', 'installType', 'build', 'dtCode',
    'zone', 'circle', 'division', 'subdivision', 'substation', 'feeder', 'dt', 'latitude', 'longitude'
  ];
  const rows = meters.map((meter) => [
    meter.meterId,
    meter.serialNo,
    meter.make,
    meter.phaseType,
    meter.installStatus,
    meter.installType,
    meter.build,
    meter.dtCode,
    meter.hierarchy.zone.code,
    meter.hierarchy.circle.code,
    meter.hierarchy.division.code,
    meter.hierarchy.subdivision.code,
    meter.hierarchy.substation.code,
    meter.hierarchy.feeder.code,
    meter.hierarchy.dt.code,
    meter.geo.lat,
    meter.geo.lng
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

export function transformersToCsv(transformers: Transformer[]) {
  const headers = ['code', 'name', 'feeder', 'capacityKva'];
  const rows = transformers.map((transformer) => [transformer.code, transformer.name, transformer.feeder, transformer.capacityKva]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  const portalClient = createPortalClient();
  const sessions = new Set<string>();

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) {
      return reply.code(400).send(
        buildError('INVALID_QUERY', 'The request query parameters are invalid.', error.flatten())
      );
    }

    if ((error as { statusCode?: number }).statusCode === 404) {
      return reply.code(404).send(buildError('NOT_FOUND', 'The requested resource was not found.'));
    }

    console.error('Request failed:', error);

    return reply.code(500).send(
      buildError('INTERNAL_SERVER_ERROR', 'An unexpected server error occurred.')
    );
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'flock-energy-meter-api',
    dataSource: config.DATA_SOURCE,
    timestamp: new Date().toISOString()
  }));

  app.post('/auth/login', async (request, reply) => {
    const body = request.body as { username?: unknown; password?: unknown } | undefined;

    if (body?.username !== config.APP_DEMO_USERNAME || body?.password !== config.APP_DEMO_PASSWORD) {
      return reply.code(401).send(buildError('INVALID_CREDENTIALS', 'The application username or password is incorrect.'));
    }

    const token = randomUUID();
    sessions.add(token);

    return {
      token,
      user: {
        username: config.APP_DEMO_USERNAME
      }
    };
  });

  app.post('/auth/logout', async (request, reply) => {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (token) {
      sessions.delete(token);
    }

    return reply.code(204).send();
  });

  app.get('/meters', async (request, reply) => {
    const parsed = meterQuerySchema.safeParse(request.query as Record<string, unknown>);

    if (!parsed.success) {
      return reply.code(400).send(
        buildError('INVALID_QUERY', 'The request query parameters are invalid.', parsed.error.flatten())
      );
    }

    const meters = await portalClient.listMeters(parsed.data);
    return {
      meta: {
        total: meters.length,
        filters: parsed.data
      },
      items: meters
    };
  });

  app.get('/meters/export', async (_request, reply) => {
    const authorization = _request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (!token || !sessions.has(token)) {
      return reply.code(401).send(buildError('UNAUTHORIZED', 'A valid application session is required for export.'));
    }

    const meters = await portalClient.listMeters();
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="meters.csv"')
      .send(metersToCsv(meters));
  });

  app.get('/meters/:meterId', async (request, reply) => {
    const { meterId } = request.params as { meterId: string };

    if (!meterId || !/^[A-Za-z0-9\-_]+$/.test(meterId)) {
      return reply.code(400).send(buildError('INVALID_METER_ID', 'meterId must contain only letters, numbers, hyphen or underscore.'));
    }

    const meter = await portalClient.getMeter(meterId);

    if (!meter) {
      return reply.code(404).send(buildError('NOT_FOUND', `Meter ${meterId} was not found.`));
    }

    return meter;
  });

  app.get('/transformers', async (request, reply) => {
    const parsed = transformerQuerySchema.safeParse(request.query as Record<string, unknown>);

    if (!parsed.success) {
      return reply.code(400).send(
        buildError('INVALID_QUERY', 'The transformer query parameters are invalid.', parsed.error.flatten())
      );
    }

    const result = await portalClient.listTransformers(parsed.data);
    return {
      meta: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total: result.total,
        filters: parsed.data
      },
      items: result.items
    };
  });

  app.get('/transformers/export', async (request, reply) => {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (!token || !sessions.has(token)) {
      return reply.code(401).send(buildError('UNAUTHORIZED', 'A valid application session is required for export.'));
    }

    const result = await portalClient.listTransformers({ page: 1, limit: 100 });
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="transformers.csv"')
      .send(transformersToCsv(result.items));
  });

  app.get('/transformers/:code', async (request, reply) => {
    const { code } = request.params as { code: string };
    if (!code || !/^[A-Za-z0-9\-_]+$/.test(code)) {
      return reply.code(400).send(buildError('INVALID_TRANSFORMER_CODE', 'code must contain only letters, numbers, hyphen or underscore.'));
    }

    const transformer = await portalClient.getTransformer(code);
    if (!transformer) {
      return reply.code(404).send(buildError('NOT_FOUND', `Transformer ${code} was not found.`));
    }

    return transformer;
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send(buildError('NOT_FOUND', 'The requested route does not exist.'));
  });

  return app;
}
