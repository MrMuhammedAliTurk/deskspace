import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertCircle, Armchair, ArrowDownRight, ArrowUpRight, BarChart3, Bell,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight,
  Clock3, DoorOpen, Filter, LayoutDashboard, ListFilter, MapPin, Monitor,
  MoreHorizontal, Pencil, Plus, Search, Settings, Trash2, Users, Video, Wifi,
  X, CircleHelp, Sparkles, RefreshCcw,
} from 'lucide-react';
import { useDeskSpace } from './hooks/useDeskSpace';
import ReservationModal from './components/ReservationModal';
import RoomModal from './components/RoomModal';
import type { Reservation, ReservationInput, Room, RoomInput } from './types';

 type View = 'dashboard' | 'reservations' | 'rooms' | 'reports';

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const dateLabel = (date: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('tr-TR', options).format(new Date(`${date}T12:00:00`));
const longDate = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
const displayStatus = (status: Reservation['status']) => ({ confirmed: 'Onaylandı', pending: 'Onay bekliyor', cancelled: 'İptal edildi' })[status];
const isSameDay = (reservation: Reservation, date = todayISO()) => reservation.date === date && reservation.status !== 'cancelled';
const isUpcomingReservation = (reservation: Reservation) => {
  if (reservation.status === 'cancelled' || reservation.date < todayISO()) return false;
  if (reservation.date > todayISO()) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [endHour, endMinute] = reservation.endTime.split(':').map(Number);
  return endHour * 60 + endMinute > currentMinutes;
};

function App() {
  const desk = useDeskSpace();
  const [view, setView] = useState<View>('dashboard');
  const [search, setSearch] = useState('');
  const [reservationModal, setReservationModal] = useState<Reservation | null | 'new'>(null);
  const [roomModal, setRoomModal] = useState<Room | null | 'new'>(null);
  const [roomFilter, setRoomFilter] = useState<'all' | 'available' | 'busy'>('all');
  const [reservationFilter, setReservationFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const [menuReservation, setMenuReservation] = useState<string | null>(null);

  const todayReservations = useMemo(() => desk.reservations.filter((item) => isSameDay(item)), [desk.reservations]);
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const currentlyOccupiedIds = new Set(todayReservations.filter((item) => {
    const [startHour, startMinute] = item.startTime.split(':').map(Number);
    const [endHour, endMinute] = item.endTime.split(':').map(Number);
    return currentMinutes >= startHour * 60 + startMinute && currentMinutes < endHour * 60 + endMinute;
  }).map((item) => item.roomId));
  const reservedTodayIds = new Set(todayReservations.map((item) => item.roomId));
  const filteredReservations = desk.reservations.filter((item) => {
    const room = desk.rooms.find((candidate) => candidate.id === item.roomId);
    const term = search.trim().toLocaleLowerCase('tr-TR');
    const matchesText = !term || [item.title, item.organizer, room?.name ?? '', item.purpose].join(' ').toLocaleLowerCase('tr-TR').includes(term);
    const matchesStatus = reservationFilter === 'all' || item.status === reservationFilter;
    return matchesText && matchesStatus;
  }).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const filteredRooms = desk.rooms.filter((room) => {
    const term = search.trim().toLocaleLowerCase('tr-TR');
    const matchesText = !term || [room.name, room.building, room.type, room.equipment.join(' ')].join(' ').toLocaleLowerCase('tr-TR').includes(term);
    const reservedToday = reservedTodayIds.has(room.id);
    return matchesText && (roomFilter === 'all' || (roomFilter === 'busy' ? reservedToday : !reservedToday));
  });

  function notify(message: string, kind: 'success' | 'error' = 'success') {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3600);
  }

  async function saveReservation(input: ReservationInput) {
    if (reservationModal && reservationModal !== 'new') await desk.updateReservation(reservationModal.id, input);
    else await desk.createReservation(input);
    notify(reservationModal && reservationModal !== 'new' ? 'Rezervasyon güncellendi.' : 'Rezervasyon oluşturuldu.');
  }
  async function saveRoom(input: RoomInput) {
    if (roomModal && roomModal !== 'new') await desk.updateRoom(roomModal.id, input);
    else await desk.createRoom(input);
    notify(roomModal && roomModal !== 'new' ? 'Oda bilgileri güncellendi.' : 'Yeni oda eklendi.');
  }
  async function cancelReservation(item: Reservation) {
    if (!window.confirm(`“${item.title}” rezervasyonu iptal edilsin mi?`)) return;
    try { await desk.cancelReservation(item.id); notify('Rezervasyon iptal edildi.'); }
    catch (err) { notify(err instanceof Error ? err.message : 'İşlem tamamlanamadı.', 'error'); }
    setMenuReservation(null);
  }
  async function deleteReservation(item: Reservation) {
    if (!window.confirm(`“${item.title}” rezervasyonu kalıcı olarak silinsin mi?`)) return;
    try { await desk.deleteReservation(item.id); notify('Rezervasyon silindi.'); }
    catch (err) { notify(err instanceof Error ? err.message : 'İşlem tamamlanamadı.', 'error'); }
    setMenuReservation(null);
  }
  async function deleteRoom(room: Room) {
    if (!window.confirm(`${room.name} odası silinsin mi?`)) return;
    try { await desk.deleteRoom(room.id); notify('Oda silindi.'); }
    catch (err) { notify(err instanceof Error ? err.message : 'Oda silinemedi.', 'error'); }
  }

  const pageTitle = ({ dashboard: 'Genel Bakış', reservations: 'Rezervasyonlar', rooms: 'Odalar ve Alanlar', reports: 'Kullanım Raporları' })[view];
  const headingSubtitle = ({ dashboard: 'Çalışma alanınızın bugünkü durumuna göz atın.', reservations: 'Tüm rezervasyonları görüntüleyin ve yönetin.', rooms: 'Ofis alanlarınızı ve oda özelliklerini yönetin.', reports: 'Alan kullanımını ve rezervasyon yoğunluğunu takip edin.' })[view];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" onClick={(e) => { e.preventDefault(); setView('dashboard'); }}>
          <span className="brand-mark"><Armchair size={22} strokeWidth={2.3} /></span>
          <span className="brand-name">deskspace<span>.</span><small>WORKPLACE MANAGER</small></span>
        </a>
        <div className="workspace-switcher">
          <div className="workspace-avatar">N</div>
          <div className="workspace-copy"><strong>Northstar Studio</strong><span>Takım çalışma alanı</span></div>
          <ChevronDown size={16} className="muted" />
        </div>
        <p className="nav-label">ÇALIŞMA ALANI</p>
        <nav className="main-nav" aria-label="Ana menü">
          <button className={view === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setView('dashboard')}><LayoutDashboard size={19} /><span>Genel bakış</span></button>
          <button className={view === 'reservations' ? 'nav-item active' : 'nav-item'} onClick={() => setView('reservations')}><CalendarDays size={19} /><span>Rezervasyonlar</span><span className="nav-count">{todayReservations.length}</span></button>
          <button className={view === 'rooms' ? 'nav-item active' : 'nav-item'} onClick={() => setView('rooms')}><DoorOpen size={19} /><span>Odalar ve alanlar</span></button>
          <button className={view === 'reports' ? 'nav-item active' : 'nav-item'} onClick={() => setView('reports')}><BarChart3 size={19} /><span>Raporlar</span></button>
        </nav>
        <p className="nav-label team-label">YÖNETİM</p>
        <div className="side-info-card">
          <div className="side-info-icon"><Sparkles size={17} /></div>
          <strong>Alanını daha verimli kullan</strong>
          <p>Oda doluluklarını takip et, çakışmaları önle ve ekibine zaman kazandır.</p>
          <button onClick={() => setView('reports')}>Raporlara göz at <ChevronRight size={15} /></button>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => notify('Ayarlar modülü sonraki geliştirme aşamasında.', 'success')}><Settings size={18} /><span>Ayarlar</span></button>
          <button className="nav-item" onClick={() => notify('Yardım merkezi sonraki aşamada eklenecek.', 'success')}><CircleHelp size={18} /><span>Yardım merkezi</span></button>
          <div className="profile-row">
            <div className="profile-avatar">YK</div>
            <div className="profile-copy"><strong>Yönetici Kullanıcı</strong><span>Workspace admin</span></div>
            <MoreHorizontal size={19} className="muted" />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Northstar Studio</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara: oda, toplantı, kişi..." /><kbd>⌘ K</kbd></label>
            <button className="top-icon-btn notification-button" aria-label="Bildirimler" onClick={() => notify('Şu anda yeni bildiriminiz yok.')}><Bell size={19} /><span /></button>
            <div className="top-profile"><div className="profile-avatar small-avatar">YK</div><ChevronDown size={15} className="muted" /></div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><div className="date-kicker"><CalendarDays size={14} /> {longDate}</div><h1>{view === 'dashboard' ? 'Alanınızın kontrolü sizde.' : pageTitle}</h1><p>{headingSubtitle}</p></div>
            <div className="heading-actions"><button className="button button-secondary" onClick={() => void desk.refresh()}><RefreshCcw size={16} /> Yenile</button><button className="button button-primary" onClick={() => setReservationModal('new')}><Plus size={18} /> Yeni rezervasyon</button></div>
          </section>

          {desk.error && <div className="connection-error"><AlertCircle size={18} /><div><strong>Sunucu bağlantısı kurulamadı.</strong><span>{desk.error} API sunucusunun çalıştığından emin olun.</span></div><button onClick={() => void desk.refresh()}>Tekrar dene</button></div>}
          {desk.loading ? <LoadingState /> : (
            <>
              {view === 'dashboard' && <DashboardView rooms={desk.rooms} reservations={desk.reservations} onCreate={() => setReservationModal('new')} onViewReservations={() => setView('reservations')} onOpenRooms={() => setView('rooms')} />}
              {view === 'reservations' && (
                <section className="content-panel reservations-panel">
                  <div className="panel-header"><div><h2>Tüm rezervasyonlar <span className="count-pill">{filteredReservations.length}</span></h2><p>Oda takvimini ve toplantı ayrıntılarını tek yerden yönetin.</p></div><div className="panel-tools"><label className="filter-select"><ListFilter size={16} /><select value={reservationFilter} onChange={(e) => setReservationFilter(e.target.value as typeof reservationFilter)}><option value="all">Tüm durumlar</option><option value="confirmed">Onaylandı</option><option value="pending">Onay bekliyor</option><option value="cancelled">İptal edildi</option></select></label><button className="button button-primary button-compact" onClick={() => setReservationModal('new')}><Plus size={16} /> Rezervasyon ekle</button></div></div>
                  <ReservationsTable reservations={filteredReservations} rooms={desk.rooms} onEdit={(item) => setReservationModal(item)} onCancel={cancelReservation} onDelete={deleteReservation} menuReservation={menuReservation} setMenuReservation={setMenuReservation} />
                </section>
              )}
              {view === 'rooms' && (
                <section className="rooms-page-section">
                  <div className="rooms-toolbar"><div><h2>Çalışma alanları <span className="count-pill">{filteredRooms.length}</span></h2><p>İhtiyacınıza uygun odayı bulun ve ayrıntılarını yönetin.</p></div><div className="panel-tools"><label className="filter-select"><Filter size={16} /><select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value as typeof roomFilter)}><option value="all">Tüm odalar</option><option value="available">Boş odalar</option><option value="busy">Bugün rezerve</option></select></label><button className="button button-primary button-compact" onClick={() => setRoomModal('new')}><Plus size={16} /> Oda ekle</button></div></div>
                  {filteredRooms.length ? <div className="rooms-grid large-grid">{filteredRooms.map((room) => <RoomCard key={room.id} room={room} busy={currentlyOccupiedIds.has(room.id)} reservations={desk.reservations.filter((item) => item.roomId === room.id && item.status !== 'cancelled')} onEdit={() => setRoomModal(room)} onDelete={() => void deleteRoom(room)} />)}</div> : <EmptyState title="Eşleşen oda bulunamadı" description="Aramanızı veya filtre seçiminizi değiştirmeyi deneyin." />}
                </section>
              )}
              {view === 'reports' && <ReportsView rooms={desk.rooms} reservations={desk.reservations} />}
            </>
          )}
          <footer className="page-footer"><span>© 2026 DeskSpace</span><span><span className="online-dot" /> Sistem çalışıyor</span><span>Çalışma alanınız, daha akıllı.</span></footer>
        </div>
      </main>

      {reservationModal && <ReservationModal rooms={desk.rooms} reservation={reservationModal === 'new' ? null : reservationModal} onClose={() => setReservationModal(null)} onSave={saveReservation} />}
      {roomModal && <RoomModal room={roomModal === 'new' ? null : roomModal} onClose={() => setRoomModal(null)} onSave={saveRoom} />}
      {toast && <div className={`toast ${toast.kind}`} role="status"><span className="toast-icon">{toast.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</span>{toast.message}<button onClick={() => setToast(null)} aria-label="Bildirimi kapat"><X size={16} /></button></div>}
    </div>
  );
}

