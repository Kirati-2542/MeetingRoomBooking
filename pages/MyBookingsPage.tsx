import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Booking, User, BookingStatus } from '../types';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle, Search, Trash2 } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface MyBookingsPageProps {
    user: User;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ user }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false
    });

    useEffect(() => {
        loadBookings();
    }, [user.id]);

    const loadBookings = async () => {
        try {
            const data = await api.bookings.list({ userId: user.id });
            setBookings(data);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId: string) => {
        setCancelLoading(bookingId);
        try {
            const result = await api.bookings.updateStatus(bookingId, BookingStatus.CANCELLED);
            if (result.success) {
                loadBookings();
            } else {
                alert('เกิดข้อผิดพลาดในการยกเลิก: ' + result.error);
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการยกเลิก');
        } finally {
            setCancelLoading(null);
        }
    };

    const openCancelModal = (bookingId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'ยืนยันการยกเลิก',
            message: 'คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?',
            onConfirm: () => handleCancel(bookingId),
            isDanger: true
        });
    };

    const getStatusBadge = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.APPROVED:
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> อนุมัติแล้ว</span>;
            case BookingStatus.PENDING:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> รออนุมัติ</span>;
            case BookingStatus.REJECTED:
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" /> ไม่อนุมัติ</span>;
            case BookingStatus.CANCELLED:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold flex items-center gap-1"><Trash2 className="w-3 h-3" /> ยกเลิกแล้ว</span>;
            default:
                return null;
        }
    };

    if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-600" />
                รายการจองของฉัน
            </h1>

            <div className="space-y-4">
                {bookings.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">ไม่มีรายการจอง</h3>
                        <p className="text-gray-500 mt-1">คุณยังไม่ได้ทำการจองห้องประชุม</p>
                    </div>
                ) : (
                    bookings.map(booking => (
                        <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{booking.title}</h3>
                                        {getStatusBadge(booking.status)}
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{booking.rooms?.room_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>
                                                {new Date(booking.start_datetime).toLocaleDateString('th-TH', { dateStyle: 'medium' })} {' '}
                                                {new Date(booking.start_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {' '}
                                                {new Date(booking.end_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-gray-400" />
                                            <span>{booking.purpose}</span>
                                        </div>
                                    </div>
                                </div>

                                {booking.status === BookingStatus.PENDING && (
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => openCancelModal(booking.id)}
                                            disabled={cancelLoading === booking.id}
                                            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                            {cancelLoading === booking.id ? 'กำลังยกเลิก...' : 'ยกเลิกการจอง'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
                confirmText="ยืนยันการยกเลิก"
            />
        </div>
    );
};
