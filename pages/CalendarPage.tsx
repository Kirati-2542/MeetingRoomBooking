import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Room, Booking, User, BookingStatus } from '../types';
import { ChevronLeft, ChevronRight, Plus, MapPin, Users, Monitor, ImageIcon, Clock, Filter } from 'lucide-react';

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
      console.error(err);
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
    setFormData(prev => ({...prev, roomId: rooms[0]?.id || ''}));
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">ตารางห้องว่าง</h1>
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium w-48 text-center capitalize">
            {currentDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center animate-fade-in">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="w-5 h-5 text-blue-600" />
            <span>ตัวกรอง:</span>
        </div>
        
        <div className="flex-1 w-full sm:w-auto grid grid-cols-2 gap-4">
            <select 
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="block w-full rounded-md border-gray-300 border py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
                <option value="ALL">ทุกห้องประชุม</option>
                {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.room_name}</option>
                ))}
            </select>
            
            <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full rounded-md border-gray-300 border py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
                <option value="ALL">ทุกสถานะ</option>
                <option value={BookingStatus.APPROVED}>อนุมัติแล้ว (Approved)</option>
                <option value={BookingStatus.PENDING}>รออนุมัติ (Pending)</option>
            </select>
        </div>
        
        {(filterRoom !== 'ALL' || filterStatus !== 'ALL') && (
             <button 
                onClick={() => { setFilterRoom('ALL'); setFilterStatus('ALL'); }}
                className="text-sm text-red-600 hover:text-red-800 whitespace-nowrap"
            >
                ล้างตัวกรอง
            </button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow ring-1 ring-gray-200">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
            <div key={day} className="py-2 text-center text-sm font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Pad the start of the month */}
          {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-white min-h-[120px] bg-gray-50" />
          ))}
          
          {days.map(date => {
            const dayBookings = getDayBookings(date);
            const isToday = new Date().toDateString() === date.toDateString();
            
            return (
              <div 
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`bg-white min-h-[120px] p-2 hover:bg-blue-50 cursor-pointer transition-colors relative group ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px]">
                  {dayBookings.map(b => (
                    <div 
                      key={b.id} 
                      onMouseEnter={(e) => {
                        e.stopPropagation(); // Prevent bubbling if needed, though simpler without
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          booking: b,
                          x: rect.left + rect.width / 2,
                          y: rect.top
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      className={`text-xs p-1 rounded border truncate cursor-help ${
                        b.status === BookingStatus.APPROVED ? 'bg-green-100 border-green-200 text-green-800' :
                        'bg-yellow-100 border-yellow-200 text-yellow-800'
                      }`}
                    >
                      {new Date(b.start_datetime).getHours()}:00 - {b.rooms?.room_name}
                    </div>
                  ))}
                </div>
                {/* Hover Plus Icon */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-5 h-5 text-blue-500 bg-blue-100 rounded-full p-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">จองห้องประชุม</h2>
            <p className="text-sm text-gray-500 mb-6">
              วันที่: {selectedDate.toLocaleDateString('th-TH', {dateStyle: 'long'})}
            </p>

            <form onSubmit={handleSubmitBooking} className="space-y-6">
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เลือกห้อง</label>
                    <select
                    required
                    value={formData.roomId}
                    onChange={e => setFormData({...formData, roomId: e.target.value})}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex gap-4">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                            {selectedRoom.image_url ? (
                                <img src={selectedRoom.image_url} alt={selectedRoom.room_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <ImageIcon className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="font-medium text-gray-900">{selectedRoom.room_name}</h4>
                             <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-3 h-3" />
                                <span>{selectedRoom.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-3 h-3" />
                                <span>รองรับ {selectedRoom.capacity} คน</span>
                            </div>
                             <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Monitor className="w-3 h-3" />
                                <span>{selectedRoom.equipment}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อการประชุม / ชื่อวิชา</label>
                    <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด / วัตถุประสงค์</label>
                    <textarea
                    required
                    value={formData.purpose}
                    onChange={e => setFormData({...formData, purpose: e.target.value})}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    rows={2}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่ม</label>
                    <input
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
                    <input
                        type="time"
                        required
                        value={formData.endTime}
                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                    </div>
                </div>
              </div>

              {errorMsg && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {errorMsg}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                >
                  {submitLoading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div 
            className="fixed z-[100] bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-none transform -translate-x-1/2 -translate-y-[110%] w-64 animate-fade-in"
            style={{ left: tooltip.x, top: tooltip.y }}
        >
             <div className="font-bold text-sm mb-1.5">{tooltip.booking.title}</div>
             <div className="space-y-1.5 opacity-90">
                <div className="flex items-start gap-2">
                    <Users className="w-3.5 h-3.5 mt-0.5 text-blue-300" />
                    <span>โดย: <span className="font-medium text-white">{tooltip.booking.users?.full_name}</span></span>
                </div>
                 <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-red-300" />
                    <span>ห้อง: {tooltip.booking.rooms?.room_name}</span>
                </div>
                <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 mt-0.5 text-yellow-300" />
                     <span className="font-mono text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-white">
                        {new Date(tooltip.booking.start_datetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} - {new Date(tooltip.booking.end_datetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                     </span>
                </div>
                {tooltip.booking.purpose && (
                    <div className="pt-2 mt-1 border-t border-gray-700 italic text-gray-300">
                        "{tooltip.booking.purpose}"
                    </div>
                )}
             </div>
             {/* Arrow */}
             <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-gray-900"></div>
        </div>
      )}
    </div>
  );
};