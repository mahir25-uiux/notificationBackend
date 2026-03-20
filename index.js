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
  const { apiSecret, title, message, player_ids, included_segments } = req.body;

  // Security check
  if (apiSecret !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized! Secret key galat hai.' });
  }

  if (!title || !message) {
    return res.status(400).json({ error: 'Title aur message dono bhejo' });
  }

  // Targeting decide karo
  let targeting = {};
  if (player_ids && Array.isArray(player_ids) && player_ids.length > 0) {
    targeting.include_player_ids = player_ids;
  } else if (included_segments) {
    targeting.included_segments = Array.isArray(included_segments) 
      ? included_segments 
      : [included_segments];
  } else {
    return res.status(400).json({ error: 'player_ids ya included_segments bhejo' });
  }

  const payload = {
    app_id: APP_ID,
    target_channel: 'push',
    headings: { en: title },
    contents: { en: message },
    ...targeting
    // extra fields add kar sakta hai jaise url, data, etc.
  };

  try {
    const onesignalRes = await axios.post(ONESIGNAL_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${REST_KEY}`
      }
    });

    res.json({
      success: true,
      message: 'Notification bhej diya!',
      onesignal_id: onesignalRes.data.id
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ 
      error: 'OneSignal se error aaya', 
      details: error.response?.data || error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend chal raha hai: http://localhost:${PORT}`);
  console.log('Flutter web se /send-notification pe POST call karo');
});