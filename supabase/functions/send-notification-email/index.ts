import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const SMTP_EMAIL = Deno.env.get('SMTP_EMAIL')
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://meeting-room-booking-swart-omega.vercel.app'

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
        // Validate SMTP Config
        if (!SMTP_EMAIL || !SMTP_PASSWORD) {
            throw new Error('Missing SMTP configuration (SMTP_EMAIL or SMTP_PASSWORD)')
        }

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
            return new Date(dateString).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
            })
        }

        const getHtmlTemplate = (title: string, content: string, accentColor: string = '#4F46E5') => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#374151;background-color:#f3f4f6;margin:0;padding:0;}
.container{max-width:600px;margin:0 auto;padding:40px 20px;}
.card{background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);border:1px solid #e5e7eb;}
.header{background:linear-gradient(135deg,${accentColor},#7C3AED);padding:32px;text-align:center;}
.header h1{color:white;margin:0;font-size:24px;font-weight:700;}
.logo{background:rgba(255,255,255,0.2);width:48px;height:48px;border-radius:12px;margin:0 auto 16px;line-height:48px;text-align:center;font-size:18px;color:white;display:inline-block;font-weight:bold;}
.content{padding:32px;}
.item{margin-bottom:20px;border-bottom:1px solid #f3f4f6;padding-bottom:16px;}
.item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0;}
.label{font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;}
.value{font-size:16px;color:#111827;font-weight:500;}
.footer{text-align:center;padding-top:32px;color:#9ca3af;font-size:12px;}
.status-badge{display:inline-block;padding:8px 16px;border-radius:9999px;font-size:14px;font-weight:600;color:white;margin-bottom:20px;}
</style>
</head>
<body>
<div class="container">
<div class="card">
<div class="header">
<div class="logo">EM</div>
<h1>${title}</h1>
</div>
<div class="content">
${content}
</div>
</div>
<div class="footer">
<p>© ${new Date().getFullYear()} EduMeet Booking System</p>
<p>Online Meeting Room Booking</p>
</div>
</div>
</body>
</html>`

        let emailTo: string[] = []
        let subject = ''
        let html = ''

        if (type === 'NEW_BOOKING') {
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
            emailTo = approvers.map(a => a.email).filter((email): email is string => !!email)
            subject = `[EduMeet] New Booking Request: ${booking.title}`
            const content = `<p style="margin-bottom:24px;font-size:16px;text-align:center;color:#4b5563;">A new meeting room booking request is awaiting your approval.</p><div class="item"><div class="label">Requester</div><div class="value">${booking.users.full_name}</div></div><div class="item"><div class="label">Meeting Room</div><div class="value">${booking.rooms.room_name}</div></div><div class="item"><div class="label">Meeting Title</div><div class="value">${booking.title}</div></div><div class="item"><div class="label">Purpose</div><div class="value">${booking.purpose || '-'}</div></div><div class="item"><div class="label">Date and Time</div><div class="value">${formatDate(booking.start_datetime)}<br><span style="color:#6b7280;font-size:14px;">to</span><br>${formatDate(booking.end_datetime)}</div></div><div style="text-align:center;margin-top:32px;"><a href="${SITE_URL}/approval" style="display:inline-block;padding:12px 32px;background-color:#4F46E5;color:#ffffff !important;text-decoration:none;border-radius:12px;font-weight:600;">Review and Approve</a></div>`
            html = getHtmlTemplate('New Booking Request', content)
        } else if (type === 'BOOKING_STATUS_UPDATE') {
            if (!booking.users.email) {
                return new Response(JSON.stringify({ message: 'User has no email' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            emailTo = [booking.users.email]
            const isApproved = booking.status === 'APPROVED';
            const statusText = isApproved ? 'Approved' : 'Rejected'
            const statusColor = isApproved ? '#10B981' : '#EF4444'
            const accentColor = isApproved ? '#10B981' : '#EF4444'
            subject = `[EduMeet] Booking Result: ${booking.title} (${statusText})`
            const content = `<div style="text-align:center;margin-bottom:24px;"><span style="display:inline-block;padding:8px 16px;border-radius:9999px;font-size:14px;font-weight:600;color:white;background-color:${statusColor};">${statusText}</span><p style="color:#4b5563;">${isApproved ? 'Your booking has been approved.' : 'Sorry, your booking was not approved.'}</p></div><div class="item"><div class="label">Meeting Room</div><div class="value">${booking.rooms.room_name}</div></div><div class="item"><div class="label">Meeting Title</div><div class="value">${booking.title}</div></div><div class="item"><div class="label">Date and Time</div><div class="value">${formatDate(booking.start_datetime)} - ${formatDate(booking.end_datetime)}</div></div><div style="text-align:center;margin-top:32px;"><a href="${SITE_URL}/my-bookings" style="display:inline-block;padding:12px 32px;background-color:${accentColor};color:#ffffff !important;text-decoration:none;border-radius:12px;font-weight:600;">View My Bookings</a></div>`
            html = getHtmlTemplate('Booking Result', content, accentColor)
        }

        if (emailTo.length === 0) {
            return new Response(JSON.stringify({ message: 'No recipients' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- Deno Native SMTP Logic (denomailer) ---
        const client = new SMTPClient({
            connection: {
                hostname: "smtp.gmail.com",
                port: 465,
                tls: true,
                auth: {
                    username: SMTP_EMAIL,
                    password: SMTP_PASSWORD,
                },
            },
        });

        // Send to all recipients
        for (const to of emailTo) {
            await client.send({
                from: SMTP_EMAIL!,
                to: to,
                subject: subject,
                content: "auto",
                html: html,
                internalTag: "EduMeet",
            });
        }

        await client.close();
        // ------------------------------

        return new Response(JSON.stringify({ message: 'Email sent successfully via Gmail (Deno SMTP)' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Error sending email:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
