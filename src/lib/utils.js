/**
 * Analyze communication patterns from transcribed text and duration.
 * 
 * @param {string} text The transcribed response
 * @param {number} durationSeconds Duration in seconds
 * @returns {object} Analysis details
 */
export function analyzeSpeechCommunication(text = '', durationSeconds = 1) {
  const cleanText = text.trim();
  if (!cleanText) {
    return {
      words_per_minute: 0,
      filler_words: {},
      total_fillers: 0,
      clarity: 'N/A'
    };
  }

  // Count words
  const words = cleanText.split(/\s+/);
  const wordCount = words.length;
  
  // Convert duration to minutes (min 1 second to avoid division by zero)
  const durationMinutes = Math.max(durationSeconds, 1) / 60;
  const wpm = Math.round(wordCount / durationMinutes);

  // Scan filler words
  const fillers = ["um", "uh", "like", "actually", "basically", "so", "you know"];
  const fillerCounts = {};
  let totalFillers = 0;

  words.forEach(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-zA-Z]/g, '');
    if (fillers.includes(cleanWord)) {
      fillerCounts[cleanWord] = (fillerCounts[cleanWord] || 0) + 1;
      totalFillers++;
    }
  });

  // Check special phrase "you know"
  const youKnowRegex = /\byou know\b/gi;
  const youKnowMatches = cleanText.match(youKnowRegex);
  if (youKnowMatches) {
    fillerCounts["you know"] = youKnowMatches.length;
    totalFillers += youKnowMatches.length;
  }

  // Compute clarity indicators
  let clarity = 'high';
  const fillerRatio = totalFillers / wordCount;
  
  if (fillerRatio > 0.15 || wpm > 170 || wpm < 80) {
    clarity = 'low';
  } else if (fillerRatio > 0.08 || wpm > 155 || wpm < 95) {
    clarity = 'moderate';
  }

  return {
    words_per_minute: wpm,
    filler_words: fillerCounts,
    total_fillers: totalFillers,
    clarity: clarity
  };
}
