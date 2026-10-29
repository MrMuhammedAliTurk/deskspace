export function timeToMinutes(time) {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateReservation(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return ['Rezervasyon bilgileri geçersiz.'];
  if (typeof input.roomId !== 'string' || !input.roomId.trim()) errors.push('Bir oda seçmelisiniz.');
  if (typeof input.title !== 'string' || input.title.trim().length < 3) errors.push('Rezervasyon başlığı en az 3 karakter olmalıdır.');
  if (typeof input.organizer !== 'string' || input.organizer.trim().length < 2) errors.push('Rezervasyon sahibi en az 2 karakter olmalıdır.');
  if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.push('Geçerli bir tarih seçmelisiniz.');
  } else {
    const [year, month, day] = input.date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) errors.push('Geçerli bir tarih seçmelisiniz.');
  }
  const start = timeToMinutes(input.startTime);
  const end = timeToMinutes(input.endTime);
  if (start === null || end === null) errors.push('Başlangıç ve bitiş saatleri geçerli olmalıdır.');
  else if (end <= start) errors.push('Bitiş saati başlangıç saatinden sonra olmalıdır.');
  if (!Number.isInteger(input.attendees) || input.attendees < 1) errors.push('Katılımcı sayısı en az 1 olmalıdır.');
  if (typeof input.purpose !== 'string') errors.push('Kullanım amacı metin olmalıdır.');
  return errors;
}

export function hasTimeConflict(candidate, reservations, excludeId = null) {
  const candidateStart = timeToMinutes(candidate.startTime);
  const candidateEnd = timeToMinutes(candidate.endTime);
  if (candidateStart === null || candidateEnd === null) return false;
  return reservations.some((item) => {
    if (item.id === excludeId || item.status === 'cancelled') return false;
    if (item.roomId !== candidate.roomId || item.date !== candidate.date) return false;
    const itemStart = timeToMinutes(item.startTime);
    const itemEnd = timeToMinutes(item.endTime);
    if (itemStart === null || itemEnd === null) return false;
    return candidateStart < itemEnd && candidateEnd > itemStart;
  });
}

export function validateRoom(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return ['Oda bilgileri geçersiz.'];
  if (typeof input.name !== 'string' || input.name.trim().length < 2) errors.push('Oda adı en az 2 karakter olmalıdır.');
  if (typeof input.building !== 'string' || input.building.trim().length < 2) errors.push('Bina adı gereklidir.');
  if (!Number.isInteger(input.floor) || input.floor < 0 || input.floor > 200) errors.push('Kat değeri 0 ile 200 arasında bir tam sayı olmalıdır.');
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 1000) errors.push('Kapasite 1 ile 1000 arasında olmalıdır.');
  const roomTypes = ['Toplantı odası', 'Odak odası', 'Eğitim odası', 'Ortak alan'];
  if (!roomTypes.includes(input.type)) errors.push('Geçerli bir oda türü seçmelisiniz.');
  if (!Array.isArray(input.equipment) || input.equipment.some((item) => typeof item !== 'string')) errors.push('Donanım listesi geçersiz.');
  if (!['violet', 'blue', 'green', 'orange', 'pink'].includes(input.color)) errors.push('Oda rengi geçersiz.');
  return errors;
}
