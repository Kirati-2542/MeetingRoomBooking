import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Room, Booking, User, BookingStatus } from '../types';
import { ChevronLeft, ChevronRight, Plus, MapPin, Users, Monitor, ImageIcon, Clock, Filter, X, CalendarDays, Sparkles } from 'lucide-react';

interface CalendarPageProps {
  user: User;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tooltip State
  const [tooltip, setTooltip] = useState<{ booking: Booking; x: number; y: number } | null>(null);

  // Filter State
  const [filterRoom, setFilterRoom] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form State
  const [formData, setFormData] = useState({
    roomId: '',
    title: '',
    purpose: '',
    startTime: '09:00',
    endTime: '10:00'
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsData, bookingsData] = await Promise.all([
        api.rooms.list(),
        api.bookings.list() // Ideally filter by range
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  const days = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
    setErrorMsg('');
    setFormData(prev => ({ ...prev, roomId: rooms[0]?.id || '' }));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setSubmitLoading(true);
    setErrorMsg('');

    // Construct DateTimes
    const startDateTime = new Date(selectedDate);
    const [startH, startM] = formData.startTime.split(':').map(Number);
    startDateTime.setHours(startH, startM, 0);

    const endDateTime = new Date(selectedDate);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    endDateTime.setHours(endH, endM, 0);

    if (startDateTime >= endDateTime) {
      setErrorMsg('เวลาสิ้นสุดต้องหลังจากเวลาเริ่มต้น');
      setSubmitLoading(false);
      return;
    }

    try {
      const result = await api.bookings.create({
        user_id: user.id,
        room_id: formData.roomId,
        title: formData.title,
        purpose: formData.purpose,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString()
      });

      if (result.success) {
        setIsModalOpen(false);
        setFormData({
          roomId: rooms[0]?.id || '',
          title: '',
          purpose: '',
          startTime: '09:00',
          endTime: '10:00'
        });
        loadData();
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการสร้างการจอง');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getDayBookings = (date: Date) => {
    return bookings.filter(b => {
      const bDate = new Date(b.start_datetime);
      const isSameDay = bDate.getDate() === date.getDate() &&
        bDate.getMonth() === date.getMonth() &&
        bDate.getFullYear() === date.getFullYear();

      if (!isSameDay) return false;
      if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED) return false;

      // Apply Filters
      if (filterRoom !== 'ALL' && b.room_id !== filterRoom) return false;
      if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;

      return true;
    });
  };

  const selectedRoom = rooms.find(r => r.id === formData.roomId);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-400 rounded-xl shadow-lg">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ตารางห้องว่าง</h1>
            <p className="text-sm text-gray-500">เลือกวันเพื่อจองห้องประชุม</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow-md p-1 border border-gray-100">
          <button
            onClick={handlePrevMonth}
            className="p-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-gray-600 hover:text-indigo-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold w-52 text-center text-gray-800 capitalize">
            {currentDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-gray-600 hover:text-indigo-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-5 mb-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Filter className="w-4 h-4 text-indigo-600" />
            </div>
            <span>ตัวกรอง:</span>
          </div>

          <div className="flex-1 w-full sm:w-auto grid grid-cols-2 gap-4">
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="input-modern text-sm"
            >
              <option value="ALL">ทุกห้องประชุม</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.room_name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-modern text-sm"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value={BookingStatus.APPROVED}>อนุมัติแล้ว</option>
              <option value={BookingStatus.PENDING}>รออนุมัติ</option>
            </select>
          </div>

          {(filterRoom !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              onClick={() => { setFilterRoom('ALL'); setFilterStatus('ALL'); }}
              className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500 font-medium">สถานะ:</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></span>
            <span className="text-sm text-gray-600">อนุมัติแล้ว</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></span>
            <span className="text-sm text-gray-600">รออนุมัติ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-pink-400"></span>
            <span className="text-sm text-gray-600">ไม่อนุมัติ</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in-up">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, idx) => (
            <div
              key={day}
              className={`py-4 text-center text-sm font-semibold ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-700'
                }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Pad the start of the month */}
          {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-gray-50 min-h-[120px]" />
          ))}

          {days.map((date, idx) => {
            const dayBookings = getDayBookings(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`bg-white min-h-[120px] p-2 cursor-pointer transition-all duration-200 relative group hover:bg-indigo-50/50 hover:z-10 ${isToday ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/30' : ''
                  }`}
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : isWeekend
                      ? date.getDay() === 0 ? 'text-red-500' : 'text-blue-500'
                      : 'text-gray-700'
                    }`}>
                    {date.getDate()}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                  {dayBookings.slice(0, 3).map(b => (
                    <div
                      key={b.id}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          booking: b,
                          x: rect.left + rect.width / 2,
                          y: rect.top
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs px-2 py-1 rounded-lg font-medium truncate cursor-help transition-all duration-200 hover:scale-[1.02] ${b.status === BookingStatus.APPROVED
                        ? 'booking-chip-approved'
                        : 'booking-chip-pending'
                        }`}
                    >
                      {new Date(b.start_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} {b.rooms?.room_name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-400 pl-2">+{dayBookings.length - 3} รายการ</div>
                  )}
                </div>

                {/* Hover Plus Icon */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-110">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="modal-content max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">จองห้องประชุม</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDate.toLocaleDateString('th-TH', { dateStyle: 'long' })}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmitBooking} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">เลือกห้อง</label>
                  <select
                    required
                    value={formData.roomId}
                    onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                    className="input-modern"
                  >
                    <option value="" disabled>กรุณาเลือกห้อง</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.room_name} (ความจุ: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Room Details Preview */}
                {selectedRoom && (
                  <div className="bg-gradient-to-br from-gray-50 to-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex gap-4 animate-fade-in">
                    <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden shadow-inner">
                      {selectedRoom.image_url ? (
                        <img src={selectedRoom.image_url} alt={selectedRoom.room_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h4 className="font-semibold text-gray-900">{selectedRoom.room_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        <span>{selectedRoom.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>รองรับ {selectedRoom.capacity} คน</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Monitor className="w-3.5 h-3.5 text-green-400" />
                        <span>{selectedRoom.equipment || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">หัวข้อการประชุม</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="เช่น ประชุมทีม, สัมมนา..."
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">รายละเอียด / วัตถุประสงค์</label>
                  <textarea
                    required
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="อธิบายรายละเอียดการใช้ห้อง..."
                    className="input-modern resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      เวลาเริ่ม
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      เวลาสิ้นสุด
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    {errorMsg}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {submitLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังจอง...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        ยืนยันการจอง
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[100] glass-card-dark text-white text-xs rounded-xl shadow-2xl p-4 pointer-events-none transform -translate-x-1/2 -translate-y-[110%] w-72 animate-fade-in"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-bold text-sm mb-2">{tooltip.booking.title}</div>
          <div className="space-y-2 opacity-90">
            <div className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 mt-0.5 text-blue-400" />
              <span>โดย: <span className="font-medium text-white">{tooltip.booking.users?.full_name}</span></span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-red-400" />
              <span>ห้อง: {tooltip.booking.rooms?.room_name}</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 mt-0.5 text-yellow-400" />
              <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-md">
                {new Date(tooltip.booking.start_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {new Date(tooltip.booking.end_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {tooltip.booking.purpose && (
              <div className="pt-2 mt-1 border-t border-white/10 italic text-gray-300 text-xs">
                "{tooltip.booking.purpose}"
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-gray-800"></div>
        </div>
      )}
    </div>
  );
};