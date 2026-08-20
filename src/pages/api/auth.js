export const prerender = false;

export async function GET({ redirect }) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const redirectUri = 'https://www.suleymanay.com/api/callback';
  
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;
  
  return redirect(githubUrl, 302);
}
