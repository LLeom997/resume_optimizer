const {callOR}=require('../../lib/callOR');

const SYSTEM=`You are a Career Operating System.
Your job is to optimize job application outcomes.
Rules: Never fabricate experience or metrics. Never remove content. Always preserve factual integrity.
Optimize for both ATS parsing and recruiter readability.`;

const ANALYSIS_PROMPT=(resume,jd)=>`${SYSTEM}

Analyze this resume against the job description. Execute the full pipeline:

1. Fit Decision — Should user apply? YES/NO with confidence 0-100
2. Gap Analysis — missing keywords, experience gaps, ATS risks  
3. Score — overall 0-100 and four sub-scores
4. Keyword classification — matched, missing, partial
5. Strengths, gaps, recommendations
6. Recruiter perspective

Return ONLY raw JSON, no markdown:
{
  "score": <0-100>,
  "scoreTitle": "<Strong Match|Moderate Fit|Weak Match>",
  "scoreVerdict": "<2-3 sentences>",
  "subScores": [
    {"label":"Technical Skills","value":<0-100>},
    {"label":"Domain Fit","value":<0-100>},
    {"label":"Experience Level","value":<0-100>},
    {"label":"ATS Compatibility","value":<0-100>}
  ],
  "matchedKeywords": [<up to 18 strings>],
  "missingKeywords": [<up to 12 strings>],
  "partialKeywords": [<up to 8 strings>],
  "strengths": [<4-6 strings>],
  "gaps": [<3-5 strings>],
  "recommendations": [<4-6 actionable strings>],
  "recruiterSummary": "<paragraph>",
  "fit_decision": {
    "decision": "YES|NO|MAYBE",
    "confidence": <0-100>,
    "reasoning": "<2-3 sentences>",
    "risk_factors": [<2-4 strings>],
    "upside": [<2-3 strings>],
    "quick_fixes_before_apply": [<2-3 strings>]
  }
}

RESUME:
${resume}

JOB DESCRIPTION:
${jd}`;

const META_PROMPT=jd=>`Extract company name and role from this JD. Return ONLY JSON: {"company":"","role":""}
JD:\n${jd.slice(0,2000)}`;

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{resume,jd}=req.body;
    if(!resume||!jd)return res.status(400).json({error:'Missing resume or jd'});
    const[raw,metaRaw]=await Promise.all([
      callOR([{role:'user',content:ANALYSIS_PROMPT(resume.slice(0,6000),jd.slice(0,3000))}]),
      callOR([{role:'user',content:META_PROMPT(jd)}],300)
    ]);
    let result;
    try{result=JSON.parse(raw.replace(/```json|```/g,'').trim());}
    catch(e){throw new Error('Failed to parse analysis JSON');}
    let company='',role='';
    try{const m=metaRaw.replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/);
      if(m){const meta=JSON.parse(m[0]);company=(meta.company||'').trim();role=(meta.role||'').trim();}}
    catch(_){}
    result.company=company;result.role=role;
    res.status(200).json(result);
  }catch(e){res.status(500).json({error:e.message});}
};
