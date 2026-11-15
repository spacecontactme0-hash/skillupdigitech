/**
 * SkillUp Digitech Responsive Email Base Layout
 * Domain: skillup-digitech.com.ng
 */

import { getBrevoConfig } from "../client"

export interface EmailLayoutOptions {
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: "primary" | "success" | "warning" | "danger"
  contentHtml: string
  preheader?: string
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const { appUrl, senderName } = getBrevoConfig()
  const currentYear = new Date().getFullYear()

  const badgeStyles: Record<string, string> = {
    primary: "background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;",
    success: "background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;",
    warning: "background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a;",
    danger: "background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;",
  }

  const badgeHtml = options.badge
    ? `
      <div style="margin-bottom: 12px;">
        <span style="display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 9999px; ${badgeStyles[options.badgeColor || "primary"]}">
          ${options.badge}
        </span>
      </div>
    `
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${options.title}</title>
  ${options.preheader ? `<span style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">${options.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>` : ""}
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
      }
      .content-cell {
        padding: 24px 20px !important;
      }
      .header-cell {
        padding: 28px 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <!-- Card Container -->
        <table role="presentation" class="container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td class="header-cell" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e40af 100%); padding: 36px 32px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; text-transform: uppercase;">
                      ${senderName}
                    </div>
                    <div style="font-size: 13px; color: #93c5fd; margin-top: 4px; font-weight: 500; letter-spacing: 0.5px;">
                      Practical Technology Skills & Engineering Academy
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td class="content-cell" style="padding: 36px 32px; background-color: #ffffff;">
              ${badgeHtml}
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3; letter-spacing: -0.01em;">
                ${options.title}
              </h1>
              ${options.subtitle ? `<p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.5;">${options.subtitle}</p>` : ""}
              
              <div style="font-size: 15px; line-height: 1.6; color: #334155;">
                ${options.contentHtml}
              </div>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569;">
                ${senderName}
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b; line-height: 1.4;">
                Authenticated Sending Domain: <a href="https://skillup-digitech.com.ng" style="color: #2563eb; text-decoration: underline;">skillup-digitech.com.ng</a><br>
                For technical admissions, billing, or student support, contact our team.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${currentYear} ${senderName}. All rights reserved. &bull; <a href="${appUrl}/privacy" style="color: #94a3b8; text-decoration: underline;">Privacy Policy</a> &bull; <a href="${appUrl}/terms" style="color: #94a3b8; text-decoration: underline;">Terms of Service</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function renderPrimaryButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 32px 0 28px 0;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="16%" stroke="f" fillcolor="#2563eb">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${text}</center>
      </v:roundrect>
      <![endif]-->
      <a href="${url}" target="_blank" style="background-color: #2563eb; color: #ffffff; display: inline-block; font-size: 15px; font-weight: 600; line-height: 48px; text-align: center; text-decoration: none; width: auto; min-width: 200px; padding: 0 28px; border-radius: 8px; -webkit-text-size-adjust: none; mso-hide: all; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
        ${text} &rarr;
      </a>
    </div>
  `
}

