import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store for verification codes
// Format: email -> { code, expiresAt, lastSentAt }
const verificationCodes = new Map<string, { code: string, expiresAt: number, lastSentAt: number }>();

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Email Configuration
  const transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // QQ 邮箱授权码
    },
  });

  // API Routes
  app.post('/api/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const now = Date.now();
    const entry = verificationCodes.get(email);

    // Rate limiting: 60 seconds
    if (entry && now - entry.lastSentAt < 60000) {
      return res.status(429).json({ error: 'Please wait for 60 seconds before requesting again' });
    }

    const code = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, {
      code,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes
      lastSentAt: now
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
      return res.json({ message: 'Code sent (Development Mode)' });
    }

    try {
      await transporter.sendMail({
        from: `"声隙 APP" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '您的验证码 - 声隙',
        text: `您的验证码是：${code}，有效期 5 分钟。请勿告诉他人。`,
        html: `<b>您的验证码是：${code}</b><p>有效期 5 分钟。请勿告诉他人。</p>`,
      });
      res.json({ message: 'Verification code sent' });
    } catch (error) {
      console.error('Failed to send email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    const entry = verificationCodes.get(email);

    if (!entry) return res.status(404).json({ error: 'No code requested for this email' });
    if (Date.now() > entry.expiresAt) {
      verificationCodes.delete(email);
      return res.status(410).json({ error: 'Code expired' });
    }
    if (entry.code !== code) return res.status(401).json({ error: 'Invalid code' });

    verificationCodes.delete(email);
    res.json({ success: true, message: 'Verified successfully' });
  });

  app.post('/api/invite-email', async (req, res) => {
    const { email, contactName, recordUrl, inviteCode } = req.body;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Invitation sent to ${email} for ${contactName}. Link: ${recordUrl}`);
      return res.json({ message: 'Invitation sent (Development Mode)' });
    }

    try {
      await transporter.sendMail({
        from: `"声隙 APP" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `声隙邀请 - ${contactName} 邀请您进行声纹录制`,
        html: `
          <h3>您好，</h3>
          <p>声隙用户 <b>${contactName}</b> 邀请您协助完成声纹验证录制。</p>
          <p>请点击下方链接开始录制：</p>
          <a href="${recordUrl}">${recordUrl}</a>
          <p>录制完成后，请告知邀请方您的<b>确认码：${inviteCode}</b></p>
          <p>祝好，<br/>声隙团队</p>
        `,
      });
      res.json({ message: 'Invitation email sent' });
    } catch (error) {
      console.error('Failed to send invitation:', error);
      res.status(500).json({ error: 'Failed to send invitation' });
    }
  });

  // Simple signaling logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('signal', ({ roomId, data }) => {
      // Forward signaling data (offer, answer, candidates) to others in the room
      socket.to(roomId).emit('signal', { from: socket.id, data });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
