// server/server.js

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'https://edizo-in.github.io',
  'https://edizo-in.github.io/main-web'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy does not allow this origin'), false);
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Email sending logic
async function sendEmail(emailDetails) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let subject = '';
  let htmlContent = '';
  let recipient = emailDetails.recipientEmail || emailDetails.email;

  switch (emailDetails.type) {
    case 'applicationConfirmation':
      subject = `Application Confirmation - ${emailDetails.internshipTitle || 'Internship'}`;
      htmlContent = `<p>Thank you ${emailDetails.name} for applying...</p>`;
      break;
    case 'internshipApplicationNotification':
      recipient = process.env.INTERNSHIP_RECIPIENT_EMAIL || process.env.EMAIL_USER;
      subject = `New Internship Application - ${emailDetails.internshipTitle}`;
      htmlContent = `<p>New application received...</p>`;
      break;
    case 'contactForm':
      subject = `Contact Form: ${emailDetails.subject}`;
      htmlContent = `<p>Contact message from ${emailDetails.name}</p>`;
      break;
    default:
      subject = emailDetails.subject || 'Notification';
      htmlContent = emailDetails.htmlContent || '<p>No content</p>';
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipient,
    subject,
    html: htmlContent
  });
}

// Routes
app.post('/send-email', async (req, res, next) => {
  try {
    await sendEmail(req.body);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    next(err);
  }
});

app.post('/send-contact-email', async (req, res, next) => {
  try {
    const recipient = process.env.CONTACT_FORM_RECIPIENT_EMAIL || process.env.EMAIL_USER;
    await sendEmail({
      ...req.body,
      type: 'contactForm',
      recipientEmail: recipient
    });
    res.status(200).json({ success: true, message: 'Contact email sent!' });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// ✅ Export app for Vercel
export default app;
