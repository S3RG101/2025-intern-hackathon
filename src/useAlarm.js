import { useRef, useState, useEffect } from "react";

export function useAlarm(audioSrc) {
  const alarmRef = useRef(null);
  const [alarmPlaying, setAlarmPlaying] = useState(false);

  // Play alarm
  const playAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.currentTime = 0;
      // Use promise to catch play() errors and avoid warning
      alarmRef.current.play().then(() => {
        setAlarmPlaying(true);
      }).catch((e) => {
        // Optionally log or handle play() interruption errors
        // console.warn('Alarm play interrupted:', e);
      });
    }
  };

  // Stop alarm
  const stopAlarm = () => {
    if (alarmRef.current && !alarmRef.current.paused) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
      setAlarmPlaying(false);
    }
  };

  useEffect(() => {
    function handlePointerDown() {
      if (alarmPlaying) stopAlarm();
    }
    if (alarmPlaying) {
      window.addEventListener('pointerdown', handlePointerDown);
    } else {
      window.removeEventListener('pointerdown', handlePointerDown);
    }
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [alarmPlaying]);

  // Alarm audio element
  const alarmAudio = <audio ref={alarmRef} src={audioSrc} preload="auto" />;

  return { alarmAudio, playAlarm, alarmPlaying };
}
