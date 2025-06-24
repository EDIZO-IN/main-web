import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import Contact from '../../server/models/Contact.js';

let cached = null;

async function connectDB() {
  if (cached) return cached;
  cached = await mongoose.connect(process.env.MONGODB_URI);
  return cached;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await connectDB();
    const data = JSON.parse(event.body);

    const contact = await new Contact(data).save();

    await transporter.sendMail({
      from: `"Edizo Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_FORM_RECIPIENT_EMAIL,
      subject: `New Contact: ${data.subject}`,
      text: `
        Name: ${data.name}
        Email: ${data.email}
        Phone: ${data.phone || 'N/A'}
        Message: ${data.message}
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Contact form submitted and email sent.'
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
