import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type StreamTransport from 'nodemailer/lib/stream-transport'

const transporterOptions: SMTPTransport.Options | StreamTransport.Options = process.env.SMTP_HOST
  ? {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }
  : {
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    }

export const transporter = nodemailer.createTransport(transporterOptions)

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`

  const info = await transporter.sendMail({
    from: '"AppForge" <noreply@appforge.dev>',
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#666;margin-top:24px;font-size:14px">
          If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  })

  if (!process.env.SMTP_HOST) {
    console.log('\n--- PASSWORD RESET EMAIL ---')
    console.log(`To: ${email}`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log('----------------------------\n')
  }

  return info
}