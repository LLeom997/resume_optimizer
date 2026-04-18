const {callOR}=require('../../lib/callOR');

const PROMPT=jd=>`Extract structured intelligence from this job description.

Return ONLY valid JSON, no markdown:
{
  "role": "",
  "company": "",
  "seniority": "<Junior|Mid|Senior|Lead|Principal|Director>",
  "core_skills": [],
  "tools": [],
  "domain": "<e.g. Mechanical Design|Software Engineering|Product Management>",
  "keywords_ranked": [],
  "hidden_signals": ["<inferred requirements not explicitly stated>"],
  "must_have": ["<hard requirements — deal breakers if missing>"],
  "nice_to_have": ["<preferred but not blocking>"]
}

JOB DESCRIPTION:
${jd}`;

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{jd}=req.body;
    if(!jd)return res.status(400).json({error:'Missing jd'});
    const raw=await callOR([{role:'user',content:PROMPT(jd.slice(0,4000))}],800);
    const m=raw.replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/);
    const result=m?JSON.parse(m[0]):JSON.parse(raw);
    res.status(200).json(result);
  }catch(e){res.status(500).json({error:e.message});}
};
