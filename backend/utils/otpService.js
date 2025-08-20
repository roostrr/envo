const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Twilio client configuration
const createTwilioClient = () => {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
};

// Send email OTP
const sendEmailOTP = async (email, otp, type = 'verification') => {
  try {
    const transporter = createEmailTransporter();
    
    let subject, html;
    
    if (type === 'password-reset') {
      subject = 'Password Reset OTP - University Recruitment Platform';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">University Recruitment Platform</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">
              You have requested to reset your password. Use the following OTP to complete the process:
            </p>
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; line-height: 1.6;">
              This OTP will expire in 15 minutes. If you didn't request this password reset, please ignore this email.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      subject = 'Email Verification OTP - University Recruitment Platform';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">University Recruitment Platform</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to University Recruitment Platform!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for registering with us. To complete your registration, please verify your email address using the following OTP:
            </p>
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; line-height: 1.6;">
              This OTP will expire in 10 minutes. If you didn't create an account with us, please ignore this email.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: `"University Recruitment Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;

  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email OTP');
  }
};

// Send SMS OTP
const sendSMSOTP = async (phone, otp) => {
  try {
    const client = createTwilioClient();
    
    const message = await client.messages.create({
      body: `Your University Recruitment Platform verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log('SMS sent: %s', message.sid);
    return true;

  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('Failed to send SMS OTP');
  }
};

// Generate OTP
const generateOTP = (length = 6) => {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
};

// Validate OTP format
const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

// Check if OTP is expired
const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

module.exports = {
  sendEmailOTP,
  sendSMSOTP,
  generateOTP,
  validateOTP,
  isOTPExpired
}; 