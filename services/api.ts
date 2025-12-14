import { supabase } from '../supabaseClient';
import { Booking, BookingStatus, Room, User, UserRole } from '../types';

export const api = {
  // POST /api/login
  login: async (username: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('status', 'ACTIVE')
      .single();

    if (error) {
      console.error('Login error:', error);
      return null;
    }

    if (data && data.password_hash === password) {
      return {
        id: data.id,
        username: data.username,
        full_name: data.full_name,
        role: data.role as UserRole,
        status: data.status,
      };
    }

    return null;
  },

  rooms: {
    // GET /api/rooms/list
    list: async (): Promise<Room[]> => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_name');

      if (error) {
        console.error('Error fetching rooms:', error);
        return [];
      }

      return data as Room[];
    },

    // POST /api/rooms/create
    create: async (room: Omit<Room, 'id'>): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.from('rooms').insert(room);

      if (error) {
        console.error('Error creating room:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    },

    // PUT /api/rooms/update
    update: async (room: Room): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase
        .from('rooms')
        .update({
          room_name: room.room_name,
          location: room.location,
          capacity: room.capacity,
          equipment: room.equipment,
          status: room.status,
          image_url: room.image_url
        })
        .eq('id', room.id);

      if (error) {
        console.error('Error updating room:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    },

    // DELETE /api/rooms/delete
    delete: async (roomId: string): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.from('rooms').delete().eq('id', roomId);

      if (error) {
        console.error('Error deleting room:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    }
  },

  bookings: {
    // GET /api/bookings/list
    list: async (filters?: { roomId?: string, month?: number, year?: number, status?: string, userId?: string }): Promise<Booking[]> => {
      let query = supabase
        .from('bookings')
        .select(`*, rooms (*), users!user_id (*)`)
        .order('start_datetime', { ascending: true });

      if (filters?.roomId) {
        query = query.eq('room_id', filters.roomId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }

      return data as Booking[];
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
      // Check for overlapping bookings
      const { data: overlaps, error: overlapError } = await supabase
        .from('bookings')
        .select('id')
        .eq('room_id', booking.room_id)
        .neq('status', 'REJECTED')
        .neq('status', 'CANCELLED')
        .lt('start_datetime', booking.end_datetime)
        .gt('end_datetime', booking.start_datetime);

      if (overlapError) {
        console.error('Error checking overlaps:', overlapError);
        return { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบการจอง' };
      }

      if (overlaps && overlaps.length > 0) {
        return { success: false, message: 'ห้องนี้ถูกจองในช่วงเวลานั้นแล้ว' };
      }

      // Create booking
      const { data, error } = await supabase.from('bookings').insert({
        ...booking,
        status: BookingStatus.PENDING
      }).select();

      if (error) {
        console.error('Error creating booking:', error);
        return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างการจอง' };
      }

      // Trigger Email Notification (Non-blocking)
      if (data && data[0]?.id) {
        supabase.functions.invoke('send-notification-email', {
          body: { type: 'NEW_BOOKING', bookingId: data[0].id }
        }).catch(err => console.error('Failed to send notification:', err));
      }

      return { success: true, message: 'ส่งคำขอจองห้องเรียบร้อยแล้ว!' };
    },

    // POST /api/bookings/updateStatus
    updateStatus: async (bookingId: string, status: BookingStatus, approverId: string): Promise<{ success: boolean; error?: string }> => {
      const updateData: any = {
        status,
        approver_id: approverId
      };

      if (status === BookingStatus.APPROVED || status === BookingStatus.REJECTED) {
        updateData.approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'ไม่สามารถบันทึกข้อมูลได้ (อาจเกิดจากสิทธิ์การใช้งาน หรือไม่พบรายการจอง)' };
      }

      // Trigger Email Notification (Non-blocking)
      if (status === BookingStatus.APPROVED || status === BookingStatus.REJECTED) {
        supabase.functions.invoke('send-notification-email', {
          body: { type: 'BOOKING_STATUS_UPDATE', bookingId: bookingId }
        }).catch(err => console.error('Failed to send notification:', err));
      }

      return { success: true };
    },

    // DELETE /api/bookings/delete
    delete: async (bookingId: string): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) {
        console.error('Error deleting booking:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    }
  },

  dashboard: {
    // GET /api/dashboard/summary
    getStats: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, rooms(room_name), users!user_id(full_name)');

      const { data: users } = await supabase
        .from('users')
        .select('id, role')
        .eq('status', 'ACTIVE');

      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('status', 'ACTIVE');

      if (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          totalBookings: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          todayBookings: 0,
          thisMonthBookings: 0,
          totalUsers: 0,
          totalRooms: 0,
          topRooms: [],
          recentBookings: [],
          allBookings: []
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const totalBookings = bookings?.length || 0;
      const pendingCount = bookings?.filter(b => b.status === BookingStatus.PENDING).length || 0;
      const approvedCount = bookings?.filter(b => b.status === BookingStatus.APPROVED).length || 0;
      const rejectedCount = bookings?.filter(b => b.status === BookingStatus.REJECTED).length || 0;

      const todayBookings = bookings?.filter(b => {
        const bookingDate = new Date(b.start_datetime);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
      }).length || 0;

      const thisMonthBookings = bookings?.filter(b => {
        const bookingDate = new Date(b.start_datetime);
        return bookingDate >= startOfMonth;
      }).length || 0;

      // Calculate room statistics
      const roomStats: Record<string, number> = {};
      bookings?.forEach((b: any) => {
        const name = b.rooms?.room_name || 'ไม่ระบุ';
        roomStats[name] = (roomStats[name] || 0) + 1;
      });

      const topRooms = Object.entries(roomStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent bookings (last 5)
      const recentBookings = (bookings || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(b => ({
          id: b.id,
          title: b.title,
          roomName: b.rooms?.room_name || '-',
          userName: b.users?.full_name || '-',
          status: b.status,
          startDatetime: b.start_datetime,
          createdAt: b.created_at
        }));

      return {
        totalBookings,
        pendingCount,
        approvedCount,
        rejectedCount,
        todayBookings,
        thisMonthBookings,
        totalUsers: users?.length || 0,
        totalRooms: rooms?.length || 0,
        topRooms,
        recentBookings,
        allBookings: bookings || []
      };
    }
  }
};