
import fs from 'fs';
import path from 'path';

// Mock formatBrandedText
const formatBrandedText = (text) => {
    if (!text) return '';
    const pattern = /(budol)(_?)([a-zA-Z₱]+)/gi;
    if (!pattern.test(text)) return text;
    pattern.lastIndex = 0;
    return text.replace(pattern, (match, p1, p2, p3) => {
        const budolPart = "budol";
        let suffixPart = p3;
        const suffixLower = suffixPart.toLowerCase();
        let suffixColor = "#f43f5e"; 
        if (suffixLower === "shap") { suffixPart = "Shap"; suffixColor = "#10b981"; }
        return `<span style="font-weight: 600;">${budolPart}</span><span style="font-weight: 600; color: ${suffixColor};">${suffixPart}</span>`;
    });
};

// Updated getHtmlTemplate matching lib/email.js
const getHtmlTemplate = (title, content, heading, options = {}) => {
    const currentYear = new Date().getFullYear()
    const { backgroundImage, contentColor } = options

    const logoHtml = `
        <img src="https://res.cloudinary.com/dasfwpg7x/image/upload/v1771164945/budolshap/assets/budolshap_logo_transparent.png" alt="budolShap" style="height: 70px; vertical-align: middle;">
    `
    const brandLightGreen = '#c1f3d3'; // emerald-200
    const headerMidGreen = '#a7f1c2ff'; // Header color from lib/email.js

    const containerStyle = backgroundImage 
        ? `max-width: 600px; margin: 40px auto; background-image: url('${backgroundImage}'); background-size: 100% 100%; background-repeat: no-repeat; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);`
        : `max-width: 600px; margin: 40px auto; background-color: ${brandLightGreen}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);`

    const footerStyle = 'background-color: #242424ff; padding: 24px 40px; text-align: center; color: #e2e8f0; font-size: 12px; border-top: 1px solid #1e293b;'

    const headerStyle = `background-color: ${headerMidGreen}; padding: 40px 40px 20px 40px; text-align: center;`
        
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }
                .container { ${containerStyle} }
                .header { ${headerStyle} }
                .content { background-color: ${brandLightGreen}; padding: 20px 40px 0px 40px; color: ${contentColor || '#334155'}; overflow: hidden; }
                .button { display: inline-block; background-color: #16a34a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; font-size: 16px; }
                .footer { ${footerStyle} }
                .footer p { color: #e2e8f0; }
                .link { color: #16a34a; word-break: break-all; font-weight: 500; }
                h1 { color: #1e293b; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.025em; display: inline-block; vertical-align: middle; margin-right: 8px; }
                p { margin-bottom: 16px; color: inherit; }
                .info-box { background: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; }
                .logo-container { display: inline-block; vertical-align: middle; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    ${heading
            ? `<h1>${heading}</h1> <div class="logo-container">${logoHtml}</div>`
            : `<div class="logo-container">${logoHtml}</div>`
        }
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>&copy; ${currentYear} ${formatBrandedText('budolShap')}. All rights reserved.</p>
                    <p>This email was sent to you because you signed up for ${formatBrandedText('budolShap')}.</p>
                    <span style="display:none; font-size:0; line-height:0; max-height:0; mso-hide:all; overflow:hidden;">${Date.now()}</span>
                </div>
            </div>
        </body>
        </html>
    `
}

const otp = "123456";
const name = "Tony Stark";
// Testing WITH background image to ensure content color overrides it
const bgImage = 'https://res.cloudinary.com/dasfwpg7x/image/upload/budolshap/assets/email_background_1.png';

const html = getHtmlTemplate(
    'Verification Code - budolShap',
    `
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 24px 48px; background-color: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #16a34a;">${otp}</span>
            </div>
        </div>
        <p>Please enter this code on the verification page to continue accessing the App.</p>
        <p style="font-size: 12px; margin-top: 30px; opacity: 0.8;">
            This code will expire in 10 minutes. If you didn't request this, please ignore this email.
        </p>
    `,
    'Verification Code',
    {
        backgroundImage: bgImage
    }
);

const outputPath = path.join(process.cwd(), 'email_preview_content_fix.html');
fs.writeFileSync(outputPath, html);
console.log(`Email preview saved to ${outputPath}`);
