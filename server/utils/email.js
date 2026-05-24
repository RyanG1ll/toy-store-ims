const nodemailer = require('nodemailer');

// Create reusable transporter using SMTP configuration from environment variables
// Uses Gmail SMTP by default but can be configured for any provider
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the SMTP connection on startup so errors are visible in the console
transporter.verify()
  .then(() => console.log('SMTP connection verified — email service is ready'))
  .catch((err) => console.error('SMTP connection failed:', err.message));

/**
 * Sends a verification email to the user with a unique token link.
 * The link directs them to the client-side verification page which
 * then calls the backend API to confirm the token.
 *
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name for personalisation
 * @param {string} token - Unique verification token
 */
async function sendVerificationEmail(email, firstName, token) {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `Toy Store IMS <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Toy Store IMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4a90d9; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Toy Store IMS</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${firstName}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Thank you for creating an account with the Toy Store Inventory Management System.
            Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background: #4a90d9; color: #ffffff; padding: 14px 32px; text-decoration: none;
                      border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #4a90d9; font-size: 14px; word-break: break-all;">
            ${verificationUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            This verification link will expire in 24 hours. If you did not create an account,
            please ignore this email.
          </p>
        </div>
      </div>
    `,
    text: `Welcome, ${firstName}!\n\nPlease verify your email address by visiting this link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Verification email sent:', info.messageId);
  return info;
}

module.exports = { sendVerificationEmail, transporter };
