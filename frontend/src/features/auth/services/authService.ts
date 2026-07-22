export async function signIn(username:string,password:string){
  const res=await fetch('/api/v1/auth/login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username,password})
  });
  return res.json();
}
