const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
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


// s3 config
console.log("process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY ", process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY)
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // your AWS access id
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // your AWS access key
    signatureVersion: 'v4',
    region: 'us-east-1'
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
    return  res.status(500).json({
        msg: "Failed to send  email",
        error: error.message || "Something went wrong."
      });
    }
  },
  sendItemBuyEmail:async(user,contactNo,address,rewardItem,res)=>{
      try {
        console.log("item",user,contactNo,address)
        const info = await transporter.sendMail({
          from: process.env.BREVO_SENDER,
          to: "waleedcodistan@gmail.com",
          subject: "Reward Item Purchased",
          text: `Reward Item Purchase by ${user.email}`,
          html: `
          <p>User email is ${user.email}.</p>
          <p>Item: ${rewardItem.name}</p>
          <p>Contact No: ${contactNo}</p>
          <p>Address: ${address}</p>
      `,
        });
        console.log("Reset Password Email sent", info.messageId);
      } catch (error) {
        console.error("Failed to send email:", error);
     return  res.status(500).json({
        msg: "Failed to send  email",
        error: error.message || "Something went wrong."
      });
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
      return res.status(500).json({
        msg: "Failed to send verification email",
        error: error.message || "Something went wrong."
      });
    }
  },
  ResendVerificationEmail :  async (email, otp, res) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.BREVO_SENDER,
        to: email,
        subject: "Verify Your Account",
        html: `<p>Dear User,<br><br>
        Your otp is: <strong>${otp}</strong><br><br>
        If you did not register, please ignore this email.<br><br>
        Thank you,<br>
        The Team</p>`,
      });
      console.log("Verification Email sent", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      return res.status(500).json({
        msg: "Failed to send verification email",
        error: error.message || "Something went wrong."
      });
    }
  },
    uploadFile: async (file, access)=> {
    console.log("file ", file);
    file.name = file.name.replace(/\s/g, '');
    file.name = file.name.replace('#', '');
    file.name = file.name.replace('"', '');
    let fileName = file.name;
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    const fileNameWithoutExtension = "fileupload/" + Date.now() + "/" + file.name.substring(0, file.name.lastIndexOf('.'));
    console.log("fileNameWithoutExtension,fileExtension ", fileNameWithoutExtension, fileExtension)

    // const attempts = await getS3ObjectsCount(fileNameWithoutExtension, fileExtension)
    // console.log("attempts ", attempts)
    // if (attempts > 0) {
    //     fileName = `${fileNameWithoutExtension}(${attempts+1})${fileExtension}`;
    // }else{
    //     fileName= `${fileNameWithoutExtension}${fileExtension}`;
    // }
    fileName = `${fileNameWithoutExtension}${fileExtension}`;
    console.log("fileName ", fileName)
    if (access === "Public") {
        const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: `${fileName}`,
        };
        console.log("params ", params);
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET,
            Key: `${fileName}`,
            ContentDisposition: 'inline',
            ContentType: file.mimetype,
            Body: file.data,
            ACL: "public-read",
        };
        const data = await s3.upload(uploadParams).promise();
        console.log("data ", data);
        return data;
    } else if (access === "Private") {
        const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: `${fileName}`,
        };
        console.log("params ", params);
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET,
            Key: `${fileName}`,
            ContentDisposition: 'inline',
            ContentType: file.mimetype,
            Body: file.data,
        };
        const data = await s3.upload(uploadParams).promise();
        console.log("data ", data);
        return data;
    }
}
};


module.exports = methods;
