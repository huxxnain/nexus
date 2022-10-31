const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url, isAdmin, otp, status, qr) {
    this.to = user.email;
    this.firstName = isAdmin ? user.first_name : user.pharmacy_name;
    this.url = url;
    this.otp = otp;
    this.status = status;
    this.from = 'huxxnainali@gmail.com';
    this.message = user.message;
    this.email = user.email;
    this.qr = qr;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
      message: this.message,
      email: this.email,
      otp: this.otp,
      status: this.status,
      redirect:
        template == 'adminPasswordReset'
          ? `${process.env.ADMIN_FRONTEND_URL}/login`
          : `${process.env.PHARMACY_FRONTEND_URL}/login`,
      qr: this.qr,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Poll Shark Family!');
  }
  async sendAdminPasswordReset() {
    await this.send(
      'adminPasswordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  async sendAVerifyEmail() {
    await this.send('verifyEmail', 'This code  is (valid for only 1 hour)');
  }
  async sendContactEmail() {
    await this.send('contact', 'Contact Us Email');
  }

  async sendRejection() {
    await this.send('rejectedCompanyStatus', 'Pharmacy status');
  }
  async sendApproval() {
    await this.send('approvedUserStatus', 'Pharmacy status');
  }
  async sendQR() {
    await this.send('qr', 'New QR code');
  }
  async sendReuploadLink() {
    await this.send('docReupload', 'Reupload Verification Documents Link');
  }
};
