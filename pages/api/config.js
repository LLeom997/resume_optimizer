module.exports=(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS')return res.status(204).end();
  res.json({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_KEY,hasOrKey:!!process.env.OPENROUTER_API_KEY});
};
