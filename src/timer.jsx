import React, { useState, useEffect } from "react";

const Timer = () => {
  const [minutes, setMinutes] = useState(25); // Default to Pomodoro timer
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timerType, setTimerType] = useState("Pomodoro"); // Track the current timer type

  useEffect(() => {
    let timer;
    if (isActive) {
      timer = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          clearInterval(timer);
          setIsActive(false);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, minutes, seconds]);

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(timerType === "Pomodoro" ? 25 : timerType === "Short Break" ? 5 : 10);
    setSeconds(0);
  };

  const handleMinutesChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value, 10) || 0);
    setMinutes(value);
    setSeconds(0); // Reset seconds when minutes are changed
  };

  const switchTimer = (type) => {
    setTimerType(type);
    setIsActive(false);
    setMinutes(type === "Pomodoro" ? 25 : type === "Short Break" ? 5 : 10);
    setSeconds(0);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>{timerType} Timer</h2>
      <div>
        <button onClick={() => switchTimer("Pomodoro")}>Pomodoro</button>
        <button onClick={() => switchTimer("Short Break")}>Short Break</button>
        <button onClick={() => switchTimer("Long Break")}>Long Break</button>
      </div>
      <div>
        <label htmlFor="minutes-selector">Set Minutes: </label>
        <input
          id="minutes-selector"
          type="number"
          value={minutes}
          onChange={handleMinutesChange}
          min="0"
        />
      </div>
      <h1>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </h1>
      <button onClick={startTimer} disabled={isActive}>
        Start
      </button>
      <button onClick={pauseTimer} disabled={!isActive}>
        Pause
      </button>
      <button onClick={resetTimer}>Reset</button>
    </div>
  );
};

export default Timer;