import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

describe('Gold Loan API Test Cases (from Assignment Spec)', () => {
  beforeAll(async () => {
    // Ensure schemes are seeded
    await prisma.loanScheme.upsert({
      where: { id: 'PLAN_BULLET_01' },
      update: {},
      create: {
        id: 'PLAN_BULLET_01',
        name: 'Bullet Repayment',
        interestRateAnnual: 12.0,
        maxLtv: 0.70,
        tenureMonths: 12,
        tenureDescription: '12 months, interest + principal at maturity',
        isActive: true,
      },
    });

    await prisma.loanScheme.upsert({
      where: { id: 'PLAN_EMI_01' },
      update: {},
      create: {
        id: 'PLAN_EMI_01',
        name: 'Monthly EMI',
        interestRateAnnual: 10.5,
        maxLtv: 0.75,
        tenureMonths: 12,
        tenureDescription: '12 months, equal monthly instalments',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // GET /api/v1/loan-schemes
  it('GET /api/v1/loan-schemes returns active schemes with maxLtv <= 0.75', async () => {
    const res = await request(app).get('/api/v1/loan-schemes');
    expect(res.status).toBe(200);
    expect(res.body.schemes).toBeDefined();
    expect(res.body.schemes.length).toBeGreaterThanOrEqual(2);

    for (const scheme of res.body.schemes) {
      expect(scheme.maxLtv).toBeLessThanOrEqual(0.75);
      expect(scheme.id).toBeDefined();
      expect(scheme.name).toBeDefined();
      expect(scheme.interestRateAnnual).toBeDefined();
      expect(scheme.tenureMonths).toBeDefined();
    }
  });

  // Test Case 1: 45 g net · 22K · EMI -> pure 41.25 g · value ₹2,88,750 · loan ₹2,16,562 · 201
  it('Test Case 1: 45 g net · 22K · EMI -> pure 41.25 g · value ₹2,88,750 · loan ₹2,16,562 · 201', async () => {
    const testMobile = '9811100001';

    // Remove any previous test lead for this mobile
    await prisma.lead.deleteMany({ where: { mobileNumber: testMobile } });

    const res = await request(app)
      .post('/api/v1/leads')
      .send({
        fullName: 'Rohit Sharma',
        mobileNumber: testMobile,
        netWeightGrams: 45,
        grossWeightGrams: 45,
        karat: 22,
        planId: 'PLAN_EMI_01',
      });

    expect(res.status).toBe(201);
    expect(res.body.pureGoldGrams).toBe(41.25);
    expect(res.body.goldValue).toBe(288750);
    expect(res.body.eligibleLoan).toBe(216562);
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.applicationId).toMatch(/^APP-\d{8}-\d{4}$/);
    expect(res.body.mobileNumber).toBe('98XXXX0001'); // Masked in response
  });

  // Test Case 2: 45 g net · 22K · Bullet -> value ₹2,88,750 · loan ₹2,02,125 (70% LTV)
  it('Test Case 2: 45 g net · 22K · Bullet -> value ₹2,88,750 · loan ₹2,02,125 (70% LTV)', async () => {
    const res = await request(app)
      .post('/api/v1/quotes')
      .send({
        netWeightGrams: 45,
        grossWeightGrams: 45,
        karat: 22,
        planId: 'PLAN_BULLET_01',
      });

    expect(res.status).toBe(200);
    expect(res.body.pureGoldGrams).toBe(41.25);
    expect(res.body.goldValue).toBe(288750);
    expect(res.body.eligibleLoan).toBe(202125);
  });

  // Test Case 3: 10 g net · 18K · EMI -> pure 7.5 g · value ₹52,500 · loan ₹39,375
  it('Test Case 3: 10 g net · 18K · EMI -> pure 7.5 g · value ₹52,500 · loan ₹39,375', async () => {
    const res = await request(app)
      .post('/api/v1/quotes')
      .send({
        netWeightGrams: 10,
        grossWeightGrams: 10,
        karat: 18,
        planId: 'PLAN_EMI_01',
      });

    expect(res.status).toBe(200);
    expect(res.body.pureGoldGrams).toBe(7.5);
    expect(res.body.goldValue).toBe(52500);
    expect(res.body.eligibleLoan).toBe(39375);
  });

  // Test Case 4: net 52 g > gross 50 g -> 400 with field error on netWeightGrams
  it('Test Case 4: net 52 g > gross 50 g -> 400 with field error on netWeightGrams', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .send({
        fullName: 'Aarav Patel',
        mobileNumber: '9811100002',
        netWeightGrams: 52,
        grossWeightGrams: 50,
        karat: 22,
        planId: 'PLAN_EMI_01',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.fields).toContain('netWeightGrams');
  });

  // Test Case 5: mobile 5876543210 or 98765 -> 400 with field error on mobileNumber
  it('Test Case 5: mobile 5876543210 (starts with 5) or 98765 (< 10 digits) -> 400 with field error on mobileNumber', async () => {
    const res1 = await request(app)
      .post('/api/v1/leads')
      .send({
        fullName: 'Priya Verma',
        mobileNumber: '5876543210',
        netWeightGrams: 20,
        grossWeightGrams: 20,
        karat: 22,
        planId: 'PLAN_EMI_01',
      });

    expect(res1.status).toBe(400);
    expect(res1.body.error).toBeDefined();
    expect(res1.body.error.fields).toContain('mobileNumber');

    const res2 = await request(app)
      .post('/api/v1/leads')
      .send({
        fullName: 'Priya Verma',
        mobileNumber: '98765',
        netWeightGrams: 20,
        grossWeightGrams: 20,
        karat: 22,
        planId: 'PLAN_EMI_01',
      });

    expect(res2.status).toBe(400);
    expect(res2.body.error).toBeDefined();
    expect(res2.body.error.fields).toContain('mobileNumber');
  });

  // Test Case 6: Same mobile again within 7 days -> 409 with the existing applicationId
  it('Test Case 6: Same mobile again within 7 days -> 409 with the existing applicationId', async () => {
    const testMobile = '9822200006';
    await prisma.lead.deleteMany({ where: { mobileNumber: testMobile } });

    // First request
    const firstRes = await request(app)
      .post('/api/v1/leads')
      .send({
        fullName: 'Ananya Gupta',
        mobileNumber: testMobile,
        netWeightGrams: 30,
        grossWeightGrams: 30,
        karat: 22,
        planId: 'PLAN_BULLET_01',
      });

    expect(firstRes.status).toBe(201);
    const existingAppId = firstRes.body.applicationId;

    // Second request with same mobile
    const secondRes = await request(app)
      .post('/api/v1/leads')
      .send({
        fullName: 'Ananya Gupta',
        mobileNumber: testMobile,
        netWeightGrams: 30,
        grossWeightGrams: 30,
        karat: 22,
        planId: 'PLAN_BULLET_01',
      });

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.error).toBeDefined();
    expect(secondRes.body.error.code).toBe('DUPLICATE_APPLICATION');
    expect(secondRes.body.existingApplicationId).toBe(existingAppId);
  });

  // Test Case 7: BONUS: Same request, same Idempotency-Key -> The original 201 response, replayed
  it('Test Case 7 (BONUS): Same request, same Idempotency-Key -> The original 201 response, replayed', async () => {
    const testMobile = '9833300007';
    const idempotencyKey = 'idemp-' + Date.now();
    await prisma.lead.deleteMany({ where: { mobileNumber: testMobile } });

    const firstRes = await request(app)
      .post('/api/v1/leads')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        fullName: 'Karan Mehra',
        mobileNumber: testMobile,
        netWeightGrams: 25,
        grossWeightGrams: 25,
        karat: 24,
        planId: 'PLAN_EMI_01',
      });

    expect(firstRes.status).toBe(201);
    const originalAppId = firstRes.body.applicationId;

    // Replay with exact same Idempotency-Key
    const replayRes = await request(app)
      .post('/api/v1/leads')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        fullName: 'Karan Mehra',
        mobileNumber: testMobile,
        netWeightGrams: 25,
        grossWeightGrams: 25,
        karat: 24,
        planId: 'PLAN_EMI_01',
      });

    expect(replayRes.status).toBe(201);
    expect(replayRes.body.applicationId).toBe(originalAppId);
    expect(replayRes.body.status).toBe('SUBMITTED');
  });

  // Test Case 8: BONUS: 2 parallel requests, same new mobile -> Exactly one 201 and one 409
  it('Test Case 8 (BONUS): 2 parallel requests, same new mobile -> Exactly one 201 and one 409', async () => {
    const testMobile = '9844400008';
    await prisma.lead.deleteMany({ where: { mobileNumber: testMobile } });

    const payload = {
      fullName: 'Vikram Joshi',
      mobileNumber: testMobile,
      netWeightGrams: 35,
      grossWeightGrams: 35,
      karat: 22,
      planId: 'PLAN_EMI_01',
    };

    // Fire 2 requests simultaneously
    const [resA, resB] = await Promise.all([
      request(app).post('/api/v1/leads').send(payload),
      request(app).post('/api/v1/leads').send(payload),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);
  });

  // GET /api/v1/leads
  it('GET /api/v1/leads returns all leads newest first with masked mobile numbers', async () => {
    const res = await request(app).get('/api/v1/leads?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.leads).toBeDefined();
    expect(res.body.pagination).toBeDefined();

    for (const lead of res.body.leads) {
      expect(lead.mobileNumber).toMatch(/^\d{2}XXXX\d{4}$/);
    }
  });

  // Status workflow & audit log
  it('PATCH /api/v1/leads/:id/status transitions status and records audit log', async () => {
    const testMobile = '9855500009';
    await prisma.lead.deleteMany({ where: { mobileNumber: testMobile } });

    const createRes = await request(app)
      .post('/api/v1/leads')
      .send({
        fullName: 'Neha Kapoor',
        mobileNumber: testMobile,
        netWeightGrams: 15,
        grossWeightGrams: 15,
        karat: 22,
        planId: 'PLAN_BULLET_01',
      });

    const appId = createRes.body.applicationId;

    // Transition to UNDER_REVIEW
    const updateRes = await request(app)
      .patch(`/api/v1/leads/${appId}/status`)
      .send({
        status: 'UNDER_REVIEW',
        note: 'Gold purity verification in progress',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('UNDER_REVIEW');

    // Fetch audit logs
    const auditRes = await request(app).get(`/api/v1/leads/${appId}/audit-logs`);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.auditLogs.length).toBe(2);
    expect(auditRes.body.auditLogs[1].newStatus).toBe('UNDER_REVIEW');
  });
});
