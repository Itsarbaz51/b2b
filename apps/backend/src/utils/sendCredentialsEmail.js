import EmailTemplates from "../emaiTemplates/EmailTemplates.js";
import Helper from "./helper.js";

export async function sendCredentialsEmail(
  user,
  password,
  transactionPin,
  actionType = "created",
  customMessage = null,
  userType = "business", // 'business' or 'employee'
  additionalData = {} // { role, permissions } for employees
) {
  try {
    let emailContent;

    if (userType === "employee") {
      emailContent = EmailTemplates.generateEmployeeCredentialsTemplate({
        firstName: user.firstName,
        username: user.username,
        email: user.email,
        password: password,
        role: additionalData.role || user.role?.name || "Employee",
        permissions: additionalData.permissions || [],
        actionType: actionType,
        customMessage: customMessage,
      });
    } else {
      emailContent = EmailTemplates.generateBusinessUserCredentialsTemplate({
        firstName: user.firstName,
        username: user.username,
        email: user.email,
        password: password,
        transactionPin: transactionPin,
        actionType: actionType,
        customMessage: customMessage,
      });
    }

    await Helper.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  } catch (emailError) {
    console.error(`Failed to send ${userType} credentials email:`, {
      userId: user.id,
      email: user.email,
      actionType: actionType,
      error: emailError.message,
    });
    throw emailError;
  }
}

export async function sendPasswordResetEmail(
  user,
  resetUrl,
  userType = "business",
  customMessage = null
) {
  try {
    const emailContent = EmailTemplates.generatePasswordResetTemplate({
      firstName: user.firstName,
      resetUrl: resetUrl,
      userType: userType,
      customMessage: customMessage,
    });

    await Helper.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  } catch (emailError) {
    console.error(`Failed to send ${userType} password reset email:`, {
      userId: user.id,
      email: user.email,
      error: emailError.message,
    });
    throw emailError;
  }
}
