export default function LoginPage(){
 return (
   <main style={{maxWidth:420,margin:'80px auto'}}>
      <h1>UniService</h1>
      <p>Enterprise University HCM</p>
      <form>
        <input placeholder="Username"/>
        <input placeholder="Password" type="password"/>
        <button type="submit">Sign In</button>
      </form>
   </main>
 );
}
