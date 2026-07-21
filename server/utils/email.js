const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  const formattedHtml = html || `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">${text.replace(/\n/g, '<br/>')}</div>`;

  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FamilyApp <onboarding@resend.dev>',
          to: [to], subject, text, html: formattedHtml,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Email envoyé via Resend à ${to} (ID: ${data.id})`);
        return true;
      } else {
        console.error('❌ Erreur API Resend (bascule vers Hotmail/Gmail...):', JSON.stringify(data));
      }
    } catch (error) { console.error('❌ Erreur réseau Resend:', error.message); }
  }

  const hotmailUser = process.env.HOTMAIL_USER || process.env.OUTLOOK_USER;
  const hotmailPass = process.env.HOTMAIL_PASSWORD || process.env.OUTLOOK_PASSWORD;

  if (hotmailUser && hotmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: { user: hotmailUser, pass: hotmailPass },
        tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
      });
      await transporter.sendMail({
        from: `"FamilyApp" <${hotmailUser}>`,
        to, subject, text, html: formattedHtml,
      });
      console.log(`✅ Email envoyé via Hotmail/Outlook à ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur Hotmail/Outlook:', error.message);
      return false;
    }
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

  console.log(`📧 [EMAIL NON CONFIGURÉ] À: ${to} | Sujet: ${subject}`);
  return false;
};

module.exports = { sendEmail };