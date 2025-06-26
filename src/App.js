import './App.css';
import PotatoHeader from './PotatoHeader';
import DistractionDetection from './ModelComponents/DistractionDetection';
import TodoList from './todo';
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
      {/* Unified distraction detection component */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20 }}>
        <DistractionDetection onDistractionChange={handleDistractionChange} />
      </div>
      
      {/* PotatoHeader with timer and character */}
      <PotatoHeader characterSrc={characterSrc} objectDetectionBanner={objectDetectionBanner} />
    </div>
  );
}

export default App;
