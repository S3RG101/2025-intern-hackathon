import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceAttentionDetection = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isWebcamStarted, setIsWebcamStarted] = useState(false);
    const [isDistracted, setIsDistracted] = useState(false);
    const [distractionMessage, setDistractionMessage] = useState('');
    const [detectionInterval, setDetectionInterval] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [stats, setStats] = useState({
        noFaceCount: 0,
        lookingAwayCount: 0,
        eyesClosedCount: 0
    });

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            try {        
                const MODEL_URL = '/face_models';
            
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                ]);
            
                setModelsLoaded(true);
                console.log('Models loaded successfully');
            } catch (error) {
                console.error('Error loading models:', error);
                alert('Failed to load face detection models. Please check console for details.');
            }
        };

        loadModels();

        // Cleanup function
        return () => {
            if (detectionInterval) {
                clearInterval(detectionInterval);
            }
        };
    }, []);

    // Set up detection interval
    useEffect(() => {
        if (isWebcamStarted && modelsLoaded) {
            const interval = setInterval(detectDistraction, 500);
            setDetectionInterval(interval);
        } else if (detectionInterval) {
            clearInterval(detectionInterval);
            setDetectionInterval(null);
        }
    }, [isWebcamStarted, modelsLoaded]);

    // Fun distraction messages
    const getDistractionMessage = (type) => {
        const messages = {
            noFace: [
                "👻 Where did you go? Your screen misses you!",
                "🚨 Alert: User vanished. Abducted by aliens? 👽",
                "📢 Hey! There's work to be done here!",
                "🌌 The void you left is as big as my to-do list"
            ],
            lookingAway: [
                "👀 Eyes! Literally, put your eyes here!",
                "🧐 What's over there that's more interesting than me?",
                "🔄 Your attention should be here like a magnet to metal",
                "🎯 Focus, focus, focus... like a laser!"
            ],
            eyesClosed: [
                "😴 Sleeping on the job? Wake up, they're paying you!",
                "💤 The beauty of code isn't appreciated with closed eyes",
                "🛌 This isn't a hotel, but you seem to have fallen asleep",
                "🌙 Dreaming about code doesn't count as working on it"
            ]
        };

        return messages[type][Math.floor(Math.random() * messages[type].length)];
    };

    // Start webcam
    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: "user" 
                }   
            });    
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play(); // Ensure video plays
                setIsWebcamStarted(true);
            }
        } catch (error) {
            console.error('Error accessing webcam:', error);
            alert('Could not access webcam. Please make sure you have granted the necessary permissions.');
        }
    };

    // Stop webcam
    const stopWebcam = () => {
        const video = videoRef.current;
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            setIsWebcamStarted(false);
            setIsDistracted(false);
            setFaceDetected(false);      
            // Clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    // Detect distraction
    const detectDistraction = async () => {
        if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const displaySize = { width: video.width, height: video.height };
    
        faceapi.matchDimensions(canvas, displaySize);

        try {
            const detections = await faceapi.detectAllFaces(
                video, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();

            // Clear canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);      
            // Draw detections
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            if (detections.length === 0) {
                // No face detected
                setFaceDetected(false);
                setStats(prev => ({ ...prev, noFaceCount: prev.noFaceCount + 1 }));
        
                // Consider distracted if no face for 3+ consecutive detections
                if (stats.noFaceCount >= 3) {
                    setIsDistracted(true);
                    setDistractionMessage(getDistractionMessage('noFace'));
                }

                return;
            }

            // Face detected
            setFaceDetected(true);
            setStats(prev => ({ ...prev, noFaceCount: 0 }));

            const landmarks = detections[0].landmarks;
            const expressions = detections[0].expressions;

            // Calculate gaze direction based on landmarks
            const isLookingAway = checkIfLookingAway(landmarks);
            const eyesClosed = expressions.happy > 0.9 || checkIfEyesClosed(landmarks);

            // Update counters
            if (isLookingAway) {
                setStats(prev => ({ ...prev, lookingAwayCount: prev.lookingAwayCount + 1 }));
            } else {
                setStats(prev => ({ ...prev, lookingAwayCount: 0 }));
            }

            if (eyesClosed) {
                setStats(prev => ({ ...prev, eyesClosedCount: prev.eyesClosedCount + 1 }));
            } else {
                setStats(prev => ({ ...prev, eyesClosedCount: 0 }));
            }

            // Determine if distracted
            const lookingAwayDistracted = stats.lookingAwayCount >= 3;
            const eyesClosedDistracted = stats.eyesClosedCount >= 5;
            const isCurrentlyDistracted = lookingAwayDistracted || eyesClosedDistracted;
            
            if (isCurrentlyDistracted) {
                setIsDistracted(true);
                if (lookingAwayDistracted) {
                    setDistractionMessage(getDistractionMessage('lookingAway'));
                } else if (eyesClosedDistracted) {
                    setDistractionMessage(getDistractionMessage('eyesClosed'));
                }
            } else {
                setIsDistracted(false);
            }
        } catch (error) {
            console.error('Error detecting faces:', error);
        }
    };

    // Check if user is looking away
    const checkIfLookingAway = (landmarks) => {
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();
    
        // Key points for orientation
        const noseTip = nose[6]; // Nose tip
        const jawLeft = jaw[0];  // Leftmost jaw point
        const jawRight = jaw[16]; // Rightmost jaw point
    
        // Calculate face horizontal vector
        const faceWidth = jawRight.x - jawLeft.x;
    
        // If nose tip deviates significantly from center
        const noseDeviation = Math.abs(noseTip.x - (jawLeft.x + faceWidth/2));
    
        // Empirical threshold (adjust as needed)
        return noseDeviation > faceWidth * 0.2;
    };

    // Check if eyes are closed
    const checkIfEyesClosed = (landmarks) => {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
    
        // Calculate eye opening ratio
        const leftEyeHeight = getEyeHeight(leftEye);
        const rightEyeHeight = getEyeHeight(rightEye);
        
        // Empirical threshold (adjust as needed)
        const eyeClosedThreshold = 0.268;
        
        return leftEyeHeight < eyeClosedThreshold || rightEyeHeight < eyeClosedThreshold;
    };

    // Calculate eye height (ratio between height and width)
    const getEyeHeight = (eyePoints) => {
        // Top and bottom eye points
        const top = (eyePoints[1].y + eyePoints[2].y) / 2;
        const bottom = (eyePoints[4].y + eyePoints[5].y) / 2;
        const left = eyePoints[0].x;
        const right = eyePoints[3].x;
    
        const height = bottom - top;
        const width = right - left;
    
        return height / width; // Normalized by eye width
    };

    return (
        <div style={{
            fontFamily: 'Inter, Arial, sans-serif',
            maxWidth: '900px',
            margin: '0 auto',
            padding: '24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
            minHeight: '100vh',
        }}>
            {/* Toast Alert */}
            {isDistracted && (
                <div className="alert-pulse" style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ff4757',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(255, 71, 87, 0.3)',
                    zIndex: 1000,
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
                    textAlign: 'center'
                }}>
                    {distractionMessage}
                </div>
            )}

            <h1 style={{ textAlign: 'center', color: '#222', fontWeight: 800, letterSpacing: '-1px', fontSize: '2.5rem', marginBottom: '12px' }}>
                <span style={{color: '#2ed573'}}>Distraction</span> Detector
            </h1>
            <p style={{textAlign: 'center', color: '#555', marginBottom: '32px', fontSize: '1.1rem'}}>Stay focused! The system detects distractions in real time.</p>

            {/* Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '28px',
            }}>
                <button
                    onClick={isWebcamStarted ? stopWebcam : startWebcam}
                    style={{
                        padding: '12px 32px',
                        background: isWebcamStarted ? 'linear-gradient(90deg,#ff4757 60%,#ff6b81 100%)' : 'linear-gradient(90deg,#2ed573 60%,#1dd1a1 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(44,62,80,0.08)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    {isWebcamStarted ? <span role="img" aria-label="stop">🛑</span> : <span role="img" aria-label="start">🎥</span>}
                    {isWebcamStarted ? 'Stop' : 'Start'} Webcam
                </button>
            </div>

            {/* Video y Canvas en tarjeta */}
            <div style={{
                position: 'relative',
                margin: '0 auto 32px auto',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 6px 24px rgba(44,62,80,0.10)',
                background: '#fff',
                width: '100%',
                maxWidth: '680px',
                minHeight: '320px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    width="640"
                    height="480"
                    style={{
                        display: isWebcamStarted ? 'block' : 'none',
                        backgroundColor: '#000',
                        transform: 'scaleX(-1)',
                        borderRadius: '18px',
                        width: '100%',
                        maxWidth: '640px',
                        minHeight: '320px',
                    }}
                />
                <canvas
                    ref={canvasRef}
                    width="640"
                    height="480"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        transform: 'scaleX(-1)',
                        borderRadius: '18px',
                        width: '100%',
                        maxWidth: '640px',
                        minHeight: '320px',
                    }}
                />
                {!isWebcamStarted && (
                    <div style={{
                        width: '100%',
                        minHeight: '320px',
                        background: 'linear-gradient(135deg,#f1f2f6 60%,#dfe4ea 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        fontSize: '1.3rem',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                    }}>
                        <span role="img" aria-label="webcam">📷</span> Webcam not started
                    </div>
                )}
            </div>

            {/* Status Card */}
            <div style={{
                background: 'linear-gradient(90deg,#f1f2f6 60%,#e9ecef 100%)',
                padding: '22px',
                borderRadius: '14px',
                marginBottom: '28px',
                boxShadow: '0 2px 8px rgba(44,62,80,0.06)',
                maxWidth: '680px',
                margin: '0 auto 28px auto',
            }}>
                <h3 style={{ marginTop: 0, fontWeight: 700, color: '#222', fontSize: '1.3rem' }}>Attention Status:</h3>
                <p style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: (isDistracted || stats.lookingAwayCount >= 3 || stats.eyesClosedCount >= 5) ? '#ff4757' : '#2ed573',
                    marginBottom: '10px',
                }}>
                    {(isDistracted || stats.lookingAwayCount >= 3 || stats.eyesClosedCount >= 5) ? '⚠️ Distracted' : '✅ Paying attention'}
                </p>
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{fontSize: '1.2rem'}}>{faceDetected ? '🟢' : '🔴'}</span>
                        <span style={{fontWeight: 600}}>Face:</span>
                        <span style={{
                            background: faceDetected ? '#2ed573' : '#ff4757',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '2px 10px',
                            fontWeight: 700,
                            fontSize: '1rem',
                        }}>{faceDetected ? 'Detected' : 'No'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span role="img" aria-label="noface">👻</span>
                        <span style={{fontWeight: 600}}>No face:</span>
                        <span style={{
                            background: '#ffbe76',
                            color: '#222',
                            borderRadius: '8px',
                            padding: '2px 10px',
                            fontWeight: 700,
                            fontSize: '1rem',
                        }}>{stats.noFaceCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span role="img" aria-label="away">👀</span>
                        <span style={{fontWeight: 600}}>Looking away:</span>
                        <span style={{
                            background: '#f6e58d',
                            color: '#222',
                            borderRadius: '8px',
                            padding: '2px 10px',
                            fontWeight: 700,
                            fontSize: '1rem',
                        }}>{stats.lookingAwayCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span role="img" aria-label="sleep">😴</span>
                        <span style={{fontWeight: 600}}>Eyes closed:</span>
                        <span style={{
                            background: '#7ed6df',
                            color: '#222',
                            borderRadius: '8px',
                            padding: '2px 10px',
                            fontWeight: 700,
                            fontSize: '1rem',
                        }}>{stats.eyesClosedCount}</span>
                    </div>
                </div>
            </div>



            {/* Global styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                @keyframes pulse {
                    0% { transform: translateX(-50%) scale(1); }
                    50% { transform: translateX(-50%) scale(1.05); }
                    100% { transform: translateX(-50%) scale(1); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                button:hover {
                    opacity: 0.92;
                    transform: translateY(-2px) scale(1.03);
                }
                @media (max-width: 700px) {
                    div[style*='max-width: 680px'] {
                        max-width: 98vw !important;
                    }
                    video, canvas {
                        max-width: 98vw !important;
                        min-width: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default FaceAttentionDetection;