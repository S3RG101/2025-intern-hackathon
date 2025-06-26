import './App.css';
import PotatoHeader from './PotatoHeader';
import ObjectDetection from './ModelComponents/ObjectDetection';
import React, { useState, useCallback } from 'react';

function App() {
  // State to control which character image is shown
  const [characterSrc, setCharacterSrc] = useState(process.env.PUBLIC_URL + '/happyani.png');
  // State to control object detection alert/banner
  const [objectDetectionBanner, setObjectDetectionBanner] = useState(null);

  // Callback to update characterSrc from ObjectDetection
  const handleDistractionChange = useCallback((distractionDetected, bannerContent) => {
    if (distractionDetected) {
      setCharacterSrc(process.env.PUBLIC_URL + '/madani.png');
    } else {
      setCharacterSrc(process.env.PUBLIC_URL + '/happyani.png');
    }
    setObjectDetectionBanner(bannerContent);
  }, []);
  
  return (
    <div className="App" style={{ position: 'relative', minHeight: '100vh' }}>
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
