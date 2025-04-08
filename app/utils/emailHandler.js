const nodemailer = require("nodemailer");


exports.sendSupportConnectingMail = async (userEmail) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: "casoji6215@jarars.com",
      to: userEmail,
      subject: `Thank you for connecting!`,
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                border: 1px solid #e0e0e0;
              }
              .header {
                background-color: #3498db;
                padding: 15px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
                text-align: center;
                color: #ffffff;
                font-size: 18px;
                font-weight: bold;
              }
              p {
                font-size: 16px;
                line-height: 1.5;
                color: #34495e;
                margin-bottom: 20px;
              }
              .footer {
                font-size: 12px;
                color: #7f8c8d;
                text-align: center;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">Thank You for Connecting!</div>
              <p>Hello,</p>
              <p>Thank you for reaching out to us. We have received your request, and our team will get back to you shortly.</p>
              <p>We appreciate your patience and look forward to assisting you!</p>
              <p class="footer">© 2025 Restaurent Management Systemexit
               | All Rights Reserved</p>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Thank you email sent successfully!');
  } catch (err) {
    console.error("Error sending thank you email:", err);
  }
};



exports.sendResetEmail = async (email, resetToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Hello,\n We received a request to reset your password. Please click the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this change, you can ignore this email.`,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending reset email:", err);
  }
};



