const { default: axios } = require('axios');
const nodemailer = require('nodemailer')


module.exports.sendMail = async (options) => {
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASS,
    },
  });

  let info = await transporter.sendMail(options);

  console.log(`Message sent: ${info.messageId}`); // message sent
}

module.exports.sendSms = async (phoneNumber, message) => {
  try {
    // message details
    const data = {
      op: "pattern",
      user: process.env.OTP_USER,
      pass: process.env.OTP_PASSWORD,
      message: message,
      fromNum: "3000505",
      patternCode: process.env.PATTERN_CODE,
      toNum: phoneNumber,
      inputData: [
        { "verification-code": message }
      ]
    }

    await axios.post('http://ippanel.com/api/select', data)
  } catch (e) {
    console.log(e)
  }
}