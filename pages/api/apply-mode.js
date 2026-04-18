const {callOR}=require('../../lib/callOR');

const PROMPT=(resume,jds)=>`You are a Career OS in bulk apply mode.

You have been given one resume and ${jds.length} job descriptions.

Tasks:
1. Identify common patterns across all JDs
2. Extract dominant keywords ranked by frequency
3. Score resume against each JD briefly
4. Generate a MASTER strategy for this role cluster

Return ONLY valid JSON, no markdown:
{
  "role_cluster": "<2-4 word description of the role cluster e.g. 'Senior Mechanical Design Engineer'>",
  "common_keywords": ["<ranked list of top 15 keywords common across JDs>"],
  "master_resume_strategy": "<2-3 sentence strategy to position resume across this cluster>",
  "per_jd": [
    {
      "company": "<company>",
      "role": "<role>",
      "score": <0-100>,
      "decision": "YES|NO|MAYBE",
      "top_gaps": ["<top 3 missing keywords/signals>"]
    }
  ]
}

RESUME:
${resume}

JOB DESCRIPTIONS:
${jds.map((j,i)=>`--- JD ${i+1}: ${j.company||''} / ${j.role||''} ---\n${j.text}`).join('\n\n')}`;

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{resume,jds}=req.body;
    if(!resume||!jds?.length)return res.status(400).json({error:'Missing resume or jds'});
    if(jds.length>8)return res.status(400).json({error:'Max 8 JDs at once'});
    const raw=await callOR([{role:'user',content:PROMPT(resume.slice(0,5000),jds)}],2000);
    const m=raw.replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/);
    const result=m?JSON.parse(m[0]):JSON.parse(raw);
    res.status(200).json(result);
  }catch(e){res.status(500).json({error:e.message});}
};
