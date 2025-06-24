import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import Internship from '../../server/models/Internship.js';

let cachedDb = null;

// MongoDB connection cache
async function connectDB() {
  if (cachedDb) return cachedDb;
  cachedDb = await mongoose.connect(process.env.MONGODB_URI);
  return cachedDb;
}

// Email transporter
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

    const data = JSON.parse(event.body);

    const application = await new Internship(data).save();

    // Send confirmation email to admin
    await transporter.sendMail({
      from: `"Edizo Internship App" <${process.env.EMAIL_USER}>`,
      to: process.env.INTERNSHIP_RECIPIENT_EMAIL,
      subject: `📄 New Internship Application: ${application.name}`,
      text: `
New Internship Application Received:

👤 Name: ${application.name}
📧 Email: ${application.email}
📞 Phone: ${application.phone || 'N/A'}
🎓 Education: ${application.education}
💼 Experience: ${application.experience || 'N/A'}
📄 Position: ${application.position}
🔗 Resume: ${application.resumeUrl}
🆔 Application #: ${application.applicationNumber}
🕒 Date: ${new Date(application.createdAt).toLocaleString()}
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Internship application submitted successfully',
        applicationNumber: application.applicationNumber
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
