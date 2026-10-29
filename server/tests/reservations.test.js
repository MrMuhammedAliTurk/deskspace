import test from 'node:test';
import assert from 'node:assert/strict';
import { hasTimeConflict, timeToMinutes, validateReservation, validateRoom } from '../domain.js';

const base = {
  id: 'r1', roomId: 'aurora', title: 'Planlama toplantısı', organizer: 'Selin Kaya',
  attendees: 4, date: '2026-12-01', startTime: '10:00', endTime: '11:00',
  purpose: 'Ürün planlaması', status: 'confirmed', createdAt: new Date().toISOString(),
};

test('HH:mm saatini dakikaya dönüştürür', () => {
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(timeToMinutes('14:05'), 845);
  assert.equal(timeToMinutes('25:00'), null);
});

test('geçerli rezervasyon girdisini kabul eder', () => {
  assert.deepEqual(validateReservation({ ...base, id: undefined }), []);
});

test('bitiş saati başlangıç saatinden sonra olmalıdır', () => {
  const errors = validateReservation({ ...base, startTime: '11:00', endTime: '10:00' });
  assert.ok(errors.some((error) => error.includes('Bitiş saati')));
});

test('aynı odada kesişen zaman aralıklarını çakışma kabul eder', () => {
  const candidate = { ...base, startTime: '10:30', endTime: '11:30' };
  assert.equal(hasTimeConflict(candidate, [base]), true);
});

test('farklı odalardaki rezervasyonlar çakışmaz', () => {
  const candidate = { ...base, roomId: 'atlas', startTime: '10:30', endTime: '11:30' };
  assert.equal(hasTimeConflict(candidate, [base]), false);
});

test('iptal edilmiş rezervasyonlar çakışma kontrolüne dahil edilmez', () => {
  const candidate = { ...base, startTime: '10:30', endTime: '11:30' };
  assert.equal(hasTimeConflict(candidate, [{ ...base, status: 'cancelled' }]), false);
});

test('oda girdisini doğrular', () => {
  const room = { name: 'Aurora', building: 'Merkez Ofis', floor: 3, capacity: 8, type: 'Toplantı odası', equipment: ['Ekran'], color: 'violet' };
  assert.deepEqual(validateRoom(room), []);
  assert.ok(validateRoom({ ...room, capacity: 0 }).length > 0);
});
