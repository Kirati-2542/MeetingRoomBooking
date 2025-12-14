import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
    type: 'NEW_BOOKING' | 'BOOKING_STATUS_UPDATE';
    bookingId: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
        const { type, bookingId } = await req.json() as EmailRequest

        // Fetch booking details with relations
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
        *,
        rooms (room_name),
        users!user_id (full_name, email)
      `)
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            throw new Error('Booking not found')
        }

        const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
            })
        }

        const getHtmlTemplate = (title: string, content: string, accentColor: string = '#4F46E5') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, ${accentColor}, #7C3AED); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .logo { background: rgba(255,255,255,0.2); width: 48px; height: 48px; border-radius: 12px; margin: 0 auto 16px; line-height: 48px; text-align: center; font-size: 24px; color: white; display: inline-block; }
    .content { padding: 32px; }
    .item { margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px; }
    .item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .label { font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .value { font-size: 16px; color: #111827; font-weight: 500; }
    .footer { text-align: center; padding-top: 32px; color: #9ca3af; font-size: 12px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 600; color: white; margin-bottom: 20px; }
    .btn { display: block; width: fit-content; margin: 32px auto 0; padding: 12px 32px; background-color: ${accentColor}; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; text-align: center; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">📅</div>
        <h1>${title}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EduMeet Booking System</p>
      <p>ระบบจองห้องประชุมออนไลน์</p>
    </div>
  </div>
</body>
</html>
`

        let emailTo = ''
        let subject = ''
        let html = ''

        if (type === 'NEW_BOOKING') {
            // Send to Approvers
            const { data: approvers } = await supabase
                .from('users')
                .select('email')
                .eq('role', 'APPROVER')
                .eq('status', 'ACTIVE')

            if (!approvers || approvers.length === 0) {
                return new Response(JSON.stringify({ message: 'No approvers found' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            emailTo = approvers.map(a => a.email).filter(Boolean).join(',')
            subject = `[EduMeet] คำขอจองห้องประชุมใหม่: ${booking.title}`

            const content = `
                <p style="margin-bottom: 24px; font-size: 16px; text-align: center; color: #4b5563;">มีรายการจองห้องประชุมใหม่รอการพิจารณาจากคุณ</p>
                <div class="item">
                    <div class="label">ผู้จอง</div>
                    <div class="value">${booking.users.full_name}</div>
                </div>
                <div class="item">
                    <div class="label">ห้องประชุม</div>
                    <div class="value">${booking.rooms.room_name}</div>
                </div>
                <div class="item">
                    <div class="label">หัวข้อการประชุม</div>
                    <div class="value">${booking.title}</div>
                </div>
                <div class="item">
                    <div class="label">รายละเอียด / วัตถุประสงค์</div>
                    <div class="value">${booking.purpose || '-'}</div>
                </div>
                <div class="item">
                    <div class="label">วัน-เวลา</div>
                    <div class="value">
                        ${formatDate(booking.start_datetime)}<br>
                        <span style="color: #6b7280; font-size: 14px;">ถึง</span><br>
                        ${formatDate(booking.end_datetime)}
                    </div>
                </div>
                <a href="${SITE_URL}/approval" class="btn">ตรวจสอบและอนุมัติ</a>
            `
            html = getHtmlTemplate('คำขอจองห้องประชุมใหม่', content)

        } else if (type === 'BOOKING_STATUS_UPDATE') {
            // Send to Requester
            if (!booking.users.email) {
                return new Response(JSON.stringify({ message: 'User has no email' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            emailTo = booking.users.email
            const isApproved = booking.status === 'APPROVED';
            const statusText = isApproved ? 'อนุมัติเรียบร้อย' : 'ไม่ผ่านการอนุมัติ'
            const statusColor = isApproved ? '#10B981' : '#EF4444' // Green or Red
            const accentColor = isApproved ? '#10B981' : '#EF4444'

            subject = `[EduMeet] ผลการจอง: ${booking.title} (${statusText})`

            const content = `
                <div style="text-align: center; margin-bottom: 24px;">
                    <span class="status-badge" style="background-color: ${statusColor};">${statusText}</span>
                    <p style="color: #4b5563;">
                        ${isApproved ? 'การจองของคุณได้รับการอนุมัติแล้ว' : 'ขออภัย การจองของคุณไม่ผ่านการอนุมัติ'}
                    </p>
                </div>
                
                <div class="item">
                    <div class="label">ห้องประชุม</div>
                    <div class="value">${booking.rooms.room_name}</div>
                </div>
                <div class="item">
                    <div class="label">หัวข้อการประชุม</div>
                    <div class="value">${booking.title}</div>
                </div>
                 <div class="item">
                    <div class="label">วัน-เวลา</div>
                    <div class="value">
                        ${formatDate(booking.start_datetime)} - ${formatDate(booking.end_datetime)}
                    </div>
                </div>
                <a href="${SITE_URL}/my-bookings" class="btn">ดูรายการจองของฉัน</a>
            `
            html = getHtmlTemplate('ผลการจองห้องประชุม', content, accentColor)
        }
        if (!emailTo) {
            return new Response(JSON.stringify({ message: 'No recipients' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Call Resend API
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'EduMeet <onboarding@resend.dev>',
                to: emailTo.split(','),
                subject: subject,
                html: html,
            }),
        })

        const data = await res.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
