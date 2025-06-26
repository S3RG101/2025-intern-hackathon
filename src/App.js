import './App.css';
import PotatoHeader from './PotatoHeader';
import ObjectDetection from './ModelComponents/ObjectDetection';
import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import StudyBuddy from './ModelComponents/StudyBuddy';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studyBuddyChatOpen, setStudyBuddyChatOpen] = useState(false);


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
      <StudyBuddy
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        studyBuddyChatOpen={studyBuddyChatOpen}
        setStudyBuddyChatOpen={setStudyBuddyChatOpen}
      />

      {/* Webcam, detection, and Start/Stop button in top left, full logic */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20 }}>
        <ObjectDetection onDistractionChange={handleDistractionChange} />
      </div>
      {/* PotatoHeader with timer and character */}
      <PotatoHeader characterSrc={characterSrc} objectDetectionBanner={objectDetectionBanner} />

    </div>
  );
}

export default App;
