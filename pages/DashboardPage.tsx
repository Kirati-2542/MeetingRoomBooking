import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BookingStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Activity, Clock, Building, TrendingUp, Users, CheckCircle, XCircle, Calendar, CalendarDays, FileText, MapPin } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.dashboard.getStats();
                setStats(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-80 bg-gray-200 rounded-2xl"></div>
                        <div className="h-80 bg-gray-200 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">ไม่สามารถโหลดข้อมูลได้</p>
            </div>
        </div>
    );

    const approvalRate = stats.totalBookings > 0
        ? Math.round((stats.approvedCount / stats.totalBookings) * 100)
        : 0;

    const statusData = [
        { name: 'อนุมัติ', value: stats.approvedCount, color: '#10B981' },
        { name: 'รออนุมัติ', value: stats.pendingCount, color: '#F59E0B' },
        { name: 'ไม่อนุมัติ', value: stats.rejectedCount, color: '#EF4444' },
    ].filter(d => d.value > 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case BookingStatus.APPROVED:
                return <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">อนุมัติ</span>;
            case BookingStatus.PENDING:
                return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">รออนุมัติ</span>;
            case BookingStatus.REJECTED:
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">ไม่อนุมัติ</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 animate-fade-in">
                <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-400 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ดผู้ดูแลระบบ</h1>
                    <p className="text-sm text-gray-500">ภาพรวมการใช้งานระบบจองห้องประชุม</p>
                </div>
            </div>

            {/* Quick Stats - 2 Rows */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Row 1 */}
                <div className="glass-card p-4 hover-lift animate-fade-in-up">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 rounded-lg">
                            <FileText className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">การจองทั้งหมด</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 hover-lift animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">รออนุมัติ</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.pendingCount}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 hover-lift animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">อนุมัติแล้ว</p>
                            <p className="text-2xl font-bold text-emerald-600">{stats.approvedCount}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 hover-lift animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ไม่อนุมัติ</p>
                            <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
                        </div>
                    </div>
                </div>

                {/* Row 2 */}
                <div className="glass-card p-4 hover-lift animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <CalendarDays className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">จองวันนี้</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.todayBookings}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 hover-lift animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">เดือนนี้</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.thisMonthBookings}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 hover-lift animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <Building className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ห้องประชุม</p>
                            <p className="text-2xl font-bold text-teal-600">{stats.totalRooms}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 hover-lift animate-fade-in-up" style={{ animationDelay: '350ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ผู้ใช้งาน</p>
                            <p className="text-2xl font-bold text-indigo-600">{stats.totalUsers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Top Rooms Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up hover-lift" style={{ animationDelay: '400ms' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-sky-100 rounded-lg">
                            <Building className="w-5 h-5 text-sky-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">ห้องที่ถูกจองมากที่สุด</h2>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topRooms} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#38BDF8" />
                                        <stop offset="100%" stopColor="#06B6D4" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                                    axisLine={{ stroke: '#E5E7EB' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                        padding: '12px 16px'
                                    }}
                                    labelStyle={{ fontWeight: 600, color: '#111827' }}
                                />
                                <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 8, 8, 0]} name="จำนวนครั้ง" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up hover-lift" style={{ animationDelay: '450ms' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">สถานะการจอง</h2>
                    </div>
                    <div className="h-48 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                        padding: '12px 16px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-gray-900">{approvalRate}%</p>
                        <p className="text-sm text-gray-500">อัตราการอนุมัติ</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {statusData.map(item => (
                            <div key={item.name} className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-xs text-gray-600">{item.name} ({item.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <Clock className="w-5 h-5 text-teal-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">รายการจองล่าสุด</h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">หัวข้อ</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ห้อง</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ผู้จอง</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">วันที่</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">ไม่พบข้อมูลการจอง</td>
                                </tr>
                            ) : (
                                stats.recentBookings.map((booking: any) => (
                                    <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-gray-900 line-clamp-1">{booking.title}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-sky-500" />
                                                <span className="text-gray-700">{booking.roomName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">{booking.userName}</td>
                                        <td className="py-3 px-4 text-gray-500 text-sm">
                                            {new Date(booking.startDatetime).toLocaleDateString('th-TH', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
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