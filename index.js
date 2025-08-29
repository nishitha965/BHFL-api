// index.js
require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// --- Config (set these in env or defaults for quick testing) ---
const FULL_NAME = process.env.FULL_NAME || 'john doe'; // set your full name
const DOB = process.env.DOB || '17091999';            // ddmmyyyy - required format
const EMAIL = process.env.EMAIL || 'john@xyz.com';
const ROLL_NUMBER = process.env.ROLL_NUMBER || 'ABCD123';

function makeUserId(fullName, dob) {
  // normalize to lowercase, replace spaces with underscores
  return `${fullName.trim().toLowerCase().replace(/\s+/g, '_')}_${dob}`;
}

// Helper regexes
const intRegex = /^-?\d+$/;           // integers, optional leading minus
const alphaOnly = /^[A-Za-z]+$/;

app.post('/bfhl', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.data)) {
      return res.status(400).json({
        is_success: false,
        user_id: makeUserId(FULL_NAME, DOB),
        email: EMAIL,
        roll_number: ROLL_NUMBER,
        message: "`data` field is required and must be an array"
      });
    }

    const data = payload.data;
    const even_numbers = [];
    const odd_numbers = [];
    const alphabets = [];
    const special_characters = [];

    // Flatten all alphabetical characters (preserve order)
    const lettersSequence = [];
    let sum = 0;

    data.forEach(item => {
      const s = String(item);

      // If it's an integer numeric token
      if (intRegex.test(s)) {
        const n = parseInt(s, 10);
        sum += n;
        if (Math.abs(n) % 2 === 0) even_numbers.push(s); // keep as string
        else odd_numbers.push(s);
        // integers don't contribute letters
      }
      // If token is alphabet only
      else if (alphaOnly.test(s)) {
        alphabets.push(s.toUpperCase());
        // push each letter (preserve original order & original case for later)
        s.split('').forEach(ch => lettersSequence.push(ch));
      }
      // Mixed or special tokens
      else {
        // extract letters (if any) for concat_string
        const letters = s.match(/[A-Za-z]/g);
        if (letters) letters.forEach(ch => lettersSequence.push(ch));
        // treat the entire token as a special character token (preserve original string)
        special_characters.push(s);
      }
    });

    // Build concat_string:
    // 1) reverse lettersSequence
    // 2) apply alternating caps starting with UPPER for index 0
    const reversed = lettersSequence.reverse();
    const concat_string = reversed
      .map((ch, idx) => (idx % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase()))
      .join('');

    const response = {
      is_success: true,
      user_id: makeUserId(FULL_NAME, DOB),
      email: EMAIL,
      roll_number: ROLL_NUMBER,
      odd_numbers,
      even_numbers,
      alphabets,
      special_characters,
      sum: String(sum),       // as required: return sum as a STRING
      concat_string
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      is_success: false,
      user_id: makeUserId(FULL_NAME, DOB),
      email: EMAIL,
      roll_number: ROLL_NUMBER,
      message: 'Internal server error'
    });
  }
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`bfhl API listening on port ${PORT}`));
