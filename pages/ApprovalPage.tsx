import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking, BookingStatus, User } from '../types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

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
    const actionText = status === BookingStatus.APPROVED ? 'อนุมัติ' : 'ปฏิเสธ';
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการ ${actionText} การจองนี้?`)) return;
    try {
      await api.bookings.updateStatus(bookingId, status, user.id);
      // Remove from list immediately
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการดำเนินการ');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลดรายการ...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">รายการรออนุมัติ</h1>

      {pendingBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <p>ไม่มีรายการจองที่รออนุมัติ</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pendingBookings.map((booking) => (
              <li key={booking.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-medium text-gray-900 truncate">
                      {booking.title} <span className="text-sm text-gray-500 font-normal">โดย {booking.users?.full_name}</span>
                    </h2>
                    <div className="mt-2 flex items-center text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                         <span className="font-semibold mr-1">ห้อง:</span> {booking.rooms?.room_name}
                      </span>
                      <span className="flex items-center">
                         <Clock className="w-4 h-4 mr-1" />
                         {new Date(booking.start_datetime).toLocaleDateString('th-TH')} {new Date(booking.start_datetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.end_datetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      วัตถุประสงค์: {booking.purpose}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex gap-2">
                    <button
                      onClick={() => handleAction(booking.id, BookingStatus.REJECTED)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      ไม่อนุมัติ
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, BookingStatus.APPROVED)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      อนุมัติ
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};