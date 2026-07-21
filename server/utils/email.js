const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  const formattedHtml = html || `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">${text.replace(/\n/g, '<br/>')}</div>`;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
      await transporter.sendMail({
        from: `"FamilyApp" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to, subject, text, html: formattedHtml,
      });
      console.log(`✅ Email envoyé via SMTP (${process.env.SMTP_HOST}) à ${to}`);
      return true;
    } catch (error) { console.error('❌ Erreur SMTP:', error.message); return false; }
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: `"FamilyApp" <${process.env.GMAIL_USER}>`,
        to, subject, text, html: formattedHtml,
      });
      console.log(`✅ Email envoyé via Gmail à ${to}`);
      return true;
    } catch (error) { console.error('❌ Erreur Gmail:', error.message); return false; }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'FamilyApp <onboarding@resend.dev>', to: [to], subject, text, html: formattedHtml }),
      });
      const data = await response.json();
      if (response.ok) { console.log(`✅ Email envoyé via Resend à ${to}`); return true; }
    } catch (error) {}
  }

  console.log(`📧 [EMAIL NON CONFIGURÉ] À: ${to} | Sujet: ${subject}`);
  return false;
};

module.exports = { sendEmail };