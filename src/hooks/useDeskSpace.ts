import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Reservation, ReservationInput, Room, RoomInput } from '../types';

export function useDeskSpace() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [roomData, reservationData] = await Promise.all([api.getRooms(), api.getReservations()]);
      setRooms(roomData);
      setReservations(reservationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenemedi.');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [roomData, reservationData] = await Promise.all([api.getRooms(), api.getReservations()]);
        if (alive) {
          setRooms(roomData);
          setReservations(reservationData);
          setError(null);
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Sunucuya bağlanılamadı.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => { alive = false; };
  }, []);

  const createReservation = async (input: ReservationInput) => {
    const created = await api.createReservation(input);
    setReservations((current) => [...current, created]);
    return created;
  };

  const updateReservation = async (id: string, input: ReservationInput) => {
    const updated = await api.updateReservation(id, input);
    setReservations((current) => current.map((item) => item.id === id ? updated : item));
    return updated;
  };

  const cancelReservation = async (id: string) => {
    const updated = await api.cancelReservation(id);
    setReservations((current) => current.map((item) => item.id === id ? updated : item));
    return updated;
  };

  const deleteReservation = async (id: string) => {
    await api.deleteReservation(id);
    setReservations((current) => current.filter((item) => item.id !== id));
  };

  const createRoom = async (input: RoomInput) => {
    const created = await api.createRoom(input);
    setRooms((current) => [...current, created]);
    return created;
  };

  const updateRoom = async (id: string, input: RoomInput) => {
    const updated = await api.updateRoom(id, input);
    setRooms((current) => current.map((room) => room.id === id ? updated : room));
    return updated;
  };

  const deleteRoom = async (id: string) => {
    await api.deleteRoom(id);
    setRooms((current) => current.filter((room) => room.id !== id));
  };

  return {
    rooms, reservations, loading, error, refresh,
    createReservation, updateReservation, cancelReservation, deleteReservation,
    createRoom, updateRoom, deleteRoom,
  };
}
