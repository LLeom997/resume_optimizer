const { callOR } = require('../../lib/callOR');

const PROPOSE_PROMPT = function(resume, jd, missing, matched) {
  return [
    'You are a professional resume strategist. Propose SPECIFIC, targeted changes to this resume for this job.',
    'Rules:',
    '- NEVER propose removing any existing bullet point, role, experience entry, or section',
    '- NEVER propose reducing the number of items in any section',
    '- Only propose: keyword integration into existing bullets, phrasing improvements, section reordering, ATS formatting fixes',
    '- Be specific about WHICH section and WHICH bullet you are modifying',
    '- Max 8 proposed changes',
    '',
    'Return ONLY valid raw JSON, no fences:',
    '{"proposed_changes":[{"type":"keyword_inject|phrasing|section_reorder|formatting","section":"<exact section e.g. Experience: Acme Corp>","description":"<specific what and why>"}],"strategy":"<1-2 sentence overall approach>"}',
    '',
    'MISSING KEYWORDS TO ADD: ' + missing,
    'ALREADY MATCHED: ' + matched,
    'RESUME:\n' + resume,
    'JOB DESCRIPTION:\n' + jd,
  ].join('\n');
};

const GENERATE_PROMPT = function(resume, jd, missing, matched, strategy, selectedChanges) {
  return [
    'You are a professional resume writer. Rewrite this resume applying ONLY the approved changes below.',
    '',
    'APPROVED STRATEGY: ' + strategy,
    '',
    'APPROVED CHANGES TO APPLY:',
    selectedChanges.map(function(c,i){ return (i+1)+'. ['+c.section+']: '+c.description; }).join('\n'),
    '',
    'CRITICAL RULES — MUST FOLLOW:',
    '1. PRESERVE EVERY SINGLE BULLET POINT — do NOT remove or merge any existing bullet',
    '2. PRESERVE ALL experience entries, roles, companies, job titles, and dates exactly',
    '3. PRESERVE ALL sections (Education, Skills, Projects, Certifications, etc.)',
    '4. PRESERVE ALL facts: every metric ($, %, years), certification, degree, GPA',
    '5. Only MODIFY the wording of bullets in the approved sections to integrate keywords',
    '6. Do NOT add new bullet points beyond what exists (no fabrication)',
    '7. Naturally weave in these missing keywords where genuinely relevant: ' + missing,
    '8. Strengthen coverage of these matched keywords: ' + matched,
    '',
    'OUTPUT FORMAT:',
    '- Clean Markdown: # for name, ## for sections, ### for role+company+dates, bullets for achievements',
    '- ATS-friendly: no tables, no columns, no special characters in headings',
    '- Output ONLY the complete Markdown resume, then on a new line: ===SCORE===',
    '- After ===SCORE===, output ONLY valid JSON: {"score":<0-100>,"matchedAfter":[<keywords now covered>],"missingAfter":[<keywords still missing>]}',
    '',
    'ORIGINAL RESUME:\n' + resume,
    'JOB DESCRIPTION:\n' + jd,
  ].join('\n');
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { phase, resume, jd, missing, matched, proposal } = req.body;
    if (!phase) return res.status(400).json({ error: 'Missing phase' });

    if (phase === 'propose') {
      const raw = await callOR(
        [{ role: 'user', content: PROPOSE_PROMPT(resume.slice(0,6000), jd.slice(0,3000), missing, matched) }],
        900
      );
      let result;
      try {
        const m = raw.replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/);
        result = JSON.parse(m ? m[0] : raw);
      } catch(_) {
        result = { proposed_changes: [], strategy: 'Integrate missing keywords and improve ATS compatibility.' };
      }
      return res.status(200).json(result);
    }

    if (phase === 'generate') {
      const strategy = (proposal && proposal.strategy) || 'Integrate missing keywords while preserving all facts and bullet points.';
      const selectedChanges = (proposal && proposal.proposed_changes) || [];

      const raw = await callOR(
        [{ role: 'user', content: GENERATE_PROMPT(resume.slice(0,6000), jd.slice(0,3000), missing, matched, strategy, selectedChanges) }],
        3500
      );

      // Split on ===SCORE=== delimiter
      const parts = raw.split('===SCORE===');
      const markdownRaw = parts[0] || raw;
      const clean = markdownRaw.replace(/^```(?:markdown)?\n?/i,'').replace(/\n?```$/,'').trim();

      let matchScore = null, matchedAfter = [], missingAfter = [];
      if (parts[1]) {
        try {
          const scoreJson = parts[1].replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/);
          if (scoreJson) {
            const parsed = JSON.parse(scoreJson[0]);
            matchScore = parsed.score;
            matchedAfter = parsed.matchedAfter || [];
            missingAfter = parsed.missingAfter || [];
          }
        } catch(_) {}
      }

      return res.status(200).json({ markdown: clean, matchScore, matchedAfter, missingAfter });
    }

    res.status(400).json({ error: 'Unknown phase: ' + phase });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
