import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createId, ensureDatabase, readDatabase, writeDatabase } from './store.js';
import { hasTimeConflict, validateReservation, validateRoom } from './domain.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = resolve(PROJECT_ROOT, 'dist');
const INDEX_FILE = resolve(DIST_DIR, 'index.html');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'DeskSpace API' }));

app.get('/api/rooms', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.rooms);
  } catch (error) { next(error); }
});

app.post('/api/rooms', async (req, res, next) => {
  try {
    const errors = validateRoom(req.body);
    if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
    const db = await readDatabase();
    const room = { ...req.body, id: createId(), name: req.body.name.trim(), building: req.body.building.trim() };
    db.rooms.push(room);
    await writeDatabase(db);
    return res.status(201).json(room);
  } catch (error) { return next(error); }
});

app.put('/api/rooms/:id', async (req, res, next) => {
  try {
    const errors = validateRoom(req.body);
    if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
    const db = await readDatabase();
    const index = db.rooms.findIndex((room) => room.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Oda bulunamadı.' });
    const room = { ...req.body, id: req.params.id, name: req.body.name.trim(), building: req.body.building.trim() };
    db.rooms[index] = room;
    await writeDatabase(db);
    return res.json(room);
  } catch (error) { return next(error); }
});

app.delete('/api/rooms/:id', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const room = db.rooms.find((item) => item.id === req.params.id);
    if (!room) return res.status(404).json({ error: 'Oda bulunamadı.' });
    const hasReservations = db.reservations.some((item) => item.roomId === room.id && item.status !== 'cancelled');
    if (hasReservations) return res.status(409).json({ error: 'Bu odaya bağlı iptal edilmemiş rezervasyon kayıtları var. Önce rezervasyonları iptal edin.' });
    db.rooms = db.rooms.filter((item) => item.id !== room.id);
    await writeDatabase(db);
    return res.status(204).end();
  } catch (error) { return next(error); }
});

app.get('/api/reservations', async (req, res, next) => {
  try {
    const db = await readDatabase();
    let rows = db.reservations;
    if (typeof req.query.date === 'string' && req.query.date) rows = rows.filter((item) => item.date === req.query.date);
    if (typeof req.query.roomId === 'string' && req.query.roomId) rows = rows.filter((item) => item.roomId === req.query.roomId);
    res.json(rows.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)));
  } catch (error) { next(error); }
});

app.post('/api/reservations', async (req, res, next) => {
  try {
    const errors = validateReservation(req.body);
    if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
    const db = await readDatabase();
    const room = db.rooms.find((item) => item.id === req.body.roomId);
    if (!room) return res.status(404).json({ error: 'Seçilen oda bulunamadı.' });
    if (req.body.attendees > room.capacity) return res.status(400).json({ error: `Bu odanın kapasitesi ${room.capacity} kişi.` });
    if (hasTimeConflict(req.body, db.reservations)) return res.status(409).json({ error: 'Bu zaman aralığında oda zaten rezerve edilmiş. Başka bir saat seçin.' });
    const reservation = {
      ...req.body,
      id: createId(),
      title: req.body.title.trim(),
      organizer: req.body.organizer.trim(),
      purpose: req.body.purpose.trim(),
      status: req.body.status === 'pending' ? 'pending' : 'confirmed',
      createdAt: new Date().toISOString(),
    };
    db.reservations.push(reservation);
    await writeDatabase(db);
    return res.status(201).json(reservation);
  } catch (error) { return next(error); }
});

app.put('/api/reservations/:id', async (req, res, next) => {
  try {
    const errors = validateReservation(req.body);
    if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
    const db = await readDatabase();
    const index = db.reservations.findIndex((item) => item.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Rezervasyon bulunamadı.' });
    const room = db.rooms.find((item) => item.id === req.body.roomId);
    if (!room) return res.status(404).json({ error: 'Seçilen oda bulunamadı.' });
    if (req.body.attendees > room.capacity) return res.status(400).json({ error: `Bu odanın kapasitesi ${room.capacity} kişi.` });
    if (hasTimeConflict(req.body, db.reservations, req.params.id)) return res.status(409).json({ error: 'Bu zaman aralığında oda zaten rezerve edilmiş. Başka bir saat seçin.' });
    const previous = db.reservations[index];
    const updated = {
      ...previous,
      ...req.body,
      id: previous.id,
      title: req.body.title.trim(),
      organizer: req.body.organizer.trim(),
      purpose: req.body.purpose.trim(),
      status: previous.status === 'cancelled' ? 'cancelled' : (req.body.status === 'pending' ? 'pending' : 'confirmed'),
      createdAt: previous.createdAt,
    };
    db.reservations[index] = updated;
    await writeDatabase(db);
    return res.json(updated);
  } catch (error) { return next(error); }
});

app.patch('/api/reservations/:id/cancel', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const reservation = db.reservations.find((item) => item.id === req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Rezervasyon bulunamadı.' });
    reservation.status = 'cancelled';
    await writeDatabase(db);
    return res.json(reservation);
  } catch (error) { return next(error); }
});

app.delete('/api/reservations/:id', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const exists = db.reservations.some((item) => item.id === req.params.id);
    if (!exists) return res.status(404).json({ error: 'Rezervasyon bulunamadı.' });
    db.reservations = db.reservations.filter((item) => item.id !== req.params.id);
    await writeDatabase(db);
    return res.status(204).end();
  } catch (error) { return next(error); }
});

// Build edilmiş React uygulamasını aynı Express sunucusundan yayınla.
// Geliştirme ortamında frontend Vite (5173), API ise Express (3000) üzerinden çalışır.
if (existsSync(INDEX_FILE)) {
  app.use(express.static(DIST_DIR, { index: false }));
}

// Bilinmeyen API adresleri SPA fallback'e düşmesin; JSON 404 dönsün.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API uç noktası bulunamadı.' });
});

// React Router ileride eklense de istemci tarafı yollar index.html ile açılabilsin.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return next();

  if (!existsSync(INDEX_FILE)) {
    return res.status(404).send('DeskSpace arayüzü bulunamadı. Önce npm run build komutunu çalıştırın.');
  }

  return res.sendFile(INDEX_FILE, (error) => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Sunucuda beklenmeyen bir hata oluştu.' });
});

await ensureDatabase();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DeskSpace sunucusu ${PORT} portunda çalışıyor.`);
  if (existsSync(INDEX_FILE)) {
    console.log('Web arayüzü Express üzerinden yayınlanıyor.');
  } else {
    console.log('Geliştirme modu: Web arayüzü Vite üzerinden yayınlanmalıdır.');
  }
});
