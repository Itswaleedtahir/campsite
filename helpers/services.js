const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_PASS,
  },
});
const methods = {
  sendResetPasswordMail: async (email, token, res) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.BREVO_SENDER,
        to: email,
        subject: "Reset your Password",
        text: "Reset your forgotten Password",
        html: `<p>Dear User,<br><br>
        We received a request to reset your password. Click the link below to choose a new password:<br><br>
        <button><a href="https://yourapp.com/reset-password?token=${token}">Reset Password</a></button><br><br>
        If you did not request a password reset, please ignore this email.<br><br>
        Thank you,<br>
        The Team</p>`,
      });
      console.log("Reset Password Email sent", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  },
  sendVerificationEmail :  async (email, otp, res) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.BREVO_SENDER,
        to: email,
        subject: "Verify Your Account",
        html: `<p>Dear User,<br><br>
        Thank you for registering. Please enter the following OTP to verify your account: <strong>${otp}</strong><br><br>
        If you did not register, please ignore this email.<br><br>
        Thank you,<br>
        The Team</p>`,
      });
      console.log("Verification Email sent", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      res.status(500).json({
        msg: "Failed to send verification email",
        error: error.message || "Something went wrong."
      });
    }
  }
};
module.exports = methods;
