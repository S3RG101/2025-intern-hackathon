import React, { useState, useEffect } from "react";

function generateCodeVerifier(length = 128) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return verifier;
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function SpotifyButton() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check token validity on mount
  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (token) {
      // Test the token by fetching the user's profile
      fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("spotify_access_token");
            setLoggedIn(false);
          } else if (res.ok) {
            setLoggedIn(true);
          }
        })
        .catch(() => {
          localStorage.removeItem("spotify_access_token");
          setLoggedIn(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem("spotify_code_verifier", codeVerifier);

    const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?client_id=a1851554413841fd8e0678d784d145da&response_type=code&redirect_uri=http://127.0.0.1:3000/callback&scope=user-read-private&code_challenge_method=S256&code_challenge=${codeChallenge}`;

    window.location.href = SPOTIFY_AUTH_URL;
  };

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    setLoggedIn(false);
    window.location.reload(); // or trigger a state update
  };

  if (loading) return null; // or a spinner

  if (loggedIn) {
    return (
      <button
        onClick={handleLogout}
        style={{ margin: "2rem", padding: "1rem 2rem", fontSize: "1.2rem" }}
      >
        Log out of Spotify
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      style={{ margin: "2rem", padding: "1rem 2rem", fontSize: "1.2rem" }}
    >
      Link Spotify
    </button>
  );
}

export default SpotifyButton;