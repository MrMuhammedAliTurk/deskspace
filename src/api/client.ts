import type { ApiError, Reservation, ReservationInput, Room, RoomInput } from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `İstek başarısız oldu (${response.status}).`;
    try {
      const body = (await response.json()) as ApiError;
      message = body.error || message;
    } catch {
      // Sunucu JSON dışında bir yanıt verirse genel hata mesajını kullan.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  health: () => request<{ status: string; service: string }>('/api/health'),
  getRooms: () => request<Room[]>('/api/rooms'),
  createRoom: (input: RoomInput) => request<Room>('/api/rooms', { method: 'POST', body: JSON.stringify(input) }),
  updateRoom: (id: string, input: RoomInput) => request<Room>(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteRoom: (id: string) => request<void>(`/api/rooms/${id}`, { method: 'DELETE' }),
  getReservations: () => request<Reservation[]>('/api/reservations'),
  createReservation: (input: ReservationInput) => request<Reservation>('/api/reservations', { method: 'POST', body: JSON.stringify(input) }),
  updateReservation: (id: string, input: ReservationInput) => request<Reservation>(`/api/reservations/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  cancelReservation: (id: string) => request<Reservation>(`/api/reservations/${id}/cancel`, { method: 'PATCH' }),
  deleteReservation: (id: string) => request<void>(`/api/reservations/${id}`, { method: 'DELETE' }),
};
