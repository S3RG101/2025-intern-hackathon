import React, { useState, useEffect } from "react";
import { useAlarm } from "./useAlarm";
import "./timer-buttons-styling.css";
import "./potato-wobble.css";
import Exam from "./ModelComponents/Exam";

const TIMER_PRESETS = {
  Pomodoro: 25 * 60,
  "Short Break": 5 * 60,
  "Long Break": 10 * 60,
};

const Timer = ({ characterSrc = process.env.PUBLIC_URL + '/happyani.png' }) => {
  const [timerType, setTimerType] = useState("Pomodoro");
  const [totalSeconds, setTotalSeconds] = useState(TIMER_PRESETS["Pomodoro"]);
  const [isActive, setIsActive] = useState(false);
  const { alarmAudio, playAlarm } = useAlarm(process.env.PUBLIC_URL + "/Alarmtest.mp3");
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    if (totalSeconds <= 0) {
      setIsActive(false);
      playAlarm();
      return;
    }
    const timer = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          playAlarm();
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, totalSeconds, playAlarm]);

  const startTimer = () => {
    if (totalSeconds > 0) {
      setIsActive(true);
      generateSoundtrack(totalSeconds, timerType);
    }
  };
  const pauseTimer = () => setIsActive(false);
  const resetTimer = () => {
    setIsActive(false);
    setTotalSeconds(TIMER_PRESETS[timerType]);
  };

  const handleMinutesChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value, 10) || 0);
    setTotalSeconds(value * 60);
  };

  const switchTimer = (type) => {
    setTimerType(type);
    setIsActive(false);
    setTotalSeconds(TIMER_PRESETS[type]);
  };

  const handleBackToTimer = () => {
    setIsTimeUp(false);
    resetTimer();
  };

  if (isTimeUp) {
    console.log("TIME OVER")
    return <Exam onBack={handleBackToTimer} />;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Helper: Map timer type to Spotify genre or mood
  const TIMER_GENRES = {
    Pomodoro: "rock",
    "Short Break": "pop",
    "Long Break": "rock"
  };

  async function generateSoundtrack(totalSeconds, timerType) {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      alert("Please link your Spotify account first!");
      return;
    }

    // 1. Fetch recommended tracks
    const genre = TIMER_GENRES[timerType] || "chill";
    const url = `https://api.spotify.com/v1/recommendations?seed_genres=${genre}&limit=100`;
    console.log(`Fetching tracks for genre: ${genre} from URL: ${url}`);
    
    const response = await fetch(url,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      alert(`Failed to fetch tracks: ${response.status} ${response.statusText}\n${errorText}`);
      return;
    }

    const data = await response.json();

    // 2. Select enough tracks to fill the timer
    let tracks = [];
    let sum = 0;
    const timerDurationMs = totalSeconds * 1000;
    for (const track of data.tracks) {
      if (sum >= timerDurationMs) break;
      tracks.push(track.uri);
      sum += track.duration_ms;
    }

    if (tracks.length === 0) {
      alert("Couldn't find enough tracks for this session.");
      return;
    }

    // 3. Start playback on user's active device
    await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: tracks })
    });

    alert("Your Pomodoro soundtrack is playing on your active Spotify device!");
  }

  return (
    <div style={{ textAlign: "center", position: 'relative' }}>
      {alarmAudio}
      <div className="timer-buttons">
        <button onClick={() => switchTimer("Pomodoro")}>Pomodoro</button>
        <button onClick={() => switchTimer("Short Break")}>Short Break</button>
        <button onClick={() => switchTimer("Long Break")}>Long Break</button>
      </div>
      <div style={{ margin: '0' }}>
        <img
          src={characterSrc}
          alt="Potato Animation"
          className="potato-wobble"
          style={{ width: '110px', height: 'auto', display: 'block', margin: '0 auto', marginBottom: '-10px' }}
          onError={e => { /* In case image decides not to load, the default is happy potato animation */
            e.target.onerror = null;
            e.target.src = process.env.PUBLIC_URL + '/happyani.png';
          }}
        />
      </div>
      <h1 style={{ fontSize: '5em', margin: '0 0 0.2em 0' }}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </h1>
      <div>
        <label htmlFor="minutes-selector"> custom timer: </label>
        <input
          id="minutes-selector"
          type="number"
          value={Math.floor(totalSeconds / 60)}
          onChange={handleMinutesChange}
          min="0"
        />
      </div>
      <div className="timer-buttons">
        <button onClick={startTimer} disabled={isActive || totalSeconds === 0}>
          Start
        </button>
        <button onClick={pauseTimer} disabled={!isActive}>
          Pause
        </button>
        <button onClick={resetTimer}>Reset</button>
        <button onClick={() => generateSoundtrack(totalSeconds, timerType)}>
          Generate Soundtrack
        </button>
      </div>
    </div>
  );
};

export default Timer;