function LoadingState() {
  return <div className="loading-state"><span className="spinner" /><strong>Çalışma alanınız hazırlanıyor…</strong><p>Odalar ve rezervasyonlar yükleniyor.</p></div>;
}

function DashboardView({ rooms, reservations, onCreate, onViewReservations, onOpenRooms }: {
  rooms: Room[]; reservations: Reservation[]; onCreate: () => void; onViewReservations: () => void; onOpenRooms: () => void;
}) {
  const today = reservations.filter((item) => isSameDay(item));
  const future = reservations.filter(isUpcomingReservation).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const occupiedNow = new Set(today.filter((item) => {
    const now = new Date(); const current = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = item.startTime.split(':').map(Number); const [eh, em] = item.endTime.split(':').map(Number);
    return current >= sh * 60 + sm && current < eh * 60 + em;
  }).map((item) => item.roomId));
  const utilization = rooms.length ? Math.round((occupiedNow.size / rooms.length) * 100) : 0;
  const confirmed = today.filter((item) => item.status === 'confirmed').length;
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() + index - ((day + 6) % 7));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { key, label: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(d).replace('.', ''), number: d.getDate(), count: reservations.filter((item) => item.date === key && item.status !== 'cancelled').length };
  });
  const maxCount = Math.max(3, ...weekDays.map((day) => day.count));

  return <>
    <section className="stats-grid">
      <StatCard icon={<CalendarDays size={19} />} iconColor="purple" label="Bugünkü rezervasyon" value={String(today.length).padStart(2, '0')} trend={`${confirmed} onaylandı`} trendIcon={<ArrowUpRight size={14} />} detail="Günlük plan" />
      <StatCard icon={<DoorOpen size={19} />} iconColor="green" label="Şu an müsait oda" value={String(Math.max(0, rooms.length - occupiedNow.size)).padStart(2, '0')} trend={`${occupiedNow.size} oda kullanımda`} trendIcon={<Check size={14} />} detail={`${rooms.length} toplam oda`} />
      <StatCard icon={<Users size={19} />} iconColor="orange" label="Bugünkü katılımcı" value={String(today.reduce((sum, item) => sum + item.attendees, 0)).padStart(2, '0')} trend="Planlanan katılım" trendIcon={<ArrowUpRight size={14} />} detail="Tüm toplantılar" />
      <StatCard icon={<BarChart3 size={19} />} iconColor="blue" label="Anlık doluluk" value={`${utilization}%`} trend={utilization > 70 ? 'Yoğun kullanım' : 'İyi durumda'} trendIcon={utilization > 70 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} detail="Şu anki oda kullanımı" />
    </section>

    <div className="dashboard-main-grid">
      <section className="content-panel weekly-panel">
        <div className="panel-header"><div><h2>Haftalık kullanım</h2><p>Bu haftanın rezervasyon yoğunluğu</p></div><button className="select-like" onClick={onViewReservations}>Rezervasyonları gör <ChevronRight size={15} /></button></div>
        <div className="chart-summary"><div><strong>{reservations.filter((item) => item.status !== 'cancelled' && item.date >= weekDays[0].key && item.date <= weekDays[6].key).length}</strong><span>rezervasyon</span></div><div className="chart-key"><span /> Rezervasyonlar</div></div>
        <div className="weekly-chart" aria-label="Haftalık rezervasyon yoğunluğu grafiği">
          {weekDays.map((day) => <div className="chart-day" key={day.key}><div className="bar-area"><div className={`chart-bar ${day.key === todayISO() ? 'today-bar' : ''}`} style={{ height: `${Math.max(5, (day.count / maxCount) * 100)}%` }} title={`${day.count} rezervasyon`}><span>{day.count || ''}</span></div></div><span className="chart-day-label">{day.label}</span><span className={`chart-day-number ${day.key === todayISO() ? 'current-day-number' : ''}`}>{day.number}</span></div>)}
        </div>
      </section>
      <section className="content-panel today-panel">
        <div className="panel-header"><div><h2>Yaklaşan rezervasyonlar</h2><p>Ajandanızdaki sıradaki toplantılar</p></div><button className="icon-button light-icon" onClick={onViewReservations} aria-label="Tüm rezervasyonlar"><MoreHorizontal size={20} /></button></div>
        <div className="upcoming-list">
          {future.slice(0, 4).map((item, index) => {
            const room = rooms.find((candidate) => candidate.id === item.roomId);
            return <div className="upcoming-item" key={item.id}><div className={`upcoming-marker marker-${index % 4}`}><CalendarDays size={17} /></div><div className="upcoming-copy"><strong>{item.title}</strong><span><Clock3 size={13} /> {dateLabel(item.date, { day: 'numeric', month: 'short' })} · {item.startTime}–{item.endTime}</span><span><MapPin size={13} /> {room?.name ?? 'Oda silinmiş'}</span></div><span className={`status-dot ${item.status}`} title={displayStatus(item.status)} /></div>;
          })}
          {future.length === 0 && <EmptyMini text="Henüz planlanmış rezervasyon yok." />}
        </div>
        <button className="panel-bottom-link" onClick={onCreate}><Plus size={16} /> Yeni rezervasyon oluştur</button>
      </section>
    </div>

    <section className="room-section">
      <div className="section-heading"><div><h2>Çalışma alanları</h2><p>Ofis alanlarının genel durumu</p></div><button className="select-like" onClick={onOpenRooms}>Tüm odalar <ChevronRight size={15} /></button></div>
      <div className="rooms-grid">{rooms.slice(0, 3).map((room) => <RoomCard key={room.id} room={room} busy={occupiedNow.has(room.id)} reservations={reservations.filter((item) => item.roomId === room.id && item.status !== 'cancelled')} />)}</div>
      {rooms.length === 0 && <EmptyState title="Henüz oda eklenmemiş" description="Başlamak için ilk çalışma alanınızı oluşturun." />}
    </section>
  </>;
}

