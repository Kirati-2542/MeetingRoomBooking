import { supabase } from '../supabaseClient';
import { Booking, BookingStatus, Room, User, UserRole } from '../types';

// Helper to simulate network delay for realistic UI feedback
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// MOCK DATA for Demo Mode
const MOCK_USERS: User[] = [
  { id: 'mock-admin', username: 'admin', full_name: 'ผู้ดูแลระบบ (Admin)', role: UserRole.ADMIN, status: 'ACTIVE' },
  { id: 'mock-approver', username: 'approver', full_name: 'ผู้อนุมัติ (Approver)', role: UserRole.APPROVER, status: 'ACTIVE' },
  { id: 'mock-user', username: 'user', full_name: 'ผู้ใช้งานทั่วไป (User)', role: UserRole.USER, status: 'ACTIVE' },
];

const MOCK_ROOMS: Room[] = [
  { 
    id: 'r1', 
    room_name: 'ห้องประชุม A', 
    location: 'อาคาร 1', 
    capacity: 10, 
    equipment: 'โปรเจคเตอร์', 
    status: 'ACTIVE',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'r2', 
    room_name: 'ห้องบรรยาย B', 
    location: 'อาคาร 2', 
    capacity: 50, 
    equipment: 'เครื่องเสียง', 
    status: 'ACTIVE',
    image_url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'r3', 
    room_name: 'ห้องประชุมเล็ก C', 
    location: 'อาคาร 1', 
    capacity: 6, 
    equipment: 'ทีวี', 
    status: 'ACTIVE',
    image_url: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=800'
  },
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    room_id: 'r1',
    user_id: 'mock-user',
    title: 'ประชุมทีมประจำสัปดาห์',
    purpose: 'อัปเดตงานรายสัปดาห์',
    start_datetime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    end_datetime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    status: BookingStatus.APPROVED,
    created_at: new Date().toISOString(),
    rooms: MOCK_ROOMS[0],
    users: MOCK_USERS[2]
  },
  {
    id: 'b2',
    room_id: 'r2',
    user_id: 'mock-user',
    title: 'บรรยายพิเศษฟิสิกส์',
    purpose: 'วิชาฟิสิกส์ 101',
    start_datetime: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
    end_datetime: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    status: BookingStatus.PENDING,
    created_at: new Date().toISOString(),
    rooms: MOCK_ROOMS[1],
    users: MOCK_USERS[2]
  }
];

