import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp, metersToCsv, transformersToCsv } from '../app';
import meterFixture from '../fixtures/meters.fixture.json';
import transformerFixture from '../fixtures/transformers.fixture.json';
import { parseMetersResponse } from '../domain';

const app = buildApp();

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('Flock Energy meter API', () => {
  it('allows the deployed frontend to preflight the JSON login request', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/auth/login',
      headers: {
        origin: 'https://flock-energy-frontend.onrender.com',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type'
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('https://flock-energy-frontend.onrender.com');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']?.toLowerCase()).toContain('content-type');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('does not allow an unconfigured browser origin', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/auth/login',
      headers: {
        origin: 'https://untrusted.example',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type'
      }
    });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      service: 'flock-energy-meter-api'
    });
  });

  it('authenticates application demo credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'demo@flock.energy',
        password: 'demo-password'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().token).toEqual(expect.any(String));
  });

  it('rejects invalid application credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'wrong-user',
        password: 'wrong-password'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('INVALID_CREDENTIALS');
  });

  it('lists meters from the fixture source', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/meters'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.meta.total).toBeGreaterThan(0);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items[0]).toHaveProperty('meterId');
  });

  it('returns a specific meter by id', async () => {
    const listResponse = await app.inject({
      method: 'GET',
      url: '/meters'
    });

    const first = listResponse.json().items[0];
    const response = await app.inject({
      method: 'GET',
      url: `/meters/${first.meterId}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      meterId: first.meterId
    });
  });

  it('lists and searches transformer fixture records', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/transformers?search=Malviya&limit=5'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().meta.total).toBe(2);
    expect(response.json().items[0]).toMatchObject({
      code: 'DT-001',
      feeder: 'F-001',
      capacityKva: 100
    });
  });

  it('serves the complete supplied transformer fixture', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/transformers?page=1&limit=100'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toEqual(
      [...transformerFixture].sort((a, b) => a.code.localeCompare(b.code))
    );
  });

  it('returns a transformer by code', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/transformers/DT-020'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      code: 'DT-020',
      name: 'Civil Lines DT 20'
    });
  });

  it('returns 404 for a missing meter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/meters/does-not-exist-mtr-99999'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: 'NOT_FOUND'
      }
    });
  });

  it('validates query parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/meters?status=not-real'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_QUERY');
  });

  it('exports the current meter dataset as CSV', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'demo@flock.energy',
        password: 'demo-password'
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: '/meters/export',
      headers: {
        authorization: `Bearer ${loginResponse.json().token}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('filename="meters.csv"');
    const expectedRows = [...meterFixture]
      .sort((a, b) => a.meterId.localeCompare(b.meterId))
      .map((meter) => [
        meter.meterId, meter.serialNo, meter.make, meter.phaseType, meter.installStatus,
        meter.installType, meter.build, meter.dtCode, meter.hierarchy.zone.code,
        meter.hierarchy.circle.code, meter.hierarchy.division.code, meter.hierarchy.subdivision.code,
        meter.hierarchy.substation.code, meter.hierarchy.feeder.code, meter.hierarchy.dt.code,
        meter.geo.lat, meter.geo.lng
      ].join(','));
    expect(response.body.split('\n')).toEqual([
      'meterId,serialNo,make,phaseType,installStatus,installType,build,dtCode,zone,circle,division,subdivision,substation,feeder,dt,latitude,longitude',
      ...expectedRows
    ]);
  });

  it('rejects unauthenticated meter export requests', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/meters/export'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('exports transformer fixture records as authenticated CSV', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'demo@flock.energy',
        password: 'demo-password'
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: '/transformers/export',
      headers: {
        authorization: `Bearer ${loginResponse.json().token}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('filename="transformers.csv"');
    const expectedRows = [...transformerFixture]
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(({ code, name, feeder, capacityKva }) => [code, name, feeder, capacityKva].join(','));
    expect(response.body.split('\n')).toEqual(['code,name,feeder,capacityKva', ...expectedRows]);
  });

  it('rejects unauthenticated transformer export requests', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/transformers/export'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it.each(['/meters/export', '/transformers/export'])('rejects a revoked session for %s', async (url) => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'demo@flock.energy',
        password: 'demo-password'
      }
    });
    const authorization = `Bearer ${loginResponse.json().token}`;

    await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization }
    });

    const response = await app.inject({
      method: 'GET',
      url,
      headers: { authorization }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an export token issued before the backend restarts', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'demo@flock.energy',
        password: 'demo-password'
      }
    });
    const restartedApp = buildApp();
    await restartedApp.ready();

    const response = await restartedApp.inject({
      method: 'GET',
      url: '/meters/export',
      headers: {
        authorization: `Bearer ${loginResponse.json().token}`
      }
    });

    await restartedApp.close();
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid meter identifiers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/meters/invalid%20id'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_METER_ID');
  });

  it('rejects invalid transformer codes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/transformers/invalid%20code'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_TRANSFORMER_CODE');
  });

  it('rejects malformed meter fixture records', () => {
    expect(() => parseMetersResponse([{ meterId: 'invalid' }])).toThrow();
  });

  it('accepts an empty meter list and creates header-only CSV exports', () => {
    expect(parseMetersResponse([])).toEqual([]);
    expect(metersToCsv([])).toBe('meterId,serialNo,make,phaseType,installStatus,installType,build,dtCode,zone,circle,division,subdivision,substation,feeder,dt,latitude,longitude');
    expect(transformersToCsv([])).toBe('code,name,feeder,capacityKva');
  });

  it('quotes commas, quotes, and line breaks in CSV values', () => {
    expect(transformersToCsv([{
      code: 'DT-001',
      name: 'Plant, "A"\r\nNorth',
      feeder: 'F-001',
      capacityKva: 100
    }])).toBe('code,name,feeder,capacityKva\nDT-001,"Plant, ""A""\r\nNorth",F-001,100');
  });
});
