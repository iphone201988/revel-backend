export const sendOtpToEmail = ( otp)=> `
<div style="font-family:Arial, sans-serif; padding:20px; line-height:1.6;">
  <h2 style="color:#333;">Verify Your Email</h2>

  <p>Hello,</p>

  <p>Use the verification code below to confirm your email change request:</p>

  <div style="font-size:28px; font-weight:bold; letter-spacing:4px; margin:20px 0;">
    ${otp}
  </div>

  <p>This code is <strong>valid for 10 minutes</strong>.</p>

  <p>If you did not request this email change, please ignore this message.</p>

  <p style="margin-top:30px;">Best Regards,<br>Your App Team</p>
</div>
`;

export const subjectForSendingMail= ()=>{
    return "Verify Your Email Address"
}

export const textForVerifyMail = ()=>{
    return `
Enter this code to verify your new email address.
This code is valid for 10 minutes.
`;
}

export const setPasswordLink = (setLink)=>{
  return `   <div style="font-family:Arial, sans-serif; padding:20px; line-height:1.6;">
    <h2 style="color:#333;">Set Your Password</h2>

    <p>You have requested to Set your password. Click the button below to proceed:</p>

    <a href="${setLink}" 
       style="display:inline-block; padding:12px 20px; background:#4f46e5; color:#fff; 
              text-decoration:none; border-radius:6px; font-weight:bold; margin:16px 0;">
      Set Password
    </a>
    <p>This link is <strong>valid for 1 hour minutes</strong>.</p>



    <p style="margin-top:30px;">Best Regards,<br>Revel Team</p>
  </div>
  `
}