function StatCard({ icon, iconColor, label, value, trend, trendIcon, detail }: {
  icon: ReactNode; iconColor: string; label: string; value: string; trend: string; trendIcon: ReactNode; detail: string;
}) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${iconColor}`}>{icon}</span><button className="more-button" aria-label={`${label} ayrıntıları`}><MoreHorizontal size={19} /></button></div><p className="stat-label">{label}</p><div className="stat-value-row"><strong>{value}</strong><span className="stat-detail">{detail}</span></div><div className="stat-trend">{trendIcon}<span>{trend}</span></div></article>;
}

function RoomCard({ room, busy, reservations, onEdit, onDelete }: {
  room: Room; busy: boolean; reservations: Reservation[]; onEdit?: () => void; onDelete?: () => void;
}) {
  const next = reservations.filter(isUpcomingReservation).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0];
  const EquipmentIcon = room.equipment.some((item) => item.toLocaleLowerCase('tr-TR').includes('video')) ? Video : Monitor;
  return <article className="room-card">
    <div className={`room-illustration ${room.color}`}><div className="room-art-grid" /><div className="room-art-window" /><div className="room-art-table" /><div className="room-art-seat seat-one" /><div className="room-art-seat seat-two" /><div className="room-art-seat seat-three" /><div className="room-art-lamp" /><div className="room-art-plant" /><span className="room-type-pill">{room.type}</span><span className={`room-live-status ${busy ? 'busy' : 'available'}`}><span />{busy ? 'Kullanımda' : 'Müsait'}</span>{onEdit && <button className="room-edit-btn" onClick={onEdit} aria-label={`${room.name} odasını düzenle`}><Pencil size={14} /></button>}</div>
    <div className="room-card-body"><div className="room-title-row"><div><h3>{room.name}</h3><span className="room-location"><MapPin size={13} /> {room.building} · {room.floor}. kat</span></div>{onDelete && <button className="subtle-icon" onClick={onDelete} aria-label={`${room.name} odasını sil`}><Trash2 size={15} /></button>}</div>
      <div className="room-meta"><span><Users size={15} /> {room.capacity} kişi</span><span><EquipmentIcon size={15} /> {room.equipment.length} donanım</span><span><Wifi size={15} /> Wi-Fi</span></div>
      <div className="room-card-footer"><div className="equipment-chips">{room.equipment.slice(0, 2).map((item) => <span key={item}>{item}</span>)}{room.equipment.length > 2 && <span>+{room.equipment.length - 2}</span>}</div><span className="next-reservation">{next ? `${next.startTime} · ${dateLabel(next.date, { day: 'numeric', month: 'short' })}` : 'Plan yok'}</span></div>
    </div>
  </article>;
}

function ReservationsTable({ reservations, rooms, onEdit, onCancel, onDelete, menuReservation, setMenuReservation }: {
  reservations: Reservation[]; rooms: Room[]; onEdit: (item: Reservation) => void; onCancel: (item: Reservation) => void; onDelete: (item: Reservation) => void; menuReservation: string | null; setMenuReservation: (id: string | null) => void;
}) {
  if (reservations.length === 0) return <EmptyState title="Rezervasyon bulunamadı" description="Aramanızı veya durum filtrenizi değiştirebilirsiniz." />;
  return <div className="table-wrap"><table className="reservation-table"><thead><tr><th>TOPLANTI</th><th>ODA</th><th>TARİH & SAAT</th><th>ORGANİZATÖR</th><th>KATILIMCI</th><th>DURUM</th><th /></tr></thead><tbody>
    {reservations.map((item) => {
      const room = rooms.find((candidate) => candidate.id === item.roomId);
      return <tr key={item.id}><td><div className="meeting-cell"><span className={`meeting-symbol ${room?.color ?? 'blue'}`}><CalendarDays size={17} /></span><span><strong>{item.title}</strong><small>{item.purpose || 'Açıklama eklenmedi'}</small></span></div></td><td><span className="room-name-cell">{room?.name ?? 'Oda bulunamadı'}</span><small className="table-subline">{room?.building ?? ''}</small></td><td><strong>{dateLabel(item.date, { day: 'numeric', month: 'short', year: 'numeric' })}</strong><small className="table-subline">{item.startTime} – {item.endTime}</small></td><td>{item.organizer}</td><td><span className="attendee-count"><Users size={14} /> {item.attendees}</span></td><td><span className={`status-pill ${item.status}`}><span />{displayStatus(item.status)}</span></td><td className="action-cell"><div className="row-actions"><button className="subtle-icon" onClick={() => onEdit(item)} aria-label="Rezervasyonu düzenle" title="Düzenle"><Pencil size={15} /></button><div className="menu-wrap"><button className="subtle-icon" onClick={() => setMenuReservation(menuReservation === item.id ? null : item.id)} aria-label="Diğer işlemler"><MoreHorizontal size={18} /></button>{menuReservation === item.id && <><button className="menu-dismiss" onClick={() => setMenuReservation(null)} aria-label="Menüyü kapat" /><div className="row-menu"><button onClick={() => onEdit(item)}><Pencil size={14} /> Düzenle</button>{item.status !== 'cancelled' && <button onClick={() => onCancel(item)}><X size={14} /> İptal et</button>}<button className="danger-text" onClick={() => onDelete(item)}><Trash2 size={14} /> Sil</button></div></>}</div></div></td></tr>;
    })}
  </tbody></table></div>;
}

function ReportsView({ rooms, reservations }: { rooms: Room[]; reservations: Reservation[] }) {
  const active = reservations.filter((item) => item.status !== 'cancelled');
  const byRoom = rooms.map((room) => ({ room, count: active.filter((item) => item.roomId === room.id).length })).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...byRoom.map((item) => item.count));
  const byStatus = [
    { key: 'confirmed', label: 'Onaylandı', count: reservations.filter((item) => item.status === 'confirmed').length },
    { key: 'pending', label: 'Onay bekliyor', count: reservations.filter((item) => item.status === 'pending').length },
    { key: 'cancelled', label: 'İptal edildi', count: reservations.filter((item) => item.status === 'cancelled').length },
  ];
  const totalCapacity = rooms.reduce((sum, item) => sum + item.capacity, 0);
  return <div className="reports-page"><div className="stats-grid report-stats"><StatCard icon={<CalendarDays size={19} />} iconColor="purple" label="Toplam rezervasyon" value={String(reservations.length)} trend="Kayıtlı tüm zamanlar" trendIcon={<ArrowUpRight size={14} />} detail="Tüm kayıtlar" /><StatCard icon={<DoorOpen size={19} />} iconColor="green" label="Tanımlı oda" value={String(rooms.length)} trend={`${totalCapacity} kişilik toplam kapasite`} trendIcon={<Check size={14} />} detail="Aktif alanlar" /><StatCard icon={<CheckCircle2 size={19} />} iconColor="blue" label="Onaylanan oranı" value={`${reservations.length ? Math.round((byStatus[0].count / reservations.length) * 100) : 0}%`} trend={`${byStatus[0].count} onaylı`} trendIcon={<ArrowUpRight size={14} />} detail="Tüm rezervasyonlar" /><StatCard icon={<Users size={19} />} iconColor="orange" label="Planlanan katılımcı" value={String(active.reduce((sum, item) => sum + item.attendees, 0))} trend="İptal edilenler hariç" trendIcon={<ArrowUpRight size={14} />} detail="Katılımcı sayısı toplamı" /></div>
    <div className="reports-grid"><section className="content-panel report-panel"><div className="panel-header"><div><h2>Oda kullanım sıralaması</h2><p>Rezervasyon sayısına göre dağılım</p></div></div><div className="bar-list">{byRoom.map(({ room, count }) => <div className="bar-list-item" key={room.id}><div className={`mini-room-symbol ${room.color}`}><DoorOpen size={16} /></div><div className="bar-list-info"><div><strong>{room.name}</strong><span>{count} rezervasyon</span></div><div className="horizontal-track"><span style={{ width: `${(count / max) * 100}%` }} /></div></div></div>)}{byRoom.length === 0 && <EmptyMini text="Rapor oluşturmak için oda ekleyin." />}</div></section>
      <section className="content-panel report-panel"><div className="panel-header"><div><h2>Rezervasyon durumları</h2><p>Mevcut kayıtların genel durumu</p></div></div><div className="status-report-list">{byStatus.map((item) => <div className="status-report-row" key={item.key}><span className={`status-swatch ${item.key}`} /><span>{item.label}</span><strong>{item.count}</strong><span className="status-report-percent">{reservations.length ? Math.round((item.count / reservations.length) * 100) : 0}%</span></div>)}</div><div className="report-note"><Sparkles size={17} /><span>Bu rapor, uygulamadaki mevcut rezervasyon kayıtlarından anlık olarak hesaplanır.</span></div></section></div>
  </div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span className="empty-icon"><CalendarDays size={22} /></span><strong>{title}</strong><p>{description}</p></div>;
}
function EmptyMini({ text }: { text: string }) { return <div className="empty-mini">{text}</div>; }

export default App;
