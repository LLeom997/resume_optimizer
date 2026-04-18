const {callOR}=require('../../lib/callOR');

const PROMPT=resume=>`Convert this resume into structured knowledge for retrieval and matching.

Return ONLY valid JSON, no markdown:
{
  "roles": ["<job title at company>"],
  "skills": ["<technical and soft skills>"],
  "tools": ["<software, platforms, instruments>"],
  "domains": ["<industry/functional domains>"],
  "metrics": ["<quantified achievements — preserve exact numbers>"],
  "seniority_level": "<Junior|Mid|Senior|Lead|Principal>",
  "strength_clusters": ["<2-4 word capability cluster e.g. 'Structural FEA & CAE', 'Cost Reduction Engineering'>"]
}

RESUME:
${resume}`;

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{resume}=req.body;
    if(!resume)return res.status(400).json({error:'Missing resume'});
    const raw=await callOR([{role:'user',content:PROMPT(resume.slice(0,6000))}],600);
    const m=raw.replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/);
    const result=m?JSON.parse(m[0]):JSON.parse(raw);
    res.status(200).json(result);
  }catch(e){res.status(500).json({error:e.message});}
};
