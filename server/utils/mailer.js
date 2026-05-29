const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendVerificationCode = async (to, code) => {
  await transporter.sendMail({
    from: `"FITLOG" <${process.env.MAIL_USER}>`,
    to,
    subject: '[FITLOG] 이메일 인증 코드',
    html: `
      <div style="
        max-width:480px; margin:0 auto;
        background:#0A0A0A; border:1px solid #1E1E1E;
        border-radius:16px; padding:40px;
        font-family:-apple-system,sans-serif;
      ">
        <div style="text-align:center; margin-bottom:32px">
          <div style="
            display:inline-block;
            background:linear-gradient(135deg,#E8C96D,#B8952D);
            border-radius:10px; padding:8px 20px;
          ">
            <span style="font-size:22px;font-weight:900;color:#0A0A0A;letter-spacing:4px">
              FITLOG
            </span>
          </div>
        </div>

        <h2 style="color:#EFEFEF;font-size:18px;font-weight:700;margin:0 0 8px">
          이메일 인증 코드
        </h2>
        <p style="color:#606060;font-size:14px;margin:0 0 32px">
          아래 6자리 코드를 입력해주세요. 코드는 5분간 유효해요.
        </p>

        <div style="
          background:#141414; border:1px solid #2A2A2A;
          border-radius:12px; padding:24px;
          text-align:center; margin-bottom:32px;
        ">
          <span style="
            font-size:36px; font-weight:900;
            color:#E8C96D; letter-spacing:12px;
          ">${code}</span>
        </div>

        <p style="color:#363636;font-size:12px;margin:0">
          본인이 요청하지 않은 경우 이 이메일을 무시하세요.
        </p>
      </div>
    `,
  });
};

module.exports = { sendVerificationCode };