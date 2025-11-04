// src/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  static async sendOrderConfirmation(order, user) {
    const subject = `Your Order #${order._id} Confirmation`;
    const text = `
      Hi ${user.name},
      
      Thank you for your purchase! 🎉

      Order ID: ${order._id}
      Total: $${order.totalAmount}
      Status: ${order.status}

      We'll notify you when your order ships.
    `;

    if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"E-Shop" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject,
        text
      });

      console.log(`📧 Email sent to ${user.email} successfully.`);
    } else {
      // Dev mode: just log to console
      console.log('📧 [DEV] Email simulated:');
      console.log('To:', user.email);
      console.log('Subject:', subject);
      console.log('Body:', text);
    }
  }

  static async queueEmail(order, user) {
    console.log(`📨 Email queued for order ${order._id}`);
    setImmediate(() => this.sendOrderConfirmation(order, user));
  }
}

module.exports = EmailService;
