import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server configuration error:', error);
    return false;
  }
};

// Send email to site owner (form submission notification)
export const sendContactNotification = async (formData: {
  name: string;
  email: string;
  message: string;
}) => {
  const { name, email, message } = formData;
  
  const mailOptions = {
    from: `"Rollerstat Contact Form" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #057ec8; border-bottom: 2px solid #057ec8; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Contact Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #057ec8;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Submitted:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from the Rollerstat contact form.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Contact notification sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send contact notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Send auto-reply to user
export const sendAutoReply = async (userEmail: string, userName: string) => {
  const mailOptions = {
    from: `"Rollerstat" <${process.env.CONTACT_EMAIL || 'noreply@rollerstat.com'}>`,
    to: userEmail,
    subject: 'Thank you for contacting Rollerstat',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #057ec8; margin: 0;">Rollerstat</h1>
          <p style="color: #666; margin: 5px 0;">Your Source for Roller Hockey News</p>
        </div>
        
        <h2 style="color: #333;">Thank you for reaching out, ${userName}!</h2>
        
        <p>We've received your message and will get back to you as soon as possible. Our team typically responds within 24 hours.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #057ec8; margin-top: 0;">What happens next?</h3>
          <ul style="color: #333;">
            <li>We'll review your message carefully</li>
            <li>Our team will prepare a detailed response</li>
            <li>You'll receive a reply at this email address</li>
          </ul>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h4 style="color: #333; margin-top: 0;">In the meantime, check out:</h4>
          <p style="margin: 5px 0;">
            <a href="https://rollerstat.com/news" style="color: #057ec8; text-decoration: none;">📰 Latest News</a>
          </p>
          <p style="margin: 5px 0;">
            <a href="https://rollerstat.com/blogs" style="color: #057ec8; text-decoration: none;">📝 Blog Posts</a>
          </p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            Best regards,<br>
            The Rollerstat Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Auto-reply sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send auto-reply:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
