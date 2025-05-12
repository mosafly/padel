import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
console.warn('Resend API key is missing. Email functionality will not work.');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
