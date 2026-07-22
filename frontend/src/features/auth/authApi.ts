export async function login(username:string,password:string){
  return fetch('/api/v1/auth/login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username,password})
  });
}
