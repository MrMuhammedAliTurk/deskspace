import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Clock3, Users, X } from 'lucide-react';
import type { Reservation, ReservationInput, Room } from '../types';

interface Props {
  rooms: Room[];
  reservation?: Reservation | null;
  onClose: () => void;
  onSave: (input: ReservationInput) => Promise<unknown>;
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function ReservationModal({ rooms, reservation, onClose, onSave }: Props) {
  const [title, setTitle] = useState(reservation?.title ?? '');
  const [roomId, setRoomId] = useState(reservation?.roomId ?? rooms[0]?.id ?? '');
  const [organizer, setOrganizer] = useState(reservation?.organizer ?? '');
  const [date, setDate] = useState(reservation?.date ?? localToday());
  const [startTime, setStartTime] = useState(reservation?.startTime ?? '10:00');
  const [endTime, setEndTime] = useState(reservation?.endTime ?? '11:00');
  const [attendees, setAttendees] = useState(String(reservation?.attendees ?? 4));
  const [purpose, setPurpose] = useState(reservation?.purpose ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const selectedRoom = rooms.find((room) => room.id === roomId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!roomId) { setError('Önce bir oda oluşturmalısınız.'); return; }
    setSaving(true);
    try {
      await onSave({
        ...(reservation ? { id: reservation.id } : {}),
        roomId, title: title.trim(), organizer: organizer.trim(), date,
        startTime, endTime, attendees: Number(attendees), purpose: purpose.trim(),
        status: reservation?.status === 'pending' ? 'pending' : 'confirmed',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervasyon kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card reservation-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-modal-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">ALAN YÖNETİMİ</span>
            <h2 id="reservation-modal-title">{reservation ? 'Rezervasyonu düzenle' : 'Yeni rezervasyon'}</h2>
            <p>Toplantınız için uygun alanı ve zaman aralığını seçin.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={20} /></button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="form-stack">
          <label className="field full-field">
            <span>Toplantı başlığı</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Ürün yol haritası" minLength={3} required autoFocus />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Toplantı odası</span>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                {rooms.length === 0 && <option value="">Önce oda ekleyin</option>}
                {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.capacity} kişi</option>)}
              </select>
              {selectedRoom && <small>{selectedRoom.building} · {selectedRoom.floor}. kat · Kapasite {selectedRoom.capacity}</small>}
            </label>
            <label className="field">
              <span>Organizatör</span>
              <input value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="Ad Soyad" minLength={2} required />
            </label>
          </div>
          <label className="field full-field">
            <span>Tarih</span>
            <div className="input-icon"><CalendarDays size={17} /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={reservation && reservation.date < localToday() ? reservation.date : localToday()} required /></div>
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Başlangıç saati</span>
              <div className="input-icon"><Clock3 size={17} /><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></div>
            </label>
            <label className="field">
              <span>Bitiş saati</span>
              <div className="input-icon"><Clock3 size={17} /><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></div>
            </label>
          </div>
          <label className="field full-field">
            <span>Katılımcı sayısı</span>
            <div className="input-icon"><Users size={17} /><input type="number" min="1" max={selectedRoom?.capacity ?? 1000} value={attendees} onChange={(e) => setAttendees(e.target.value)} required /></div>
            {selectedRoom && <small>Bu oda en fazla {selectedRoom.capacity} kişiyi ağırlayabilir.</small>}
          </label>
          <label className="field full-field">
            <span>Toplantı amacı <em>İsteğe bağlı</em></span>
            <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Toplantı gündemi veya ek notlar..." />
          </label>
          <div className="modal-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>Vazgeç</button>
            <button type="submit" className="button button-primary" disabled={saving || rooms.length === 0}>{saving ? 'Kaydediliyor…' : reservation ? 'Değişiklikleri kaydet' : 'Rezervasyon oluştur'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
