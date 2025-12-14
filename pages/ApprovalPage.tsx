import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking, BookingStatus, User } from '../types';
import { CheckCircle, XCircle, Clock, Users, MapPin, Sparkles, Inbox } from 'lucide-react';

interface ApprovalPageProps {
  user: User;
}

export const ApprovalPage: React.FC<ApprovalPageProps> = ({ user }) => {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // In a real app, API would filter status=PENDING
      const all = await api.bookings.list({ status: BookingStatus.PENDING });
      setPendingBookings(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (bookingId: string, status: BookingStatus) => {
    // Removed confirmation dialog as it was being blocked by browser
    // The action buttons are already clear about their intent

    try {
      const result = await api.bookings.updateStatus(bookingId, status, user.id);

      if (result.success) {
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        // alert('ดำเนินการสำเร็จ'); // Optional success feedback
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-400 rounded-xl shadow-lg">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายการรออนุมัติ</h1>
          <p className="text-sm text-gray-500">ตรวจสอบและอนุมัติคำขอจองห้องประชุม</p>
        </div>
        {pendingBookings.length > 0 && (
          <span className="ml-auto px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-semibold shadow-sm">
            {pendingBookings.length} รายการ
          </span>
        )}
      </div>

      {pendingBookings.length === 0 ? (
        <div className="glass-card p-16 text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Inbox className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่มีรายการรออนุมัติ</h3>
          <p className="text-gray-500">รายการจองทั้งหมดได้รับการดำเนินการแล้ว</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBookings.map((booking, idx) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover-lift animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex-shrink-0">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 truncate">
                        {booking.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>โดย <span className="font-medium text-gray-700">{booking.users?.full_name}</span></span>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1.5 bg-red-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-red-500" />
                          </div>
                          <span className="font-medium text-gray-700">{booking.rooms?.room_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1.5 bg-indigo-50 rounded-lg">
                            <Clock className="w-4 h-4 text-indigo-500" />
                          </div>
                          <span className="text-gray-600">
                            {new Date(booking.start_datetime).toLocaleDateString('th-TH')}
                            <span className="mx-1">|</span>
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {new Date(booking.start_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                        </div>
                      </div>

                      {booking.purpose && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100">
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-700">วัตถุประสงค์:</span> {booking.purpose}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 lg:flex-col xl:flex-row flex-shrink-0">
                  <button
                    onClick={() => handleAction(booking.id, BookingStatus.REJECTED)}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-600 font-medium rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-200 border border-red-200"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>ไม่อนุมัติ</span>
                  </button>
                  <button
                    onClick={() => handleAction(booking.id, BookingStatus.APPROVED)}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>อนุมัติ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};