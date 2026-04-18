const {callOR}=require('../../lib/callOR');

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{type,resume,jd,missing,matched}=req.body;
    if(!type)return res.status(400).json({error:'Missing type'});
    let prompt,maxTok;

    if(type==='opt-propose'){
      maxTok=1500;
      const lines=resume.split('\n');
      const numbered=lines.map((l,i)=>`[L${i}] ${l}`).join('\n');
      prompt=`You are a Career OS optimizer. Propose SURGICAL line-level changes to this resume.

SYSTEM RULE: You are not a writer. You are an optimizer.
Rules:
- Reference lines by [LN] number
- Only modify existing content lines — never headers (##,###), blank lines, or skills/tools lists
- Preserve ALL facts: names, dates, metrics ($,%,HP,tons), certifications
- Add keywords naturally — never force-fit
- Prefer Professional Summary and key Experience bullets
- Max 10 changes, ranked by impact

Return ONLY valid JSON:
{
  "patches": [
    {
      "lineNum": <integer>,
      "section": "<e.g. Professional Summary | Experience: Whirlpool>",
      "before": "<exact current line text>",
      "after": "<complete rewritten line>",
      "impact": "ATS|keyword|clarity",
      "reason": "<brief>"
    }
  ],
  "summary": "<1-2 sentence optimizer strategy>"
}

MISSING KEYWORDS: ${missing}
ALREADY MATCHED: ${matched}

NUMBERED RESUME:
${numbered.slice(0,7000)}

JOB DESCRIPTION:
${jd.slice(0,3000)}`;

    }else if(type==='summary'){
      maxTok=400;
      prompt=`Rewrite professional summary. Preserve ALL facts. Add MISSING keywords naturally: ${missing}. No "I". Max 4 sentences. ATS-optimised. Output ONLY the paragraph.
RESUME:\n${resume.slice(0,3000)}\nJD:\n${jd.slice(0,2000)}`;

    }else if(type==='experience'){
      maxTok=2000;
      prompt=`Suggest keyword-optimised rewrites for experience bullets. Preserve ALL facts. Return ONLY JSON:
{"sections":[{"role":"<Title|Co>","bullets":[{"original":"<exact>","revised":"<rewritten>","status":"CHANGED","change":"<kw>"}]}]}
MISSING: ${missing}
RESUME:\n${resume.slice(0,5000)}\nJD:\n${jd.slice(0,2000)}`;

    }else{
      return res.status(400).json({error:'Unknown type'});
    }

    const text=await callOR([{role:'user',content:prompt}],maxTok);
    if(type==='opt-propose')return res.status(200).json({text,lines:resume.split('\n')});
    res.status(200).json({text});
  }catch(e){res.status(500).json({error:e.message});}
};
