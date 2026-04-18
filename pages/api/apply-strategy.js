const {callOR}=require('../../lib/callOR');

const PROMPT=(score,company,role,missing,strengths)=>`You are a Career OS strategist. Generate an application strategy for this candidate.

Context:
- Company: ${company||'Unknown'}
- Role: ${role||'Unknown'}  
- Match Score: ${score}%
- Key Strengths: ${(strengths||[]).slice(0,4).join(', ')}
- Missing Keywords: ${(missing||[]).slice(0,6).join(', ')}

Generate:
1. Positioning angle (1-2 lines: how to frame this application)
2. Email pitch (5 lines max, professional, specific to this role)
3. LinkedIn summary (3-4 lines, keyword-rich, first-person OK)

Return ONLY valid JSON, no markdown:
{
  "positioning": "<1-2 line angle — how candidate should position themselves for this role>",
  "email_pitch": "<5 line email pitch — intro, match, value prop, call to action>",
  "linkedin_summary": "<3-4 line LinkedIn summary optimised for this role type>"
}`;

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{score,company,role,missing,strengths}=req.body;
    const raw=await callOR([{role:'user',content:PROMPT(score,company,role,missing,strengths)}],600);
    const m=raw.replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/);
    const result=m?JSON.parse(m[0]):JSON.parse(raw);
    res.status(200).json(result);
  }catch(e){res.status(500).json({error:e.message});}
};
