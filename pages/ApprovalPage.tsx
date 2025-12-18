import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Booking, User, BookingStatus } from '../types';
import { CheckCircle, XCircle, Clock, MapPin, User as UserIcon, Calendar, Ban, Filter } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface ApprovalPageProps {
    user: User;
}

type TabType = 'pending' | 'approved';

export const ApprovalPage: React.FC<ApprovalPageProps> = ({ user }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger: boolean;
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false
    });

    useEffect(() => {
        loadBookings();
    }, [activeTab]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const status = activeTab === 'pending' ? BookingStatus.PENDING : BookingStatus.APPROVED;
            const data = await api.bookings.list({ status });
            setBookings(data);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            await api.bookings.updateStatus(bookingId, BookingStatus.APPROVED, user.id);
            loadBookings();
        } catch (error) {
            alert('เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            await api.bookings.updateStatus(bookingId, BookingStatus.REJECTED, user.id);
            loadBookings();
        } catch (error) {
            alert('เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            const result = await api.bookings.updateStatus(bookingId, BookingStatus.CANCELLED, user.id);
            if (result.success) {
                loadBookings();
            } else {
                alert(result.error || 'เกิดข้อผิดพลาดในการยกเลิก');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(null);
        }
    };

    const openApproveModal = (bookingId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'ยืนยันการอนุมัติ',
            message: 'คุณต้องการอนุมัติการจองนี้ใช่หรือไม่?',
            onConfirm: () => handleApprove(bookingId),
            isDanger: false,
            confirmText: 'อนุมัติ'
        });
    };

    const openRejectModal = (bookingId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'ยืนยันการไม่อนุมัติ',
            message: 'คุณต้องการไม่อนุมัติการจองนี้ใช่หรือไม่?',
            onConfirm: () => handleReject(bookingId),
            isDanger: true,
            confirmText: 'ไม่อนุมัติ'
        });
    };

    const openCancelModal = (bookingId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'ยืนยันการยกเลิก',
            message: 'คุณต้องการยกเลิกการจองนี้ใช่หรือไม่? การจองที่ถูกยกเลิกจะไม่สามารถกู้คืนได้',
            onConfirm: () => handleCancel(bookingId),
            isDanger: true,
            confirmText: 'ยกเลิกการจอง'
        });
    };

    const getStatusBadge = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.PENDING:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">รออนุมัติ</span>;
            case BookingStatus.APPROVED:
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">อนุมัติแล้ว</span>;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
                จัดการการจอง
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pending'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Clock className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                    รออนุมัติ
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'approved'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <CheckCircle className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                    อนุมัติแล้ว
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center">กำลังโหลด...</div>
            ) : (
                <div className="grid gap-4">
                    {bookings.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500">
                                {activeTab === 'pending' ? 'ไม่มีรายการรออนุมัติ' : 'ไม่มีรายการที่อนุมัติแล้ว'}
                            </p>
                        </div>
                    ) : (
                        bookings.map(booking => (
                            <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">{booking.title}</h3>
                                            {getStatusBadge(booking.status)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-gray-400" />
                                                <span>ผู้จอง: {booking.users?.full_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>ห้อง: {booking.rooms?.room_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 md:col-span-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span>
                                                    {new Date(booking.start_datetime).toLocaleDateString('th-TH', { dateStyle: 'long' })} {new Date(booking.start_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_datetime).toLocaleDateString('th-TH', { dateStyle: 'long' })} {new Date(booking.end_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="font-medium">วัตถุประสงค์:</span> {booking.purpose}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                        {activeTab === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => openApproveModal(booking.id)}
                                                    disabled={!!actionLoading}
                                                    className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm hover:shadow disabled:opacity-50"
                                                >
                                                    อนุมัติ
                                                </button>
                                                <button
                                                    onClick={() => openRejectModal(booking.id)}
                                                    disabled={!!actionLoading}
                                                    className="flex-1 md:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    ไม่อนุมัติ
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => openCancelModal(booking.id)}
                                            disabled={!!actionLoading}
                                            className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            <Ban className="w-4 h-4" />
                                            ยกเลิกการจอง
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
                confirmText={modalConfig.confirmText}
            />
        </div>
    );
};
