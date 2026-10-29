import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const filePath = resolve('server/data/db.json');
const roomSeeds = [
  { id: 'room-aurora', name: 'Aurora', building: 'Merkez Ofis', floor: 3, capacity: 8, type: 'Toplantı odası', equipment: ['Ekran', 'Video konferans', 'Beyaz tahta'], color: 'violet' },
  { id: 'room-atlas', name: 'Atlas', building: 'Merkez Ofis', floor: 2, capacity: 6, type: 'Toplantı odası', equipment: ['Ekran', 'Beyaz tahta'], color: 'blue' },
  { id: 'room-focus', name: 'Focus Pod 01', building: 'Merkez Ofis', floor: 4, capacity: 2, type: 'Odak odası', equipment: ['Akustik panel', 'Monitör'], color: 'green' },
  { id: 'room-orbit', name: 'Orbit', building: 'Ek Bina', floor: 1, capacity: 12, type: 'Eğitim odası', equipment: ['Projektör', 'Video konferans', 'Beyaz tahta'], color: 'orange' },
  { id: 'room-cove', name: 'Cove', building: 'Merkez Ofis', floor: 1, capacity: 4, type: 'Odak odası', equipment: ['Monitör', 'Akustik panel'], color: 'pink' },
  { id: 'room-studio', name: 'Studio', building: 'Ek Bina', floor: 2, capacity: 16, type: 'Ortak alan', equipment: ['Ekran', 'Projektör', 'Video konferans'], color: 'blue' },
];

function dateOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initialData() {
  const now = new Date().toISOString();
  const today = dateOffset(0);
  const tomorrow = dateOffset(1);
  return {
    rooms: roomSeeds,
    reservations: [
      { id: randomUUID(), roomId: 'room-aurora', title: 'Ürün yol haritası', organizer: 'Selin Kaya', attendees: 6, date: today, startTime: '09:30', endTime: '10:30', purpose: 'Q4 planlama toplantısı', status: 'confirmed', createdAt: now },
      { id: randomUUID(), roomId: 'room-atlas', title: 'Tasarım değerlendirmesi', organizer: 'Emre Demir', attendees: 4, date: today, startTime: '11:00', endTime: '12:00', purpose: 'Yeni panel tasarımı', status: 'confirmed', createdAt: now },
      { id: randomUUID(), roomId: 'room-orbit', title: 'Ekip oryantasyonu', organizer: 'Zeynep Arslan', attendees: 10, date: today, startTime: '13:00', endTime: '14:30', purpose: 'Yeni ekip üyeleri', status: 'pending', createdAt: now },
      { id: randomUUID(), roomId: 'room-studio', title: 'Sprint retrospektifi', organizer: 'Can Yılmaz', attendees: 12, date: tomorrow, startTime: '10:00', endTime: '11:00', purpose: 'Sprint değerlendirmesi', status: 'confirmed', createdAt: now },
      { id: randomUUID(), roomId: 'room-cove', title: 'Bireysel odak zamanı', organizer: 'Deniz Aksoy', attendees: 1, date: tomorrow, startTime: '14:00', endTime: '15:00', purpose: 'Dokümantasyon çalışması', status: 'confirmed', createdAt: now },
    ],
  };
}

export async function ensureDatabase() {
  await mkdir(dirname(filePath), { recursive: true });
  try {
    await readFile(filePath, 'utf8');
  } catch {
    await writeFile(filePath, JSON.stringify(initialData(), null, 2), 'utf8');
  }
}

export async function readDatabase() {
  await ensureDatabase();
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function writeDatabase(data) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function createId() {
  return randomUUID();
}
