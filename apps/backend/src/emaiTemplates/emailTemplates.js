class EmailTemplates {
  // ==================== EMPLOYEE EMAIL TEMPLATES ====================

  static generateEmployeeCredentialsTemplate(options) {
    const {
      firstName,
      username,
      email,
      password,
      role,
      permissions = [],
      actionType = "created",
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);

    const actionText =
      actionType === "reset"
        ? "Your Employee Account Credentials Have Been Reset"
        : "Your Employee Account Has Been Created";

    const actionDescription =
      actionType === "reset"
        ? "Your employee account credentials have been reset. Here are your new login credentials:"
        : "Your employee account has been successfully created by admin. Here are your login credentials:";

    const dynamicMessage = customMessage || actionDescription;

    return {
      subject: `Employee Account ${actionType === "reset" ? "Credentials Reset" : "Created"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Employee Credentials</title>
            <style>
                ${this.getCommonStyles()}
                .role-info {
                  background: #e8f5e8;
                  border-left: 4px solid #28a745;
                  padding: 15px;
                  margin: 15px 0;
                  border-radius: 4px;
                }
                .permissions-list {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 15px 0;
                }
                .permission-item {
                  display: inline-block;
                  background: #4F46E5;
                  color: white;
                  padding: 4px 12px;
                  margin: 4px;
                  border-radius: 20px;
                  font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header" style="background: linear-gradient(135deg, #1e40af, #3730a3);">
                    <h1>Employee Account ${actionType === "reset" ? "Credentials Reset" : "Created"}</h1>
                    <p>${actionType === "reset" ? "Your credentials have been updated" : "Welcome to the employee portal"}</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello <strong>${formattedFirstName}</strong>,
                    </div>
                    
                    <div class="instruction-box">
                        <h3>${actionText}</h3>
                        ${dynamicMessage}
                    </div>

                    <div class="role-info">
                        <h4>👨‍💼 Assigned Role</h4>
                        <p><strong>${role}</strong></p>
                    </div>

                    ${
                      permissions.length > 0
                        ? `
                    <div class="permissions-list">
                        <h4>🔑 Assigned Permissions</h4>
                        <div>
                            ${permissions
                              .map(
                                (permission) =>
                                  `<span class="permission-item">${permission}</span>`
                              )
                              .join("")}
                        </div>
                    </div>
                    `
                        : ""
                    }
                    
                    <div class="credentials-card">
                        <h3>Your Login Credentials</h3>
                        <div class="credential-item">
                            <span class="credential-label">Username:</span>
                            <span class="credential-value">${username}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Email:</span>
                            <span class="credential-value">${email}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Password:</span>
                            <span class="credential-value">${password}</span>
                        </div>
                    </div>
                    
                    <div class="security-notice">
                        <h4>🔒 Employee Security Guidelines</h4>
                        <ul>
                            <li>Keep your credentials confidential and secure</li>
                            <li>Do not share your login details with anyone</li>
                            <li>Access only the systems and data you're authorized for</li>
                            <li>Log out when not using the system</li>
                            <li>Report any suspicious activity immediately</li>
                        </ul>
                    </div>
                    
                    <div class="support-info">
                        <p>For technical support or access issues, contact your system administrator.</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Employee System Access - Confidential</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: this.generateEmployeeCredentialsPlainText(options),
    };
  }

  // ==================== BUSINESS USER EMAIL TEMPLATES ====================

  static generateBusinessUserCredentialsTemplate(options) {
    const {
      firstName,
      username,
      email,
      password,
      transactionPin,
      actionType = "created",
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);

    const actionText =
      actionType === "reset"
        ? "Your Business Account Credentials Have Been Reset"
        : "Your Business Account Has Been Created";

    const actionDescription =
      actionType === "reset"
        ? "Your business account credentials have been reset. Here are your new login credentials:"
        : "Your business account has been successfully created. Here are your login credentials:";

    const dynamicMessage = customMessage || actionDescription;

    return {
      subject: `Business Account ${actionType === "reset" ? "Credentials Reset" : "Created"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Business Account Credentials</title>
            <style>
                ${this.getCommonStyles()}
                .business-features {
                  background: #e8f4fd;
                  border-left: 4px solid #4F46E5;
                  padding: 15px;
                  margin: 15px 0;
                  border-radius: 4px;
                }
                .feature-item {
                  display: flex;
                  align-items: center;
                  margin: 8px 0;
                }
                .feature-icon {
                  margin-right: 10px;
                  font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header" style="background: linear-gradient(135deg, #059669, #047857);">
                    <h1>Business Account ${actionType === "reset" ? "Credentials Reset" : "Created"}</h1>
                    <p>${actionType === "reset" ? "Your business credentials have been updated" : "Welcome to our business platform"}</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello <strong>${formattedFirstName}</strong>,
                    </div>
                    
                    <div class="instruction-box">
                        <h3>${actionText}</h3>
                        ${dynamicMessage}
                    </div>

                    <div class="business-features">
                        <h4>🚀 Business Account Features</h4>
                        <div class="feature-item">
                            <span class="feature-icon">💰</span>
                            <span>Wallet Management</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">🏦</span>
                            <span>Bank Account Integration</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">📊</span>
                            <span>Transaction History</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">🔐</span>
                            <span>Secure Transactions</span>
                        </div>
                    </div>
                    
                    <div class="credentials-card">
                        <h3>Your Account Credentials</h3>
                        <div class="credential-item">
                            <span class="credential-label">Username:</span>
                            <span class="credential-value">${username}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Email:</span>
                            <span class="credential-value">${email}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Password:</span>
                            <span class="credential-value">${password}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Transaction PIN:</span>
                            <span class="credential-value">${transactionPin}</span>
                        </div>
                    </div>
                    
                    <div class="security-notice">
                        <h4>🔒 Business Account Security</h4>
                        <ul>
                            <li>Your Transaction PIN is required for all financial transactions</li>
                            <li>Never share your PIN with anyone, including support staff</li>
                            <li>Enable two-factor authentication for added security</li>
                            <li>Monitor your account regularly for unusual activity</li>
                            <li>Keep your contact information up to date</li>
                        </ul>
                    </div>
                    
                    ${
                      actionType === "created"
                        ? `
                    <div class="instructions">
                        <h4>📝 Next Steps for Business Account</h4>
                        <p>Complete your KYC verification to unlock full account features and higher transaction limits.</p>
                    </div>
                    `
                        : ""
                    }
                    
                    <div class="support-info">
                        <p>For business account assistance, contact our business support team.</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Business Banking Services</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: this.generateBusinessUserCredentialsPlainText(options),
    };
  }

  // ==================== PASSWORD RESET TEMPLATES ====================

  static generatePasswordResetTemplate(options) {
    const {
      firstName,
      resetUrl,
      expiryMinutes = 2,
      supportEmail = null,
      userType = "user", // 'employee' or 'business'
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstiName);
    const expiryTime = `${expiryMinutes} minute${expiryMinutes !== 1 ? "s" : ""}`;

    const headerColor =
      userType === "employee"
        ? "linear-gradient(135deg, #1e40af, #3730a3)"
        : "linear-gradient(135deg, #059669, #047857)";

    const title =
      userType === "employee"
        ? "Employee Password Reset"
        : "Business Account Password Reset";

    return {
      subject: `${title} Instructions`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                ${this.getCommonStyles()}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header" style="background: ${headerColor};">
                    <h1>${title}</h1>
                    <p>Secure your account with a new password</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello <strong>${formattedFirstName}</strong>,
                    </div>
                    
                    <div class="instruction-box">
                        <h3>Reset Your Password</h3>
                        ${
                          customMessage ||
                          `
                        <p>We received a request to reset your password. Click the button below to create a new secure password for your account.</p>
                        `
                        }
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="reset-button" target="_blank" rel="noopener noreferrer">
                            Reset Your Password
                        </a>
                    </div>
                    
                    <div class="url-backup">
                        <p><strong>Alternative:</strong> If the button doesn't work, copy and paste this URL into your browser:</p>
                        <a href="${resetUrl}">${resetUrl}</a>
                    </div>
                    
                    <div class="expiry-warning">
                        <h4>⏰ Important Time Limit</h4>
                        <p>This password reset link will expire in <strong>${expiryTime}</strong>. For security reasons, please reset your password immediately.</p>
                    </div>
                    
                    <div class="security-notice">
                        <h4>🔒 Security Tips</h4>
                        <ul>
                            <li>Never share your password reset link with anyone</li>
                            <li>Create a strong, unique password you haven't used before</li>
                            <li>Ensure your new password is at least 8 characters long with mix of letters, numbers, and symbols</li>
                            <li>If you didn't request this reset, contact support immediately</li>
                        </ul>
                    </div>
                    
                    <div class="support-info">
                        <p>If you need help or have questions, our support team is here for you.</p>
                        ${supportEmail ? `<p>Contact us at: <a href="mailto:${supportEmail}">${supportEmail}</a></p>` : ""}
                    </div>
                    
                    <p>Best regards,<br><strong>Security Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>This is an automated security message. Please do not reply to this email.</p>
                    <p>If you didn't request a password reset, please secure your account immediately.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: this.generatePasswordResetPlainText(options),
    };
  }

  // ==================== EMAIL VERIFICATION TEMPLATES ====================

  static generateEmailVerificationTemplate(options) {
    const {
      firstName,
      verifyUrl,
      userType = "user", // 'employee' or 'business'
    } = options;

    const formattedFirstName = this.formatName(firstName);

    const headerColor =
      userType === "employee"
        ? "linear-gradient(135deg, #1e40af, #3730a3)"
        : "linear-gradient(135deg, #059669, #047857)";

    const title =
      userType === "employee"
        ? "Verify Your Employee Email"
        : "Verify Your Business Account Email";

    const platformName =
      userType === "employee" ? "Employee System" : "Business Platform";

    return {
      subject: title,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
              ${this.getCommonStyles()}
              .verification-highlight {
                background: #e8f5e8;
                border-left: 4px solid #28a745;
                padding: 15px;
                margin: 15px 0;
                border-radius: 4px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header" style="background: ${headerColor};">
                  <h1>Email Verification</h1>
                  <p>Verify your email address to access ${platformName}</p>
              </div>
              
              <div class="content">
                  <div class="greeting">
                      Hello <strong>${formattedFirstName}</strong>,
                  </div>
                  
                  <div class="instruction-box">
                      <h3>Verify Your Email Address</h3>
                      <p>Thank you for registering with our ${platformName}. Please verify your email address to complete your account setup and start using all features.</p>
                  </div>

                  <div class="verification-highlight">
                      <h4>✅ Why Verify Your Email?</h4>
                      <p>Email verification helps us ensure the security of your account and enables important features like password recovery and notifications.</p>
                  </div>
                  
                  <div style="text-align: center;">
                      <a href="${verifyUrl}" class="reset-button" target="_blank" rel="noopener noreferrer">
                          Verify Email Address
                      </a>
                  </div>
                  
                  <div class="url-backup">
                      <p><strong>Alternative:</strong> If the button doesn't work, copy and paste this URL into your browser:</p>
                      <a href="${verifyUrl}">${verifyUrl}</a>
                  </div>
                  
                  <div class="expiry-warning">
                      <h4>⏰ Important Time Limit</h4>
                      <p>This verification link will expire in <strong>24 hours</strong>. For security reasons, please verify your email immediately.</p>
                  </div>
                  
                  <div class="security-notice">
                      <h4>🔒 Security Notice</h4>
                      <ul>
                          <li>Never share your verification link with anyone</li>
                          <li>Our team will never ask for your verification code</li>
                          <li>If you didn't create this account, please ignore this email</li>
                      </ul>
                  </div>
                  
                  <div class="support-info">
                      <p>If you need help with verification, contact our support team.</p>
                  </div>
                  
                  <p>Best regards,<br><strong>${platformName} Team</strong></p>
              </div>
              
              <div class="footer">
                  <p>This is an automated verification message. Please do not reply to this email.</p>
              </div>
          </div>
      </body>
      </html>
    `,
      text: this.generateEmailVerificationPlainText(options),
    };
  }

  // ==================== PLAIN TEXT TEMPLATES ====================

  static generateEmployeeCredentialsPlainText(options) {
    const {
      firstName,
      username,
      email,
      password,
      role,
      permissions = [],
      actionType = "created",
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);

    return `
EMPLOYEE ACCOUNT ${actionType === "reset" ? "CREDENTIALS RESET" : "CREATED"}

Hello ${formattedFirstName},

${customMessage || `Your employee account has been ${actionType === "reset" ? "credentials reset" : "successfully created"}.`}

ASSIGNED ROLE: ${role}

${permissions.length > 0 ? `PERMISSIONS: ${permissions.join(", ")}\n` : ""}

YOUR LOGIN CREDENTIALS:
───────────────────────
Username: ${username}
Email: ${email}
Password: ${password}

EMPLOYEE SECURITY GUIDELINES:
─────────────────────────────
• Keep your credentials confidential and secure
• Do not share your login details with anyone
• Access only the systems and data you're authorized for
• Log out when not using the system
• Report any suspicious activity immediately

For technical support or access issues, contact your system administrator.

──────────────────────────
Employee System Access - Confidential
    `.trim();
  }

  static generateEmailVerificationPlainText(options) {
    const { firstName, verifyUrl, userType = "user" } = options;

    const formattedFirstName = this.formatName(firstName);
    const platformName =
      userType === "employee" ? "Employee System" : "Business Platform";

    return `
EMAIL VERIFICATION - ${platformName.toUpperCase()}

Hello ${formattedFirstName},

Verify Your Email Address

Thank you for registering with our ${platformName}. Please verify your email address to complete your account setup and start using all features.

WHY VERIFY YOUR EMAIL?
──────────────────────
Email verification helps us ensure the security of your account and enables important features like password recovery and notifications.

VERIFY YOUR EMAIL:
──────────────────
${verifyUrl}

IMPORTANT TIME LIMIT:
─────────────────────
This verification link will expire in 24 hours. For security reasons, please verify your email immediately.

SECURITY NOTICE:
────────────────
• Never share your verification link with anyone
• Our team will never ask for your verification code
• If you didn't create this account, please ignore this email

If you need help with verification, contact our support team.

Best regards,
${platformName} Team

──────────────────────────
This is an automated verification message. Please do not reply to this email.
  `.trim();
  }

  static generateBusinessUserCredentialsPlainText(options) {
    const {
      firstName,
      username,
      email,
      password,
      transactionPin,
      actionType = "created",
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);

    return `
BUSINESS ACCOUNT ${actionType === "reset" ? "CREDENTIALS RESET" : "CREATED"}

Hello ${formattedFirstName},

${customMessage || `Your business account has been ${actionType === "reset" ? "credentials reset" : "successfully created"}.`}

BUSINESS ACCOUNT FEATURES:
─────────────────────────
• Wallet Management
• Bank Account Integration
• Transaction History
• Secure Transactions

YOUR ACCOUNT CREDENTIALS:
─────────────────────────
Username: ${username}
Email: ${email}
Password: ${password}
Transaction PIN: ${transactionPin}

BUSINESS ACCOUNT SECURITY:
──────────────────────────
• Your Transaction PIN is required for all financial transactions
• Never share your PIN with anyone, including support staff
• Enable two-factor authentication for added security
• Monitor your account regularly for unusual activity
• Keep your contact information up to date

${
  actionType === "created"
    ? `
NEXT STEPS:
───────────
Complete your KYC verification to unlock full account features and higher transaction limits.
`
    : ""
}

For business account assistance, contact our business support team.

──────────────────────────
Business Banking Services
    `.trim();
  }

  static generatePasswordResetPlainText(options) {
    const {
      firstName,
      resetUrl,
      expiryMinutes = 2,
      supportEmail = null,
      userType = "user",
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);
    const expiryTime = `${expiryMinutes} minute${expiryMinutes !== 1 ? "s" : ""}`;
    const title =
      userType === "employee"
        ? "EMPLOYEE PASSWORD RESET"
        : "BUSINESS ACCOUNT PASSWORD RESET";

    return `
${title}

Hello ${formattedFirstName},

${customMessage || "We received a request to reset your password. Use the link below to create a new secure password for your account."}

RESET YOUR PASSWORD:
───────────────────
${resetUrl}

IMPORTANT TIME LIMIT:
─────────────────────
This password reset link will expire in ${expiryTime}. For security reasons, please reset your password immediately.

SECURITY TIPS:
──────────────
• Never share your password reset link with anyone
• Create a strong, unique password you haven't used before
• Ensure your new password is at least 8 characters long with mix of letters, numbers, and symbols
• If you didn't request this reset, contact support immediately

${supportEmail ? `If you need help, contact our support team at: ${supportEmail}\n` : ""}

Best regards,
Security Team

──────────────────────────
This is an automated security message. Please do not reply to this email.
If you didn't request a password reset, please secure your account immediately.
    `.trim();
  }

  // ==================== COMMON UTILITIES ====================

  static getCommonStyles() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
      }
      
      .header {
        color: white;
        padding: 30px 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      
      .header h1 {
        font-size: 28px;
        font-weight: 600;
        margin-bottom: 10px;
      }
      
      .header p {
        font-size: 16px;
        opacity: 0.9;
      }
      
      .content {
        padding: 30px;
        background: #ffffff;
      }
      
      .greeting {
        font-size: 18px;
        margin-bottom: 20px;
        color: #333;
      }
      
      .instruction-box {
        background: #e8f4fd;
        border-left: 4px solid #4F46E5;
        padding: 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      
      .instruction-box h3 {
        color: #4F46E5;
        margin-bottom: 10px;
        font-size: 18px;
      }
      
      .credentials-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border: 1px solid #e9ecef;
      }
      
      .credentials-card h3 {
        color: #495057;
        margin-bottom: 15px;
        font-size: 18px;
        border-bottom: 2px solid #4F46E5;
        padding-bottom: 8px;
      }
      
      .credential-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #dee2e6;
      }
      
      .credential-item:last-child {
        border-bottom: none;
      }
      
      .credential-label {
        font-weight: 600;
        color: #495057;
      }
      
      .credential-value {
        color: #212529;
        font-family: 'Courier New', monospace;
        background: #ffffff;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #dee2e6;
      }
      
      .security-notice {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
      }
      
      .security-notice h4 {
        color: #856404;
        margin-bottom: 10px;
        font-size: 16px;
      }
      
      .security-notice ul {
        margin-left: 20px;
        color: #856404;
      }
      
      .security-notice li {
        margin-bottom: 5px;
      }
      
      .reset-button {
        display: inline-block;
        background: linear-gradient(135deg, #4F46E5, #7E69E5);
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 16px;
        margin: 15px 0;
        text-align: center;
        transition: all 0.3s ease;
      }
      
      .reset-button:hover {
        background: linear-gradient(135deg, #4338CA, #6D5BD5);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      }
      
      .url-backup {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        margin: 15px 0;
        word-break: break-all;
        font-size: 14px;
        border: 1px solid #e9ecef;
      }
      
      .url-backup a {
        color: #4F46E5;
        text-decoration: none;
      }
      
      .expiry-warning {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
        color: #721c24;
      }
      
      .expiry-warning h4 {
        margin-bottom: 8px;
        font-size: 16px;
      }
      
      .instructions {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
        color: #0c5460;
      }
      
      .support-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
        text-align: center;
      }
      
      .footer {
        text-align: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #dee2e6;
        color: #6c757d;
        font-size: 14px;
      }
      
      @media (max-width: 600px) {
        .content {
          padding: 20px;
        }
        
        .header {
          padding: 20px 15px;
        }
        
        .header h1 {
          font-size: 24px;
        }
        
        .credential-item {
          flex-direction: column;
          gap: 5px;
        }
        
        .reset-button {
          display: block;
          margin: 15px auto;
        }
      }
    `;
  }

  static formatName(name) {
    if (!name) return name;
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  }
}

export default EmailTemplates;
