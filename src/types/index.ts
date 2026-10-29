export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled';
export type RoomType = 'Toplantı odası' | 'Odak odası' | 'Eğitim odası' | 'Ortak alan';

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  equipment: string[];
  color: 'violet' | 'blue' | 'green' | 'orange' | 'pink';
}

export interface Reservation {
  id: string;
  roomId: string;
  title: string;
  organizer: string;
  attendees: number;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: ReservationStatus;
  createdAt: string;
}

export type ReservationInput = Omit<Reservation, 'id' | 'createdAt' | 'status'> & {
  id?: string;
  status?: ReservationStatus;
};

export type RoomInput = Omit<Room, 'id'> & { id?: string };

export interface ApiError {
  error: string;
  details?: string[];
}
