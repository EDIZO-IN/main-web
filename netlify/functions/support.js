import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import Support from '../../server/models/Support.js';

let cachedDb = null;

// Connect to MongoDB (with cache)
async function connectDB() {
  if (cachedDb) return cachedDb;
  cachedDb = await mongoose.connect(process.env.MONGODB_URI);
  return cachedDb;
}

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    await connectDB();
    const body = JSON.parse(event.body);

    const ticket = await new Support(body).save();

    // Email notification to admin
    await transporter.sendMail({
      from: `"Edizo Support Desk" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_FORM_RECIPIENT_EMAIL,
      subject: `🆘 New Support Ticket: ${ticket.subject}`,
      text: `
New support ticket received:

👤 Name: ${ticket.name}
📧 Email: ${ticket.email}
📝 Subject: ${ticket.subject}
💬 Message: ${ticket.message}
🚦 Priority: ${ticket.priority}
📄 Ticket #: ${ticket.ticketNumber}
📅 Created: ${new Date(ticket.createdAt).toLocaleString()}
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Support request submitted',
        ticketNumber: ticket.ticketNumber
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
