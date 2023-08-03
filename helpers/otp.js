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
        // get token
        const getToken = await axios.post('https://RestfulSms.com/api/Token', {
          UserApiKey: '4d1a116be65a637f9a8636c5',
          SecretKey: 'BargRestaurant@A!@#'
        })
    
        if (!getToken.data.IsSuccessful) {
          return false
        }
    
        const token = getToken.data.TokenKey
    
        //get lines
        const getLineNumber = await axios.get('https://RestfulSms.com/api/SMSLine', {
          headers: {
            'Content-Type': 'application/json',
            'x-sms-ir-secure-token': token
          }
        })
    
        // message details
        const data = {
          Messages: [message],
          MobileNumbers: [phoneNumber],
          LineNumber : getLineNumber.data.SMSLines[0].LineNumber,
          SendDateTime: '',
          CanContinueInCaseOfError: 'false'
        }
    
        return axios.post(`http://RestfulSms.com/api/MessageSend`, data, {
          headers: {
            'Content-Type': 'application/json',
            'x-sms-ir-secure-token': token
          }
        })
      } catch (e) {
        console.log(e)
      }
}