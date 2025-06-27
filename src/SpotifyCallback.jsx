import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only run once on mount
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const codeVerifier = localStorage.getItem("spotify_code_verifier");

    // Guard: Only run if code and codeVerifier exist
    if (code && codeVerifier) {
      // Exchange code for access token
    //   fetch("https://accounts.spotify.com/api/token", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded"
    //     },
    //     body: new URLSearchParams({
    //       client_id: "a1851554413841fd8e0678d784d145da", // your client ID
    //       grant_type: "authorization_code",
    //       code: code,
    //       redirect_uri: "http://127.0.0.1:3000/callback",
    //       code_verifier: codeVerifier
    //     })
    //   })
    //     .then(res => res.json())
    //     .then(data => {
    //       console.log("Spotify token response:", data); // <-- Add this line
    //       if (data.access_token) {
    //         localStorage.setItem("spotify_access_token", data.access_token);
    //         navigate("/"); // <-- This redirects to the home page
    //       } else {
    //         alert("Failed to get access token");
    //       }
    //     });
    fetch("http://localhost:8888/api/spotify/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
          redirect_uri: "http://127.0.0.1:3000/callback"
        })
      })
        .then(res => res.json())
        .then(data => {
          console.log("Spotify token response:", data);
          if (data.access_token) {
            localStorage.setItem("spotify_access_token", data.access_token);
            navigate("/");
          } else {
            alert("Failed to get access token: " + JSON.stringify(data));
          }
        });
    }
//   }, [navigate]);
  }, []); // <-- Only run once on mount


  return <div>Linking your Spotify account...</div>;
}

export default SpotifyCallback;