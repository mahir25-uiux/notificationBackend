

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ONESIGNAL_URL = 'https://api.onesignal.com/notifications';
const APP_ID = process.env.ONESIGNAL_APP_ID;
const REST_KEY = process.env.ONESIGNAL_REST_API_KEY;
const SECRET = process.env.BACKEND_API_SECRET;

app.post('/send-notification', async (req, res) => {
  const { apiSecret, title, message, type = "notice", url = "", image } = req.body;

  if (apiSecret !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
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

if (image?.trim()) {
      payload.big_picture = image; // Android
      payload.ios_attachments = { id: image }; // iOS
      payload.chrome_web_image = image; // Web
    }

    const onesignalRes = await axios.post(ONESIGNAL_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${REST_KEY}`,
      },
    });

    res.json({
      success: true,
      onesignal_id: onesignalRes.data.id,
    });

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000);