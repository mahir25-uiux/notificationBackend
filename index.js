require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Constants
const ONESIGNAL_URL = 'https://api.onesignal.com/notifications';
const APP_ID = process.env.ONESIGNAL_APP_ID;
const REST_KEY = process.env.ONESIGNAL_REST_API_KEY;
const SECRET = process.env.BACKEND_API_SECRET;

// ✅ Health Check (important for uptime robot)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ✅ Send Notification API
app.post('/send-notification', async (req, res) => {
  const {
    apiSecret,
    title,
    message,
    type = "notice",
    url = "",
    image = ""
  } = req.body;

  // 🔐 Security check
  if (apiSecret !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ❗ Validation
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message required' });
  }

  // 📦 Payload
  let payload = {
    app_id: APP_ID,
    included_segments: ["All"],
    headings: { en: title },
    contents: { en: message },
    data: {
      type,
      url,
    },
  };

  // 🖼️ Image support
  if (image?.trim()) {
    payload.big_picture = image; // Android
    payload.ios_attachments = { id: image }; // iOS
    payload.chrome_web_image = image; // Web
  }

  try {
    // ⚡ Instant response (UX fast)
    res.json({
      success: true,
      message: "Notification sending started..."
    });

    // 🔥 Background process (non-blocking)
    axios.post(ONESIGNAL_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${REST_KEY}`,
      },
      timeout: 15000, // 15 sec safety
    })
    .then((response) => {
      console.log("✅ Notification Sent:", response.data.id);
    })
    .catch((err) => {
      console.error("❌ OneSignal Error:",
        err.response?.data || err.message
      );
    });

  } catch (err) {
    console.error("❌ Server Error:", err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});