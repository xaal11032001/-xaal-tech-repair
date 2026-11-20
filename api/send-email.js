export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    to,
    subject,
    ticketRef,
    date,
    name,
    phone,
    service,
    price,
    handover,
    notes
  } = req.body || {};

  // Validate required fields
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ message: 'A valid recipient email address is required' });
  }

  if (!ticketRef || !name || !service) {
    return res.status(400).json({ message: 'Missing required booking fields (ticketRef, name, or service)' });
  }

  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({ message: 'SENDGRID_API_KEY is not configured' });
  }

  const workshopEmail = 'aderianwallaxaal@gmail.com';
  const intakeDate = date || new Date().toLocaleDateString('en-GB');
  const emailSubject = subject || `Xaal Tech Repair — Booking Confirmation (${ticketRef})`;

  const formattedBody = [
    `Hi ${name},`,
    ``,
    `Thank you for booking with Xaal Tech Repair. Your repair intake ticket has been generated — please keep this reference for drop-off, collection, or status updates.`,
    ``,
    `================================================`,
    `XAAL TECH REPAIR — INTAKE RECEIPT`,
    `================================================`,
    `Ticket Reference : ${ticketRef}`,
    `Intake Date      : ${intakeDate}`,
    `Client Name      : ${name}`,
    `Contact Phone    : ${phone || 'Not provided'}`,
    `Contact Email    : ${to}`,
    `------------------------------------------------`,
    `Service          : ${service}`,
    `Estimated Price  : ${price || 'Quoted upon diagnostic'}`,
    `Handover Method  : ${handover || 'Workshop Drop-Off'}`,
    notes ? `Device / Notes   : ${notes}` : null,
    `------------------------------------------------`,
    `Warranty         : 90-Day Parts & Workmanship Included`,
    `================================================`,
    ``,
    `We aim to complete your repair within 48 hours of device intake. If any replacement parts are required, we will contact you for approval before proceeding.`,
    ``,
    `Need to update your booking? Reply to this email or call/text 07724 631623.`,
    ``,
    `Best regards,`,
    `Xaal Tech Repair`,
    `Potters Bar, Hertfordshire`
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to, name }],
            // Avoid SendGrid duplicate recipient error if customer uses the same email as workshopEmail
            ...(to.toLowerCase() !== workshopEmail.toLowerCase()
              ? { bcc: [{ email: workshopEmail, name: 'Xaal Tech Repair Workshop' }] }
              : {}),
            subject: emailSubject
          }
        ],
        from: {
          email: workshopEmail,
          name: 'Xaal Tech Repair'
        },
        reply_to: {
          email: workshopEmail,
          name: 'Xaal Tech Repair'
        },
        content: [
          {
            type: 'text/plain',
            value: formattedBody
          }
        ]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({
        message: 'SendGrid rejected the email request',
        details: errorBody
      });
    }

    return res.status(200).json({
      message: 'Confirmation email sent successfully',
      ticketRef
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to send confirmation email',
      error: error.message
    });
  }
}
