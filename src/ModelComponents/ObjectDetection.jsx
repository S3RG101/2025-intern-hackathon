import React, { useRef, useState, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const ObjectDetection = ({ onDistractionChange }) => {
  const videoRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const [isWebcamStarted, setIsWebcamStarted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentDistraction, setCurrentDistraction] = useState('');

  // Start webcam and detection
  const startWebcamAndDetection = async () => {
    try {
      if (videoRef.current && !videoRef.current.srcObject) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      if (!detectionIntervalRef.current) {
        detectionIntervalRef.current = setInterval(predictObject, 500);
      }
    } catch (err) {
      setIsWebcamStarted(false);
      if (onDistractionChange) onDistractionChange(false, null);
    }
  };

  // Stop webcam and detection
  const stopWebcamAndDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    // Robustly stop all tracks and release camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowAlert(false);
    setCurrentDistraction('');
    if (onDistractionChange) onDistractionChange(false, null);
  };

  useEffect(() => {
    if (isWebcamStarted) {
      startWebcamAndDetection();
    } else {
      stopWebcamAndDetection();
    }
    return () => {
      stopWebcamAndDetection();
    };
    // eslint-disable-next-line
  }, [isWebcamStarted]);

  const getFunnyMessage = (distractionType) => {
    const messages = {
      phone: [
        "\ud83d\udcf1 Put that rectangle of distraction down! Your productivity called, it's crying! \ud83d\ude2d",
      ],
      pet: [
        "\ud83d\udc15 Aww, pet therapy session detected! But your work is feeling lonely too! \ud83e\udd7a",
      ],
      people: [
        "\ud83d\udc6b Multiple humans detected! Are you starting a productivity support group? \ud83e\udd1d\ud83d\udcca",
      ]
    };
    const typeMessages = messages[distractionType] || messages.phone;
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  };

  const predictObject = async () => {
    const model = await cocoSsd.load();
    model.detect(videoRef.current).then((predictions) => {
      const cellPhoneDetected = predictions.some(prediction =>
        prediction.class.toLowerCase() === 'cell phone'
      );
      const petDetected = predictions.some(prediction =>
        ['cat', 'dog'].includes(prediction.class.toLowerCase())
      );
      const peopleCount = predictions.filter(prediction =>
        prediction.class.toLowerCase() === 'person'
      ).length;
      const multiplePersonDetected = peopleCount > 1;
      let distractionType = '';
      if (cellPhoneDetected) {
        distractionType = 'phone';
      } else if (petDetected) {
        distractionType = 'pet';
      } else if (multiplePersonDetected) {
        distractionType = 'people';
      }
      const anyDistractionDetected = cellPhoneDetected || petDetected || multiplePersonDetected;
      if (anyDistractionDetected && !showAlert) {
        setCurrentDistraction(getFunnyMessage(distractionType));
      }
      setShowAlert(anyDistractionDetected);
      if (onDistractionChange) {
        const banner = anyDistractionDetected ? (
          <div className="alert-pulse" style={{
            position: 'fixed',
            left: '50%',
            top: 48,
            transform: 'translateX(-50%)',
            backgroundColor: '#ff4757',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(255, 71, 87, 0.3)',
            zIndex: 3000,
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideDown 0.3s ease-out, pulse 2s infinite',
            border: '2px solid #ff3742',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            maxWidth: '600px',
            textAlign: 'center',
            margin: 0,
          }}>
            {getFunnyMessage(distractionType)}
          </div>
        ) : null;
        onDistractionChange(anyDistractionDetected, banner);
      }
    })
    .catch(err => {
      console.error(err)
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'absolute', top: 24, left: 24, zIndex: 2000 }}>
      <button onClick={() => setIsWebcamStarted((prev) => !prev)} style={{ marginBottom: '8px' }}>
        {isWebcamStarted ? "Stop" : "Start"} Webcam
      </button>
      {isWebcamStarted && (
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{
            width: 160,
            height: 120,
            borderRadius: 8,
            border: '2px solid #ff4757',
            background: '#222',
          }}
        />
      )}
    </div>
  );
};

export default ObjectDetection;