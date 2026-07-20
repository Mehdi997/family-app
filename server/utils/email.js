const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`📧 [EMAIL NON CONFIGURÉ] À: ${to} | Sujet: ${subject}`);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"FamilyApp" <${process.env.GMAIL_USER}>`,
      to, subject, text,
      html: html || `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">${text.replace(/\n/g, '<br/>')}</div>`,
    });
    console.log(`✅ Email envoyé avec succès à ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return false;
  }
};
module.exports = { sendEmail };