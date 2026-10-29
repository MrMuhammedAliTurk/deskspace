import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Room, RoomInput, RoomType } from '../types';

interface Props {
  room?: Room | null;
  onClose: () => void;
  onSave: (input: RoomInput) => Promise<unknown>;
}
const roomTypes: RoomType[] = ['Toplantı odası', 'Odak odası', 'Eğitim odası', 'Ortak alan'];

export default function RoomModal({ room, onClose, onSave }: Props) {
  const [name, setName] = useState(room?.name ?? '');
  const [building, setBuilding] = useState(room?.building ?? 'Merkez Ofis');
  const [floor, setFloor] = useState(String(room?.floor ?? 1));
  const [capacity, setCapacity] = useState(String(room?.capacity ?? 6));
  const [type, setType] = useState<RoomType>(room?.type ?? 'Toplantı odası');
  const [equipment, setEquipment] = useState(room?.equipment.join(', ') ?? 'Ekran, Beyaz tahta');
  const [color, setColor] = useState<RoomInput['color']>(room?.color ?? 'violet');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        ...(room ? { id: room.id } : {}), name: name.trim(), building: building.trim(), floor: Number(floor),
        capacity: Number(capacity), type,
        equipment: equipment.split(',').map((item) => item.trim()).filter(Boolean), color,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oda kaydedilemedi.');
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">
        <div className="modal-heading">
          <div><span className="eyebrow">ALAN YÖNETİMİ</span><h2 id="room-modal-title">{room ? 'Odayı düzenle' : 'Yeni oda ekle'}</h2><p>Ofis alanının özelliklerini tanımlayın.</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={20} /></button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={submit}>
          <div className="form-grid">
            <label className="field"><span>Oda adı</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Aurora" minLength={2} required /></label>
            <label className="field"><span>Bina</span><input value={building} onChange={(e) => setBuilding(e.target.value)} required /></label>
            <label className="field"><span>Kat</span><input type="number" min="0" max="200" value={floor} onChange={(e) => setFloor(e.target.value)} required /></label>
            <label className="field"><span>Kapasite (kişi)</span><input type="number" min="1" max="1000" value={capacity} onChange={(e) => setCapacity(e.target.value)} required /></label>
            <label className="field full-field"><span>Oda türü</span><select value={type} onChange={(e) => setType(e.target.value as RoomType)}>{roomTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field full-field"><span>Donanımlar <em>Virgülle ayırın</em></span><input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Ekran, Video konferans, Beyaz tahta" /></label>
            <label className="field full-field"><span>Renk etiketi</span><select value={color} onChange={(e) => setColor(e.target.value as RoomInput['color'])}><option value="violet">Mor</option><option value="blue">Mavi</option><option value="green">Yeşil</option><option value="orange">Turuncu</option><option value="pink">Pembe</option></select></label>
          </div>
          <div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Vazgeç</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Kaydediliyor…' : room ? 'Değişiklikleri kaydet' : 'Oda oluştur'}</button></div>
        </form>
      </section>
    </div>
  );
}
