const nodemailer = require("nodemailer");


exports.sendNewPostEmail = async (emails, postTitle) => {
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
      to: emails.join(", "),
      subject: `✨ Checkout New Post `,
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
              .cta-button {
                display: inline-block;
                padding: 10px 20px;
                font-size: 16px;
                color: #ffffff;
                background-color: #3498db;
                border-radius: 5px;
                text-decoration: none;
                text-align: center;
              }
              .cta-button:hover {
                background-color: #2980b9;
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
              <div class="header">✨ New Post! </div>
              <p>Hello,</p>
              <p>We are excited to inform you that a new <strong>content</strong>  <strong>${postTitle}</strong> has been posted.</p>
              <p>You can view the content by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="http://82.29.167.130:3000" class="cta-button">View Now</a>
              </div>
              <p>Thank you for staying connected with <strong>Ambedkar Janmbhoomi Trust</strong>.</p>
              <p class="footer">© 2025 Ambedkar Janmbhoomi Trust | All Rights Reserved</p>
            </div>
          </body>
        </html>
      `,
    };
    
  
    
    

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending post email:", err);
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



