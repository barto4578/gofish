// Updated reports.js to remove Homewaters and add summarization for Caddis
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

function extractPresentObservations(text) {
  const observations = [];
  const lines = text.split(/\n|\. /);

  const timeIndicators = /\b(currently|right now|this week|today|has been|we saw|were|are|is)\b/i;
  const flyActivityKeywords = /\b(caddis|mayfly|blue wing|stonefly|nymph|streamer|dry fly|emerging|hatching|rising|feeding|working|productive)\b/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (timeIndicators.test(trimmed) && flyActivityKeywords.test(trimmed)) {
      observations.push(trimmed);
    }
  }

  return observations.slice(0, 10);
}

function summarizeContent(text) {
  const lines = text
    .split(/\n|\. /)
    .map(l => l.trim())
    .filter(l => l.length > 50 && l.length < 300)
    .slice(0, 5);

  return lines.join('. ') + (lines.length ? '.' : '');
}

async function scrapeCaddisFlyShop() {
  const base = 'https://oregonflyfishingblog.com';
  const listURL = `${base}/category/fishing-reports/`;

  const { data: listHTML } = await axios.get(listURL, { httpsAgent: agent });
  const $ = cheerio.load(listHTML);
  const postURL = $('.entry-title a').first().attr('href');

  if (!postURL) return { source: 'caddis', message: 'No recent report found.' };

  const { data: postHTML } = await axios.get(postURL, { httpsAgent: agent });
  const $$ = cheerio.load(postHTML);
  const bodyText = $$('.entry-content').text();

  return {
    source: 'caddis',
    url: postURL,
    summary: summarizeContent(bodyText),
    highlights: extractPresentObservations(bodyText)
  };
}

module.exports = { scrapeCaddisFlyShop };
