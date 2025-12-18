import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Booking, User, BookingStatus, UserRole } from '../types';
import { Calendar, Search, Filter, Download, CheckCircle, XCircle, Clock, MapPin, User as UserIcon, ArrowUpDown, Ban } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface BookingHistoryPageProps {
    user: User;
}

export const BookingHistoryPage: React.FC<BookingHistoryPageProps> = ({ user }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
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

    const [sortConfig, setSortConfig] = useState<{ key: keyof Booking | 'room_name' | 'user_name'; direction: 'ascending' | 'descending' }>({
        key: 'created_at',
        direction: 'descending'
    });

    const canCancelBooking = user.role === UserRole.ADMIN || user.role === UserRole.APPROVER;

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const data = await api.bookings.list();
            setBookings(data);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
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

    const openCancelModal = (bookingId: string, bookingTitle: string) => {
        setModalConfig({
            isOpen: true,
            title: 'ยืนยันการยกเลิก',
            message: `คุณต้องการยกเลิกการจอง "${bookingTitle}" ใช่หรือไม่? การจองที่ถูกยกเลิกจะไม่สามารถกู้คืนได้`,
            onConfirm: () => handleCancel(bookingId),
            isDanger: true,
            confirmText: 'ยกเลิกการจอง'
        });
    };

    const handleSort = (key: keyof Booking | 'room_name' | 'user_name') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getStatusBadge = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.APPROVED:
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">อนุมัติแล้ว</span>;
            case BookingStatus.PENDING:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">รออนุมัติ</span>;
            case BookingStatus.REJECTED:
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">ไม่อนุมัติ</span>;
            case BookingStatus.CANCELLED:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">ยกเลิกแล้ว</span>;
            default:
                return null;
        }
    };

    const sortedBookings = React.useMemo(() => {
        let sortableBookings = [...bookings];
        if (sortConfig !== null) {
            sortableBookings.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Booking];
                let bValue: any = b[sortConfig.key as keyof Booking];

                if (sortConfig.key === 'room_name') {
                    aValue = a.rooms?.room_name || '';
                    bValue = b.rooms?.room_name || '';
                } else if (sortConfig.key === 'user_name') {
                    aValue = a.users?.full_name || '';
                    bValue = b.users?.full_name || '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableBookings;
    }, [bookings, sortConfig]);

    const filteredBookings = sortedBookings.filter(booking => {
        const matchesSearch =
            booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.rooms?.room_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                    ประวัติการจองทั้งหมด
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="ค้นหาตามหัวข้อ, ผู้จอง, หรือห้อง..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                        <option value="ALL">ทุกสถานะ</option>
                        <option value={BookingStatus.APPROVED}>อนุมัติแล้ว</option>
                        <option value={BookingStatus.PENDING}>รออนุมัติ</option>
                        <option value={BookingStatus.REJECTED}>ไม่อนุมัติ</option>
                        <option value={BookingStatus.CANCELLED}>ยกเลิกแล้ว</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm">
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => handleSort('title')}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span>หัวข้อ/ห้อง</span>
                                        {sortConfig.key === 'title' ? (
                                            <span className="text-indigo-600 font-bold">
                                                {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                                            </span>
                                        ) : (
                                            <ArrowUpDown className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => handleSort('user_name')}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span>ผู้จอง</span>
                                        {sortConfig.key === 'user_name' ? (
                                            <span className="text-indigo-600 font-bold">
                                                {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                                            </span>
                                        ) : (
                                            <ArrowUpDown className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => handleSort('start_datetime')}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span>วัน-เวลา</span>
                                        {sortConfig.key === 'start_datetime' ? (
                                            <span className="text-indigo-600 font-bold">
                                                {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                                            </span>
                                        ) : (
                                            <ArrowUpDown className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span>วันที่ทำรายการ</span>
                                        {sortConfig.key === 'created_at' ? (
                                            <span className="text-indigo-600 font-bold">
                                                {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                                            </span>
                                        ) : (
                                            <ArrowUpDown className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span>สถานะ</span>
                                        {sortConfig.key === 'status' ? (
                                            <span className="text-indigo-600 font-bold">
                                                {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                                            </span>
                                        ) : (
                                            <ArrowUpDown className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                </th>
                                {canCancelBooking && (
                                    <th className="px-6 py-3 font-medium text-center">
                                        <span>ดำเนินการ</span>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.map(booking => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{booking.title}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {booking.rooms?.room_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                {booking.users?.full_name.charAt(0)}
                                            </div>
                                            <span className="text-sm text-gray-700">{booking.users?.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {new Date(booking.start_datetime).toLocaleDateString('th-TH', { dateStyle: 'medium' })} {new Date(booking.start_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            - {new Date(booking.end_datetime).toLocaleDateString('th-TH', { dateStyle: 'medium' })} {new Date(booking.end_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500">
                                            {new Date(booking.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {new Date(booking.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(booking.status)}
                                    </td>
                                    {canCancelBooking && (
                                        <td className="px-6 py-4 text-center">
                                            {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.APPROVED) ? (
                                                <button
                                                    onClick={() => openCancelModal(booking.id, booking.title)}
                                                    disabled={!!actionLoading}
                                                    className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1"
                                                >
                                                    <Ban className="w-3 h-3" />
                                                    ยกเลิก
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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

