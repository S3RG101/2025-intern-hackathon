import './App.css';
import PotatoHeader from './PotatoHeader';
//import ObjectDetection from './ModelComponents/ObjectDetection';
import FaceAttentionDetection from './ModelComponents/FaceAttentionDetection';
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
      {/* Face attention detection component (detects if you're looking away or eyes closed) */}
      <div style={{ position: 'absolute', top: 230, left: 20, zIndex: 20 }}>
        <FaceAttentionDetection onDistractionChange={handleDistractionChange} />
      </div>
      
      {/* PotatoHeader with timer and character */}
      <PotatoHeader characterSrc={characterSrc} objectDetectionBanner={objectDetectionBanner} />
    </div>
  );
}

export default App;
