export default async function handler(req, res) {
if (req.method !== 'POST') {
return res.status(405).json({ message: 'Method not allowed' });
}

const { to, subject, text } = req.body;

try {
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
method: 'POST',
headers: {
'Authorization': Bearer ${process.env.SENDGRID_API_KEY},
'Content-Type': 'application/json'
},
body: JSON.stringify({
personalizations: [{ to: [{ email: to }] }],
from: { email: 'aderianwallaxaal@gmail.com' },
subject: subject,
content: [{ type: 'text/plain', value: text + '\n\nWe aim to complete your repair within 48 hours.' }]
})
});
