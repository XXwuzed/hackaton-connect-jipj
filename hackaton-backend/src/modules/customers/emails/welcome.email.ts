import { welcomeMessages as copy } from './welcome.messages';

const colors = {
  ink: '#084964',
  turquoise: '#17bfc3',
  coral: '#f57853',
  yellow: '#ffbd4b',
  paper: '#f8f5ef',
  white: '#ffffff',
  muted: '#5b7079',
  line: '#dce5e6',
};

/** Escapa los datos dinámicos antes de insertarlos en texto o atributos HTML. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character]!;
  });
}

/** Construye la bienvenida con tablas y estilos inline compatibles con correo. */
export function createWelcomeEmail(firstName: string, unsubscribeUrl: string) {
  const greeting = copy.greeting(firstName);
  const accents = [colors.turquoise, colors.coral, colors.yellow];
  const benefits = copy.benefits
    .map(
      (benefit, index) => `
          <tr>
            <td width="48" valign="top" style="padding:0 12px 22px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td width="36" height="36" align="center" bgcolor="${accents[index]}" style="border-radius:12px;color:${colors.ink};font-size:14px;font-weight:bold;">0${index + 1}</td>
              </tr></table>
            </td>
            <td valign="top" style="padding:0 0 22px;">
              <h3 style="margin:0 0 6px;font-size:16px;line-height:23px;color:${colors.ink};">${benefit.title}</h3>
              <p style="margin:0;font-size:14px;line-height:23px;color:${colors.muted};">${benefit.description}</p>
            </td>
          </tr>`,
    )
    .join('');

  return {
    subject: copy.subject,
    text: `${greeting}

${copy.title} ${copy.titleAccent}
${copy.introduction}

${copy.benefitsTitle}
${copy.benefits.map((benefit, index) => `${index + 1}. ${benefit.title}: ${benefit.description}`).join('\n')}

${copy.reminderTitle}. ${copy.reminder}

${copy.closing}
${copy.signature}

${copy.reason}
${copy.unsubscribeHelp}
${copy.unsubscribe}: ${unsubscribeUrl}

${copy.footer}`,
    html: `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${copy.subject}</title>
  <style>
    body { margin:0; padding:0; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    @media only screen and (max-width:480px) {
      .outer-pad { padding:12px 8px !important; }
      .content-pad { padding-left:24px !important; padding-right:24px !important; }
      .hero-title { font-size:32px !important; line-height:38px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${colors.paper};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;color:${colors.paper};max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${copy.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.paper}">
    <tr><td class="outer-pad" align="center" style="padding:36px 16px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.white}" style="max-width:600px;">
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="25%" height="6" bgcolor="${colors.ink}" style="font-size:0;line-height:6px;">&nbsp;</td>
            <td width="25%" height="6" bgcolor="${colors.turquoise}" style="font-size:0;line-height:6px;">&nbsp;</td>
            <td width="25%" height="6" bgcolor="${colors.coral}" style="font-size:0;line-height:6px;">&nbsp;</td>
            <td width="25%" height="6" bgcolor="${colors.yellow}" style="font-size:0;line-height:6px;">&nbsp;</td>
          </tr></table>
        </td></tr>
        <tr><td class="content-pad" style="padding:30px 40px;">
          <p style="margin:0;font-size:27px;line-height:34px;letter-spacing:-1px;font-weight:bold;color:${colors.ink};">Enlace<span style="color:${colors.coral};">Hermano</span></p>
        </td></tr>
        <tr><td class="content-pad" bgcolor="${colors.ink}" style="padding:34px 40px 38px;">
          <p style="margin:0 0 24px;color:${colors.turquoise};font-size:11px;line-height:18px;letter-spacing:2px;font-weight:bold;">${copy.status}</p>
          <p style="margin:0 0 12px;font-size:17px;line-height:26px;color:${colors.white};overflow-wrap:anywhere;">${escapeHtml(greeting)}</p>
          <h1 class="hero-title" style="margin:0 0 20px;font-size:38px;line-height:44px;letter-spacing:-1px;color:${colors.white};">${copy.title}<br><span style="color:${colors.yellow};">${copy.titleAccent}</span></h1>
          <p style="margin:0;font-size:16px;line-height:26px;color:${colors.white};">${copy.introduction}</p>
        </td></tr>
        <tr><td class="content-pad" style="padding:34px 40px 10px;">
          <h2 style="margin:0 0 26px;font-size:21px;line-height:29px;color:${colors.ink};">${copy.benefitsTitle}</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${benefits}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.paper}"><tr>
            <td style="padding:20px 22px;border-left:4px solid ${colors.coral};">
              <p style="margin:0 0 6px;font-size:15px;line-height:22px;font-weight:bold;color:${colors.ink};">${copy.reminderTitle}</p>
              <p style="margin:0;font-size:14px;line-height:23px;color:${colors.muted};">${copy.reminder}</p>
            </td>
          </tr></table>
        </td></tr>
        <tr><td class="content-pad" style="padding:22px 40px 34px;">
          <p style="margin:0 0 6px;font-size:15px;line-height:24px;color:${colors.ink};">${copy.closing}</p>
          <p style="margin:0;font-size:14px;line-height:22px;font-weight:bold;color:${colors.ink};">${copy.signature}</p>
        </td></tr>
        <tr><td class="content-pad" style="padding:24px 40px 28px;border-top:1px solid ${colors.line};">
          <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:${colors.muted};">${copy.reason}</p>
          <p style="margin:0 0 14px;font-size:12px;line-height:20px;color:${colors.muted};">${copy.unsubscribeHelp}</p>
          <a href="${escapeHtml(unsubscribeUrl)}" style="font-size:12px;line-height:20px;font-weight:bold;color:${colors.ink};text-decoration:underline;">${copy.unsubscribe}</a>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
      <p style="margin:20px 0 0;font-size:11px;line-height:18px;color:${colors.muted};">${copy.footer}</p>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
