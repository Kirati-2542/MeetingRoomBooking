import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole, Booking, BookingStatus } from '../types';
import {
    Upload,
    Download,
    Users,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Trash2,
    Eye
} from 'lucide-react';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

export const DataManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'bookings'>('users');
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [previewData, setPreviewData] = useState<any[] | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ==================== EXPORT FUNCTIONS ====================

    const exportUsersToCSV = async () => {
        setIsExporting(true);
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!users || users.length === 0) {
                alert('ไม่มีข้อมูลผู้ใช้');
                return;
            }

            // Create CSV content
            const headers = ['id', 'username', 'email', 'full_name', 'role', 'status', 'created_at'];
            const csvContent = [
                headers.join(','),
                ...users.map(user =>
                    headers.map(header => {
                        const value = user[header as keyof typeof user];
                        // Escape commas and quotes
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value ?? '';
                    }).join(',')
                )
            ].join('\n');

            // Download file
            downloadCSV(csvContent, `users_export_${formatDateForFilename()}.csv`);
        } catch (error: any) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const exportBookingsToCSV = async () => {
        setIsExporting(true);
        try {
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
          *,
          users:user_id (username, full_name),
          rooms:room_id (room_name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!bookings || bookings.length === 0) {
                alert('ไม่มีข้อมูลการจอง');
                return;
            }

            // Create CSV content with flattened data
            const headers = ['id', 'room_id', 'room_name', 'user_id', 'username', 'user_full_name', 'title', 'purpose', 'start_datetime', 'end_datetime', 'status', 'approver_id', 'approved_at', 'created_at'];
            const csvContent = [
                headers.join(','),
                ...bookings.map(booking => {
                    const row = {
                        id: booking.id,
                        room_id: booking.room_id,
                        room_name: (booking.rooms as any)?.room_name || '',
                        user_id: booking.user_id,
                        username: (booking.users as any)?.username || '',
                        user_full_name: (booking.users as any)?.full_name || '',
                        title: booking.title,
                        purpose: booking.purpose,
                        start_datetime: booking.start_datetime,
                        end_datetime: booking.end_datetime,
                        status: booking.status,
                        approver_id: booking.approver_id || '',
                        approved_at: booking.approved_at || '',
                        created_at: booking.created_at
                    };
                    return headers.map(header => {
                        const value = row[header as keyof typeof row];
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value ?? '';
                    }).join(',');
                })
            ].join('\n');

            downloadCSV(csvContent, `bookings_export_${formatDateForFilename()}.csv`);
        } catch (error: any) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    // ==================== IMPORT FUNCTIONS ====================

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const rows = parseCSV(text);

        if (rows.length < 2) {
            alert('ไฟล์ CSV ต้องมีข้อมูลอย่างน้อย 1 แถว (ไม่รวม header)');
            return;
        }

        setPreviewData(rows);
        setShowPreview(true);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const parseCSV = (text: string): any[] => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = parseCSVLine(lines[0]);
        const rows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() ?? '';
            });
            rows.push(row);
        }

        return rows;
    };

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);

        return result;
    };

    const importUsers = async () => {
        if (!previewData || previewData.length === 0) return;

        setIsImporting(true);
        const result: ImportResult = { success: 0, failed: 0, errors: [] };

        for (const row of previewData) {
            try {
                // Validate required fields
                if (!row.username || !row.full_name) {
                    result.failed++;
                    result.errors.push(`แถว: ต้องมี username และ full_name`);
                    continue;
                }

                // Validate role
                const validRoles = ['USER', 'APPROVER', 'ADMIN'];
                const role = row.role?.toUpperCase() || 'USER';
                if (!validRoles.includes(role)) {
                    result.failed++;
                    result.errors.push(`${row.username}: role ไม่ถูกต้อง (ต้องเป็น USER, APPROVER, หรือ ADMIN)`);
                    continue;
                }

                // Validate status
                const validStatuses = ['ACTIVE', 'INACTIVE'];
                const status = row.status?.toUpperCase() || 'ACTIVE';
                if (!validStatuses.includes(status)) {
                    result.failed++;
                    result.errors.push(`${row.username}: status ไม่ถูกต้อง (ต้องเป็น ACTIVE หรือ INACTIVE)`);
                    continue;
                }

                const userData = {
                    username: row.username,
                    email: row.email || null,
                    full_name: row.full_name,
                    role: role as UserRole,
                    status: status as 'ACTIVE' | 'INACTIVE',
                    password_hash: row.password_hash || 'default_hash' // You may want to handle password differently
                };

                // Check if user already exists
                const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', row.username)
                    .single();

                if (existing) {
                    // Update existing user
                    const { error } = await supabase
                        .from('users')
                        .update(userData)
                        .eq('username', row.username);

                    if (error) throw error;
                } else {
                    // Insert new user
                    const { error } = await supabase
                        .from('users')
                        .insert(userData);

                    if (error) throw error;
                }

                result.success++;
            } catch (error: any) {
                result.failed++;
                result.errors.push(`${row.username || 'Unknown'}: ${error.message}`);
            }
        }

        setIsImporting(false);
        setImportResult(result);
        setShowPreview(false);
        setPreviewData(null);
    };

    const importBookings = async () => {
        if (!previewData || previewData.length === 0) return;

        setIsImporting(true);
        const result: ImportResult = { success: 0, failed: 0, errors: [] };

        for (const row of previewData) {
            try {
                // Validate required fields
                if (!row.room_id || !row.user_id || !row.title || !row.start_datetime || !row.end_datetime) {
                    result.failed++;
                    result.errors.push(`แถว: ต้องมี room_id, user_id, title, start_datetime, end_datetime`);
                    continue;
                }

                // Validate status
                const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
                const status = row.status?.toUpperCase() || 'PENDING';
                if (!validStatuses.includes(status)) {
                    result.failed++;
                    result.errors.push(`${row.title}: status ไม่ถูกต้อง`);
                    continue;
                }

                const bookingData = {
                    room_id: row.room_id,
                    user_id: row.user_id,
                    title: row.title,
                    purpose: row.purpose || '',
                    start_datetime: row.start_datetime,
                    end_datetime: row.end_datetime,
                    status: status as BookingStatus,
                    approver_id: row.approver_id || null,
                    approved_at: row.approved_at || null
                };

                const { error } = await supabase
                    .from('bookings')
                    .insert(bookingData);

                if (error) throw error;

                result.success++;
            } catch (error: any) {
                result.failed++;
                result.errors.push(`${row.title || 'Unknown'}: ${error.message}`);
            }
        }

        setIsImporting(false);
        setImportResult(result);
        setShowPreview(false);
        setPreviewData(null);
    };

    // ==================== UTILITY FUNCTIONS ====================

    const downloadCSV = (content: string, filename: string) => {
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
        const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatDateForFilename = () => {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    };

    const downloadTemplate = (type: 'users' | 'bookings') => {
        let content = '';
        let filename = '';

        if (type === 'users') {
            content = 'username,email,full_name,role,status\njohn_doe,john@example.com,John Doe,USER,ACTIVE\njane_smith,jane@example.com,Jane Smith,APPROVER,ACTIVE';
            filename = 'users_template.csv';
        } else {
            content = 'room_id,user_id,title,purpose,start_datetime,end_datetime,status\n[ROOM_UUID],[USER_UUID],ประชุมทีม,ประชุมประจำสัปดาห์,2024-01-15T09:00:00,2024-01-15T10:00:00,PENDING';
            filename = 'bookings_template.csv';
        }

        downloadCSV(content, filename);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-sky-50/30 to-teal-50/20 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-sky-400 to-teal-400 rounded-2xl shadow-lg shadow-sky-400/25">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-sky-800 to-teal-700 bg-clip-text text-transparent">
                                จัดการข้อมูล
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">นำเข้าและส่งออกข้อมูลด้วยไฟล์ CSV</p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <button
                        onClick={() => { setActiveTab('users'); setImportResult(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === 'users'
                                ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-teal-400 text-white shadow-lg shadow-sky-400/25'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        ข้อมูลผู้ใช้งาน
                    </button>
                    <button
                        onClick={() => { setActiveTab('bookings'); setImportResult(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === 'bookings'
                                ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-teal-400 text-white shadow-lg shadow-sky-400/25'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <Calendar className="w-5 h-5" />
                        ข้อมูลการจอง
                    </button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Export Section */}
                    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-teal-400 to-green-400 rounded-xl">
                                <Download className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">ส่งออกข้อมูล (Export)</h2>
                        </div>

                        <p className="text-gray-600 mb-6">
                            {activeTab === 'users'
                                ? 'ดาวน์โหลดข้อมูลผู้ใช้งานทั้งหมดเป็นไฟล์ CSV'
                                : 'ดาวน์โหลดข้อมูลการจองทั้งหมดเป็นไฟล์ CSV'
                            }
                        </p>

                        <button
                            onClick={activeTab === 'users' ? exportUsersToCSV : exportBookingsToCSV}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-400 to-green-400 text-white font-medium rounded-xl shadow-lg shadow-teal-400/25 hover:shadow-xl hover:shadow-teal-400/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    กำลังส่งออก...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    ดาวน์โหลด {activeTab === 'users' ? 'ข้อมูลผู้ใช้' : 'ข้อมูลการจอง'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Import Section */}
                    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-sky-400 to-blue-400 rounded-xl">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">นำเข้าข้อมูล (Import)</h2>
                        </div>

                        <p className="text-gray-600 mb-4">
                            {activeTab === 'users'
                                ? 'อัปโหลดไฟล์ CSV เพื่อเพิ่มหรืออัปเดตข้อมูลผู้ใช้งาน'
                                : 'อัปโหลดไฟล์ CSV เพื่อเพิ่มข้อมูลการจอง'
                            }
                        </p>

                        <div className="mb-4">
                            <button
                                onClick={() => downloadTemplate(activeTab)}
                                className="text-sky-600 hover:text-sky-700 text-sm font-medium flex items-center gap-1 hover:underline"
                            >
                                <FileText className="w-4 h-4" />
                                ดาวน์โหลดตัวอย่างไฟล์ CSV
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="csv-upload"
                        />

                        <label
                            htmlFor="csv-upload"
                            className="w-full flex flex-col items-center justify-center gap-3 px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-all duration-300"
                        >
                            <Upload className="w-10 h-10 text-gray-400" />
                            <div className="text-center">
                                <span className="text-sky-600 font-medium">คลิกเพื่อเลือกไฟล์</span>
                                <p className="text-gray-500 text-sm mt-1">หรือลากไฟล์มาวางที่นี่</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Import Result */}
                {importResult && (
                    <div className="mt-6 glass-card p-6 animate-fade-in-up">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            ผลลัพธ์การนำเข้า
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-green-600">{importResult.success}</div>
                                <div className="text-green-700 text-sm">สำเร็จ</div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
                                <div className="text-red-700 text-sm">ล้มเหลว</div>
                            </div>
                        </div>

                        {importResult.errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    รายละเอียดข้อผิดพลาด
                                </h4>
                                <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                                    {importResult.errors.map((error, index) => (
                                        <li key={index}>• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={() => setImportResult(null)}
                            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            ปิด
                        </button>
                    </div>
                )}

                {/* Preview Modal */}
                {showPreview && previewData && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-sky-500" />
                                        ตรวจสอบข้อมูลก่อนนำเข้า
                                    </h3>
                                    <button
                                        onClick={() => { setShowPreview(false); setPreviewData(null); }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">
                                    พบข้อมูล {previewData.length} รายการ
                                </p>
                            </div>

                            <div className="p-6 overflow-auto max-h-[50vh]">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            {Object.keys(previewData[0] || {}).map((key) => (
                                                <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 10).map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                {Object.values(row).map((value: any, i) => (
                                                    <td key={i} className="px-3 py-2 border-b border-gray-100 truncate max-w-[200px]">
                                                        {value}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && (
                                    <p className="text-gray-500 text-center mt-4 text-sm">
                                        ...และอีก {previewData.length - 10} รายการ
                                    </p>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => { setShowPreview(false); setPreviewData(null); }}
                                    className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={activeTab === 'users' ? importUsers : importBookings}
                                    disabled={isImporting}
                                    className="px-6 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-sky-400/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isImporting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            กำลังนำเข้า...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            นำเข้าข้อมูล
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions Section */}
                <div className="mt-8 glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        คำแนะนำการใช้งาน
                    </h3>

                    {activeTab === 'users' ? (
                        <div className="space-y-4 text-gray-600">
                            <div>
                                <h4 className="font-medium text-gray-800 mb-2">รูปแบบไฟล์ CSV สำหรับผู้ใช้งาน:</h4>
                                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                    <div className="text-gray-500">// Header</div>
                                    <div>username,email,full_name,role,status</div>
                                    <div className="text-gray-500 mt-2">// ตัวอย่างข้อมูล</div>
                                    <div>john_doe,john@example.com,John Doe,USER,ACTIVE</div>
                                </div>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li><strong>username</strong> - ชื่อผู้ใช้ (จำเป็น, ไม่ซ้ำ)</li>
                                <li><strong>email</strong> - อีเมล</li>
                                <li><strong>full_name</strong> - ชื่อ-นามสกุล (จำเป็น)</li>
                                <li><strong>role</strong> - สิทธิ์ (USER, APPROVER, ADMIN)</li>
                                <li><strong>status</strong> - สถานะ (ACTIVE, INACTIVE)</li>
                            </ul>
                        </div>
                    ) : (
                        <div className="space-y-4 text-gray-600">
                            <div>
                                <h4 className="font-medium text-gray-800 mb-2">รูปแบบไฟล์ CSV สำหรับการจอง:</h4>
                                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                    <div className="text-gray-500">// Header</div>
                                    <div>room_id,user_id,title,purpose,start_datetime,end_datetime,status</div>
                                </div>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li><strong>room_id</strong> - UUID ของห้อง (จำเป็น)</li>
                                <li><strong>user_id</strong> - UUID ของผู้จอง (จำเป็น)</li>
                                <li><strong>title</strong> - หัวข้อการจอง (จำเป็น)</li>
                                <li><strong>purpose</strong> - วัตถุประสงค์</li>
                                <li><strong>start_datetime</strong> - เวลาเริ่ม ISO format (จำเป็น)</li>
                                <li><strong>end_datetime</strong> - เวลาสิ้นสุด ISO format (จำเป็น)</li>
                                <li><strong>status</strong> - สถานะ (PENDING, APPROVED, REJECTED, CANCELLED)</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
