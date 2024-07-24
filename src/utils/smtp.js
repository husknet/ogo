import nodemailer from 'nodemailer';

export const smtpConfig = {
  host: 'mail.mailo.com',
  port: 587,
  secure: false, // Upgrade later with STARTTLS
  auth: {
    user: 'coinreport@mailo.com',
    pass: 'sagekidayo',
  },
};
