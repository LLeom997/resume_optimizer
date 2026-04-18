const {callOR}=require('../../lib/callOR');

const PROMPT=resumes=>`You are a Career OS learning engine. Analyze these past job applications and their outcomes.

Outcomes key: draft/ready=pending, applied=submitted, interview=progressed, offer=success, rejected=failure

Applications:
${resumes.map((r,i)=>`${i+1}. ${r.company||'?'} / ${r.role||'?'} | Score:${r.score||0}% | Status:${r.status} | Matched:[${(r.matched_keywords||[]).slice(0,5).join(',')}] | Missing:[${(r.missing_keywords||[]).slice(0,5).join(',')}]`).join('\n')}

Analyze:
1. What patterns correlate with interviews/offers?
2. What patterns correlate with rejections?
3. Which keywords appear in successful applications but not failures?
4. What score threshold seems to matter?
5. What should the candidate focus on improving?

Return ONLY valid JSON, no markdown:
{
  "patterns_success": ["<2-4 word pattern with brief observation>"],
  "patterns_failure": ["<2-4 word pattern with brief observation>"],
  "keyword_impact": [
    {"keyword": "", "impact": "<one line observation>", "frequency": <number>}
  ],
  "resume_version_performance": [
    {"name": "<version or company group>", "observation": "<performance note>"}
  ],
  "recommendations": ["<specific, actionable recommendation>"]
}`;

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{resumes}=req.body;
    if(!resumes?.length)return res.status(400).json({error:'No resumes provided'});
    const raw=await callOR([{role:'user',content:PROMPT(resumes.slice(0,40))}],1200);
    const m=raw.replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/);
    const result=m?JSON.parse(m[0]):JSON.parse(raw);
    res.status(200).json(result);
  }catch(e){res.status(500).json({error:e.message});}
};
