/**
 * M16 — Tenant-suraksha ki jaanch.
 * Pehle findMany companyId ke bina bhi chal jaati thi → doosri company ki notification dikh sakti thi.
 * Ab fail-closed hai. Yeh test usi ki raksha karta hai.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationRepository } from '../../repositories/notification.repository';

test('M16: companyId ke bina notification list nahi milegi (fail-closed)', async () => {
  await assert.rejects(
    () => notificationRepository.findMany({ userId: 'u1', page: 1, limit: 20 }),
    /companyId/,
    'companyId ke bina query ko rukna chahiye'
  );
});

test('M16: khaali companyId bhi manzoor nahi', async () => {
  await assert.rejects(
    () => notificationRepository.findMany({ companyId: '', userId: 'u1' }),
    /companyId/
  );
});
