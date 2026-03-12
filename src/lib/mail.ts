import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNotificationEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not defined. Email not sent.');
        return { success: false, error: 'API Key missing' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Vidahome <notificaciones@vidahome.es>',
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (e) {
        console.error('Email Exception:', e);
        return { success: false, error: e };
    }
}
