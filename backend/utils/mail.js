/**
 * @fileoverview Utilities for sending verification emails using SMTP.
 * Provides functions to generate verification email HTML content and send emails.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer')

// Ensure required environment variables are present
const requiredEnv = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Generates the HTML content for the verification email by reading a template file.
 * Replaces the placeholder with the verification URL.
 * @param {string} token - The verification token to include in the URL.
 * @returns {string} The HTML content of the verification email.
 * @throws Will throw an error if the template file cannot be read.
 */
function generateVerificationEmailHtml(token) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  const filePath = path.resolve(__dirname, 'email-templates/verify.html');
  try {
    return fs.readFileSync(filePath, 'utf8').replace('{{VERIFY_URL}}', verifyUrl);
  } catch (err) {
    console.error(`Error reading verification email template: ${err.message}`);
    throw err;
  }
}

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection failed:', error);
  } else {
    console.log('SMTP server ready to send messages');
  }
});

/**
 * Sends a verification email to the specified email address with the given token.
 * @param {string} email - The recipient's email address.
 * @param {string} token - The verification token to include in the email.
 */
async function sendVerificationEmail(email, token) {
  try {
    await transporter.sendMail({
      from: '"weppiXPRESS" <noreply@weppixpress.com>',
      to: email,
      subject: 'Verify your email',
      html: generateVerificationEmailHtml(token)
    });
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    throw error;
  }
}

module.exports = { sendVerificationEmail, generateVerificationEmailHtml };