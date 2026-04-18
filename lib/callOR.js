const https=require('https');
function callOR(messages,maxTokens){
  maxTokens=maxTokens||3000;
  const apiKey=process.env.OPENROUTER_API_KEY;
  if(!apiKey)throw new Error('OPENROUTER_API_KEY not set');
  return new Promise((resolve,reject)=>{
    const body=JSON.stringify({model:'openai/gpt-4o-mini',max_tokens:maxTokens,messages});
    const req=https.request({hostname:'openrouter.ai',path:'/api/v1/chat/completions',method:'POST',
      headers:{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json',
        'HTTP-Referer':process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:'http://localhost:3000',
        'X-Title':'Career OS','Content-Length':Buffer.byteLength(body)}},
      res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
        try{const p=JSON.parse(d);if(p.error)return reject(new Error(p.error.message));
          const ch=p.choices&&p.choices[0];if(!ch)return reject(new Error('No response'));
          if(ch.finish_reason==='length')return reject(new Error('Response truncated — shorten input'));
          resolve(ch.message&&ch.message.content||'');
        }catch(e){reject(new Error('Parse: '+e.message));}
      });});
    req.on('error',reject);req.write(body);req.end();
  });
}
module.exports={callOR};
