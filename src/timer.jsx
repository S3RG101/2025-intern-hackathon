import React, { useState, useEffect } from "react";
import { useAlarm } from "./useAlarm";
import "./timer-buttons-styling.css";
import "./potato-wobble.css";

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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, totalSeconds, playAlarm]);

  const startTimer = () => {
    if (totalSeconds > 0) setIsActive(true);
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

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div style={{ textAlign: "center", position: 'relative' }}>
      {alarmAudio}
      <div className="timer-buttons">
        <button onClick={() => switchTimer("Pomodoro")}>Pomodoro</button>
        <button onClick={() => switchTimer("Short Break")}>Short Break</button>
        <button onClick={() => switchTimer("Long Break")}>Long Break</button>
      </div>
      <div style={{ margin: '0' }}>
        <img src={characterSrc} alt="Potato Animation" className="potato-wobble" style={{ width: '110px', height: 'auto', display: 'block', margin: '0 auto', marginBottom: '-10px' }} />
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
      </div>
    </div>
  );
};

export default Timer;