export const api = {
  // POST /api/login
  login: async (username: string, password: string): Promise<User | null> => {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('status', 'ACTIVE')
        .single();

      if (!error && data) {
        // Simple comparison for demo.
        if (data.password_hash === password) {
          return {
            id: data.id,
            username: data.username,
            full_name: data.full_name,
            role: data.role as UserRole,
            status: data.status,
          };
        }
      }
    } catch (e) {
      console.warn("Supabase login failed, attempting mock fallback...");
    }

    // 2. Fallback to Mock Data
    await delay(500); // Simulate network
    if (username === 'admin' && password === 'admin123') return MOCK_USERS[0];
    if (username === 'approver' && password === 'approver123') return MOCK_USERS[1];
    if (username === 'user' && password === 'user123') return MOCK_USERS[2];

    return null;
  },

  rooms: {
    // GET /api/rooms/list
    list: async (): Promise<Room[]> => {
      try {
        const { data, error } = await supabase.from('rooms').select('*').order('room_name');
        if (!error && data && data.length > 0) return data as Room[];
      } catch (e) {}

      return MOCK_ROOMS; // Fallback
    },
    
    // POST /api/rooms/create
    create: async (room: Omit<Room, 'id' | 'created_at'>): Promise<void> => {
      try {
        const { error } = await supabase.from('rooms').insert(room);
        if (error) throw error;
      } catch(e) {
        console.warn("Using mock create room");
        MOCK_ROOMS.push({ ...room, id: Math.random().toString(), status: 'ACTIVE' });
      }
    },

    // PUT /api/rooms/update
    update: async (room: Room): Promise<void> => {
      try {
        const { error } = await supabase.from('rooms').update({
             room_name: room.room_name,
             location: room.location,
             capacity: room.capacity,
             equipment: room.equipment,
             status: room.status,
             image_url: room.image_url
        }).eq('id', room.id);
        if (error) throw error;
      } catch (e) {
        console.warn("Using mock update room");
        const idx = MOCK_ROOMS.findIndex(r => r.id === room.id);
        if (idx !== -1) {
            MOCK_ROOMS[idx] = room;
        }
      }
    },

    // DELETE /api/rooms/delete
    delete: async (roomId: string): Promise<void> => {
        try {
            const { error } = await supabase.from('rooms').delete().eq('id', roomId);
            if(error) throw error;
        } catch(e) {
             console.warn("Using mock delete room");
             const idx = MOCK_ROOMS.findIndex(r => r.id === roomId);
             if (idx !== -1) {
                 MOCK_ROOMS.splice(idx, 1);
             }
        }
    }
  },

  bookings: {
    // GET /api/bookings/list
    list: async (filters?: { roomId?: string, month?: number, year?: number, status?: string }): Promise<Booking[]> => {
      try {
        let query = supabase
          .from('bookings')
          .select(`*, rooms (room_name), users (full_name)`)
          .order('start_datetime', { ascending: true });

        if (filters?.roomId) query = query.eq('room_id', filters.roomId);
        if (filters?.status) query = query.eq('status', filters.status);
        
        const { data, error } = await query;
        if (!error && data) return data as Booking[];
      } catch (e) {}

      // Mock Filtering
      let results = [...MOCK_BOOKINGS];
      if (filters?.roomId) results = results.filter(b => b.room_id === filters.roomId);
      if (filters?.status) results = results.filter(b => b.status === filters.status);
      return results;
    },

    // POST /api/bookings/create
    create: async (booking: {
      room_id: string;
      user_id: string;
      title: string;
      purpose: string;
      start_datetime: string;
      end_datetime: string;
    }): Promise<{ success: boolean; message: string }> => {
      // 1. Check for overlap (Mock logic roughly)
      const hasOverlap = MOCK_BOOKINGS.some(b => 
        b.room_id === booking.room_id &&
        b.status !== BookingStatus.REJECTED &&
        b.status !== BookingStatus.CANCELLED &&
        ((booking.start_datetime >= b.start_datetime && booking.start_datetime < b.end_datetime) ||
         (booking.end_datetime > b.start_datetime && booking.end_datetime <= b.end_datetime))
      );

      // Try Supabase first
      try {
        const { data: overlaps } = await supabase
        .from('bookings')
        .select('id')
        .eq('room_id', booking.room_id)
        .neq('status', 'REJECTED')
        .neq('status', 'CANCELLED')
        .or(`and(start_datetime.lte.${booking.end_datetime},end_datetime.gte.${booking.start_datetime})`);
        
        if (overlaps && overlaps.length > 0) return { success: false, message: 'ห้องนี้ถูกจองในช่วงเวลานั้นแล้ว' };

        const { error } = await supabase.from('bookings').insert({ ...booking, status: BookingStatus.PENDING });
        if (!error) return { success: true, message: 'ส่งคำขอจองห้องเรียบร้อยแล้ว!' };
      } catch (e) {}

      // Mock Fallback
      if (hasOverlap) return { success: false, message: 'ห้องนี้ถูกจองในช่วงเวลานั้นแล้ว (Mock)' };
      
      const newBooking: any = {
        ...booking,
        id: Math.random().toString(),
        status: BookingStatus.PENDING,
        created_at: new Date().toISOString(),
        rooms: MOCK_ROOMS.find(r => r.id === booking.room_id),
        users: MOCK_USERS.find(u => u.id === booking.user_id)
      };
      MOCK_BOOKINGS.push(newBooking);
      return { success: true, message: 'ส่งคำขอจองห้องเรียบร้อยแล้ว (Mock)!' };
    },

    // POST /api/bookings/approve
    updateStatus: async (bookingId: string, status: BookingStatus, approverId: string): Promise<void> => {
      try {
        await supabase.from('bookings').update({ status, approver_id: approverId, approved_at: new Date().toISOString() }).eq('id', bookingId);
      } catch (e) {}

      // Mock Update
      const idx = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
      if (idx !== -1) {
        MOCK_BOOKINGS[idx].status = status;
        if (status === BookingStatus.APPROVED) {
            MOCK_BOOKINGS[idx].approver_id = approverId;
            MOCK_BOOKINGS[idx].approved_at = new Date().toISOString();
        }
      }
    }
  },

  dashboard: {
     // GET /api/dashboard/summary
    getStats: async () => {
      let bookings = MOCK_BOOKINGS;
      try {
          const { data } = await supabase.from('bookings').select('*, rooms(room_name)');
          if (data && data.length > 0) bookings = data;
      } catch(e) {}

      const totalBookings = bookings.length;
      const pendingCount = bookings.filter(b => b.status === BookingStatus.PENDING).length;
      
      const roomStats: Record<string, number> = {};
      bookings.forEach((b: any) => {
        const name = b.rooms?.room_name || 'ไม่ระบุ';
        roomStats[name] = (roomStats[name] || 0) + 1;
      });

      const topRooms = Object.entries(roomStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalBookings,
        pendingCount,
        topRooms,
        allBookings: bookings
      };
    }
  }
};