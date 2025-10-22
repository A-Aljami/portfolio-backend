import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import axios from 'axios';

dotenv.config();

const app = express();

// ✅ FIX 1: Request size limit (prevent large payloads)
app.use(express.json({ limit: '10kb' }));

// ✅ FIX 2: Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Dynamic CORS - supports multiple domains and explicit preflight
const allowedOrigins = (process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',')
  : ['http://localhost:5173', 'https://alialjami.dev', 'https://www.alialjami.dev']
).map(o => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ FIX 3: Enhanced rate limiting (by IP + email)
const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: { 
    success: false, 
    error: 'Too many requests. Please wait 60 seconds before sending another message.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by both IP and email
    return `${req.ip}-${req.body.email || 'unknown'}`;
  }
});

// ✅ FIX 4: Daily limit per IP
const dailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 25, // Max 10 emails per day per IP
  message: { 
    success: false, 
    error: 'Daily limit reached. Please try again tomorrow.' 
  }
});

// ✅ FIX 5: Enhanced email validation (prevent injection)
const validateEmail = (email) => {
  // Check basic format
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  
  // Check for header injection attempts
  const dangerousChars = /[\r\n\0%]/;
  if (dangerousChars.test(email)) return false;
  
  // Max email length
  if (email.length > 100) return false;
  
  return true;
};

// ✅ FIX 6: Enhanced input sanitization
const sanitizeInput = (str) => {
  return str
    .trim()
    .replace(/[<>'"]/g, '') // Remove HTML/script tags
    .replace(/[\r\n]{3,}/g, '\n\n') // Limit newlines
    .substring(0, 10000); // Hard limit
};

// reCAPTCHA verification
const verifyCaptcha = async (token) => {
  if (!token) return false;
  
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );
    
    // Score between 0.0 (bot) and 1.0 (human)
    // Accept if score >= 0.3 (lowered for testing)
    console.log('reCAPTCHA score:', response.data.score);
    return response.data.success && response.data.score >= 0.3;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
};

// ✅ FIX 7: Validate name fields (prevent injection)
const validateName = (name) => {
  // Only letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 50;
};

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Verify transporter configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// ✅ FIX 8: Apply both rate limiters
app.post('/api/send-email', dailyLimiter, emailLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, message, captchaToken } = req.body;

    // ✅ Verify reCAPTCHA FIRST
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      console.log('⚠️ reCAPTCHA verification failed');
      return res.status(400).json({ 
        success: false, 
        error: 'Security verification failed. Please try again.' 
      });
    }

    console.log('✅ reCAPTCHA verified');

    // ✅ FIX 9: Enhanced validation
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Validate names
    if (!validateName(firstName)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid first name format' 
      });
    }

    if (!validateName(lastName)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid last name format' 
      });
    }

    // Validate email with injection checks
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Message validation
    if (message.length < 10 || message.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message must be between 10 and 1000 characters' 
      });
    }

    // Check for spam patterns
    const spamWords = ['viagra', 'casino', 'lottery', 'prince', 'inheritance'];
    const lowerMessage = message.toLowerCase();
    if (spamWords.some(word => lowerMessage.includes(word))) {
      console.log('⚠️ Spam detected from:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Message contains prohibited content' 
      });
    }

    // Check for excessive caps
    const capsPercentage = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsPercentage > 0.7 && message.length > 20) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please avoid excessive caps lock' 
      });
    }

    // ✅ FIX 10: Enhanced sanitization
    const sanitizedData = {
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      email: email.toLowerCase().trim(),
      message: sanitizeInput(message)
    };

    console.log('📧 Attempting to send email...');
    console.log('From:', process.env.EMAIL_USER);
    console.log('To:', process.env.EMAIL_USER);
    console.log('Reply-To:', sanitizedData.email);

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: sanitizedData.email,
      subject: `🚀 New Portfolio Contact from ${sanitizedData.firstName} ${sanitizedData.lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4; }
            .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 30px 20px; }
            .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
            .info-label { font-weight: bold; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .info-value { color: #333333; font-size: 16px; margin-bottom: 10px; }
            .message-box { background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 4px; margin-top: 20px; }
            .message-label { font-weight: bold; color: #667eea; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; }
            .message-content { color: #333333; font-size: 15px; line-height: 1.6; white-space: pre-wrap; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666666; font-size: 12px; border-top: 1px solid #e0e0e0; }
            .reply-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; font-weight: bold; }
            .timestamp { color: #999999; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🚀 New Portfolio Contact</h1>
              <p>Someone is interested in working with you!</p>
            </div>
            <div class="content">
              <div class="info-box">
                <div class="info-label">👤 Contact Name</div>
                <div class="info-value">${sanitizedData.firstName} ${sanitizedData.lastName}</div>
                <div class="info-label">📧 Email Address</div>
                <div class="info-value">
                  <a href="mailto:${sanitizedData.email}" style="color: #667eea; text-decoration: none;">
                    ${sanitizedData.email}
                  </a>
                </div>
                <div class="timestamp">
                  📅 Received: ${new Date().toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div class="message-box">
                <div class="message-label">💬 Message</div>
                <div class="message-content">${sanitizedData.message}</div>
              </div>
              <center>
                <a href="mailto:${sanitizedData.email}?subject=Re: Portfolio Contact" class="reply-button">
                  Reply to ${sanitizedData.firstName}
                </a>
              </center>
            </div>
            <div class="footer">
              <p>This message was sent from your portfolio contact form</p>
              <p>🌐 <strong>ALI.DEV</strong> Portfolio</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Email sent successfully from:', sanitizedData.email);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    // ✅ FIX 11: Enhanced error logging
    console.error('❌ Email sending failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email. Please try again later.' 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});