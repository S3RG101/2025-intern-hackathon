import './App.css';
import PotatoHeader from './PotatoHeader';
import ObjectDetection from './ModelComponents/ObjectDetection';
import React, { useState, useCallback, useRef } from 'react';

function App() {
  // State to control which character image is shown
  const [characterSrc, setCharacterSrc] = useState(process.env.PUBLIC_URL + '/happyani.png');
  // State to control object detection alert/banner
  const [objectDetectionBanner, setObjectDetectionBanner] = useState(null);
  // Ref for the alert sound
  const alertAudioRef = useRef(null);
  // Track previous distraction state
  const prevDistractionRef = useRef(false);

  // Callback to update characterSrc from ObjectDetection
  const handleDistractionChange = useCallback((distractionDetected, bannerContent) => {
    // Only play sound when going from no distraction to distraction
    if (distractionDetected && !prevDistractionRef.current) {
      setCharacterSrc(process.env.PUBLIC_URL + '/madani.png');
      // Play alert sound
      if (alertAudioRef.current) {
        alertAudioRef.current.currentTime = 0;
        alertAudioRef.current.play();
      }
    } else if (!distractionDetected) {
      setCharacterSrc(process.env.PUBLIC_URL + '/happyani.png');
    }
    setObjectDetectionBanner(bannerContent);
    prevDistractionRef.current = distractionDetected;
  }, []);
  
  return (
    <div className="App" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Audio element for distraction alert */}
      <audio ref={alertAudioRef} src={process.env.PUBLIC_URL + '/amogus-distractionalert.mp3'} preload="auto" />
      {/* Render the banner at the top level so it overlays everything */}
      {objectDetectionBanner && React.cloneElement(objectDetectionBanner, {
        style: {
          ...objectDetectionBanner.props.style,
          top: 120, // Move the banner lower (closer to the timer)
        }
      })}
      {/* Webcam, detection, and Start/Stop button in top left, full logic */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20 }}>
        <ObjectDetection onDistractionChange={handleDistractionChange} />
      </div>
      {/* PotatoHeader with timer and character */}
      <PotatoHeader characterSrc={characterSrc} />
    </div>
  );
}

export default App;
