import React, { useEffect, useState } from "react";

function SpotifyProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if(!token) {
      console.error("No Spotify access token found");
      return;
    }

    fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProfile(data));
  
  }, []);

  if (!profile) return null;

  return (
    <div style={{ margin: "2rem" }}>
      <h2>Welcome, {profile.display_name}!</h2>
      {profile.images && profile.images[0] && (
        <img src={profile.images[0].url} alt="Profile" width={80} style={{ borderRadius: "50%" }} />
      )}
      <p>Spotify ID: {profile.id}</p>
      <p>Email: {profile.email}</p>
      {/* update link spotify button to logout button */}
    </div>
  );
}

export default SpotifyProfile;