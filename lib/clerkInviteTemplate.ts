const SLUG = "invitation";
const MARKER = "harrison-portal-invite";

function requiredVars(template: { subject?: string; body?: string; markup?: string }) {
  const found = `${template.subject || ""} ${template.body || ""} ${template.markup || ""}`.match(/\{\{[^}]+\}\}/g) || [];
  return [...new Set(found)];
}

/** Clerk sends its own invitation mail when Resend isn't configured. Restyle that template so it isn't the default Clerk card. */
export async function brandClerkInvitationTemplate() {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) return;

  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const current = await fetch(`https://api.clerk.com/v1/templates/email/${SLUG}`, { headers });
  if (!current.ok) {
    console.error("Clerk invitation template lookup failed", current.status);
    return;
  }
  const template = (await current.json()) as {
    name?: string;
    subject?: string;
    body?: string;
    markup?: string;
    from_email_name?: string;
    reply_to_email_name?: string;
    delivered_by_clerk?: boolean;
  };
  if (`${template.body || ""} ${template.markup || ""}`.includes(MARKER)) return;

  const button = `<a href="{{action_url}}" style="display:inline-block;background:#3bb143;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:999px;">Open the portal</a>`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <!-- ${MARKER} -->
  <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#16191f;">Harrison <span style="color:#3bb143;">Warburton</span></p>
  <p style="margin:0 0 16px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8d95a6;">Client portal</p>
  <p style="margin:0 0 8px;font-size:18px;color:#16191f;">You're invited to the client portal</p>
  <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#3a4150;">Use the button to create your sign-in and view hours, invoices and payments. Open it on this email address.</p>
  ${button}
  <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8d95a6;">If the button doesn't work, copy this link into your browser:<br>{{action_url}}</p>
</div>`;
  const extras = requiredVars(template)
    .filter((variable) => variable !== "{{action_url}}" && !html.includes(variable))
    .map((variable) => `<span style="display:none">${variable}</span>`)
    .join("");
  const markup = html + extras;

  const base = {
    name: template.name || "Invitation",
    subject: template.subject || "Your client portal is ready",
    from_email_name: template.from_email_name,
    reply_to_email_name: template.reply_to_email_name,
    delivered_by_clerk: template.delivered_by_clerk ?? true,
  };

  const attempts = [
    { ...base, body: markup, markup },
    { ...base, body: markup },
  ];
  for (const payload of attempts) {
    const saved = await fetch(`https://api.clerk.com/v1/templates/email/${SLUG}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (saved.ok) return;
    const detail = await saved.text();
    console.error("Clerk invitation template update failed", saved.status, detail.slice(0, 500));
  }
}
