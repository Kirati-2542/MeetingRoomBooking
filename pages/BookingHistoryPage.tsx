import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Booking, BookingStatus, Room, User } from '../types';
import { Clock, MapPin, User as UserIcon, Calendar, CheckCircle, XCircle, AlertCircle, Filter, Search, X } from 'lucide-react';

interface BookingHistoryPageProps {
    user: User;
}

export const BookingHistoryPage: React.FC<BookingHistoryPageProps> = ({ user }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterRoom, setFilterRoom] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bookingsData, roomsData] = await Promise.all([
                api.bookings.list(),
                api.rooms.list()
            ]);

            // Sort by newest first
            const sortedBookings = bookingsData.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setBookings(sortedBookings);
            setRooms(roomsData);
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.APPROVED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case BookingStatus.REJECTED: return 'bg-red-100 text-red-700 border-red-200';
            case BookingStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
            case BookingStatus.CANCELLED: return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.APPROVED: return <CheckCircle className="w-4 h-4" />;
            case BookingStatus.REJECTED: return <XCircle className="w-4 h-4" />;
            case BookingStatus.PENDING: return <Clock className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getStatusText = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.APPROVED: return 'อนุมัติแล้ว';
            case BookingStatus.REJECTED: return 'ไม่อนุมัติ';
            case BookingStatus.PENDING: return 'รออนุมัติ';
            case BookingStatus.CANCELLED: return 'ยกเลิกแล้ว';
            default: return status;
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus;
        const matchesRoom = filterRoom === 'ALL' || booking.room_id === filterRoom;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            booking.title.toLowerCase().includes(searchLower) ||
            booking.users?.full_name.toLowerCase().includes(searchLower) ||
            booking.rooms?.room_name.toLowerCase().includes(searchLower);

        return matchesStatus && matchesRoom && matchesSearch;
    });

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-500 mb-2">
                    ประวัติการจองทั้งหมด
                </h1>
                <p className="text-gray-600">ตรวจสอบรายการจองทั้งหมดในระบบ</p>
            </div>

            {/* Filters */}
            <div className="glass-card p-5 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="ค้นหา หัวข้อ, ห้องประชุม, ผู้จอง..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 input-modern w-full"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 min-w-[200px]">
                            <Filter className="w-5 h-5 text-indigo-600" />
                            <select
                                value={filterRoom}
                                onChange={(e) => setFilterRoom(e.target.value)}
                                className="input-modern flex-1"
                            >
                                <option value="ALL">ทุกห้องประชุม</option>
                                {rooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.room_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 min-w-[200px]">
                            <div className="w-5 h-5" /> {/* Spacer for alignment icon */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="input-modern flex-1"
                            >
                                <option value="ALL">ทุกสถานะ</option>
                                <option value={BookingStatus.APPROVED}>อนุมัติแล้ว</option>
                                <option value={BookingStatus.PENDING}>รออนุมัติ</option>
                                <option value={BookingStatus.REJECTED}>ไม่อนุมัติ</option>
                                <option value={BookingStatus.CANCELLED}>ยกเลิกแล้ว</option>
                            </select>
                        </div>

                        {(filterStatus !== 'ALL' || filterRoom !== 'ALL' || searchTerm) && (
                            <button
                                onClick={() => {
                                    setFilterStatus('ALL');
                                    setFilterRoom('ALL');
                                    setSearchTerm('');
                                }}
                                className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <X className="w-5 h-5" />
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">วัน-เวลา</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ห้องประชุม</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้จอง</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">หัวข้อ</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        ไม่พบข้อมูลการจอง
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-center text-sm font-medium text-gray-900">
                                                    <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                                                    {new Date(booking.start_datetime).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500 mt-1 pl-6">
                                                    {new Date(booking.start_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} -
                                                    {new Date(booking.end_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{booking.rooms?.room_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{booking.users?.full_name}</span>
                                                    <span className="text-xs text-gray-500">{booking.users?.email || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-medium line-clamp-1">{booking.title}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{booking.purpose}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {getStatusText(booking.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
