import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Booking, User, BookingStatus } from '../types';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, XCircle, ChevronRight, User as UserIcon } from 'lucide-react';

interface MyBookingsPageProps {
    user: User;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ user }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    useEffect(() => {
        loadBookings();
    }, [user.id]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            // Fetch user's bookings directly using the API filter
            const myBookings = await api.bookings.list({ userId: user.id });

            // Sort by start_datetime desc
            myBookings.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());

            setBookings(myBookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!selectedBooking) return;

        await api.bookings.delete(selectedBooking.id); // Or update status to CANCELLED if soft delete preferred
        setCancelModalOpen(false);
        setSelectedBooking(null);
        loadBookings();
    };

    const getStatusBadge = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.APPROVED:
                return (
                    <span className="badge badge-approved flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        อนุมัติแล้ว
                    </span>
                );
            case BookingStatus.PENDING:
                return (
                    <span className="badge badge-pending flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        รออนุมัติ
                    </span>
                );
            case BookingStatus.REJECTED:
                return (
                    <span className="badge badge-rejected flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        ไม่อนุมัติ
                    </span>
                );
            default:
                return <span className="badge bg-gray-100 text-gray-600">ยกเลิกแล้ว</span>;
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8 animate-fade-in">
                <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-400 rounded-xl shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">รายการจองของฉัน</h1>
                    <p className="text-sm text-gray-500">ติดตามสถานะและประวัติการจองห้องประชุมของคุณ</p>
                </div>
            </div>

            <div className="space-y-4">
                {bookings.length > 0 ? (
                    bookings.map((booking, idx) => (
                        <div
                            key={booking.id}
                            className="glass-card p-5 hover-lift animate-fade-in-up"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-start justify-between md:justify-start gap-3">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {booking.rooms?.room_name || 'ไม่ระบุห้อง'}
                                        </h3>
                                        <div className="md:hidden">
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    </div>

                                    <p className="text-gray-600 font-medium">{booking.title}</p>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-indigo-400" />
                                            {new Date(booking.start_datetime).toLocaleDateString('th-TH', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-indigo-400" />
                                            {new Date(booking.start_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 self-end md:self-center">
                                    <div className="hidden md:block">
                                        {getStatusBadge(booking.status)}
                                    </div>

                                    {booking.status === BookingStatus.PENDING && (
                                        <button
                                            onClick={() => handleCancelClick(booking)}
                                            className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        >
                                            ยกเลิกจอง
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">ไม่พบรายการจอง</h3>
                        <p className="text-gray-500">คุณยังไม่ได้จองห้องประชุมใดๆ</p>
                    </div>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            {cancelModalOpen && (
                <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="modal-content max-w-sm w-full animate-scale-in">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">ยกเลิกการจอง?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                คุณต้องการยกเลิกการจอง "{selectedBooking?.title}" ใช่หรือไม่?
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setCancelModalOpen(false)}
                                    className="btn-secondary w-full"
                                >
                                    ไม่, เก็บไว้
                                </button>
                                <button
                                    onClick={confirmCancel}
                                    className="btn-danger w-full"
                                >
                                    ใช่, ยกเลิกเลย
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
