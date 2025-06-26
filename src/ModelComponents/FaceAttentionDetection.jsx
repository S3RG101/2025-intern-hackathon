import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm'; 

const FaceAttentionDetection = ({ onDistractionChange }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [isWebcamStarted, setIsWebcamStarted] = useState(false);
    const [isDistracted, setIsDistracted] = useState(false);
    const [distractionMessage, setDistractionMessage] = useState('');
    const [detectionInterval, setDetectionInterval] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [stats, setStats] = useState({
        noFaceCount: 0,
        lookingAwayCount: 0,
        eyesClosedCount: 0
    });

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            try {                        
                await tf.setBackend('wasm');
                await tf.ready();

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

    // Manage detection when webcam is started
    useEffect(() => {
        let interval = null;
        
        const startDetection = async () => {
            try {
                if (isWebcamStarted && modelsLoaded) {
                    // Start webcam if not already started
                    if (!streamRef.current) {
                        const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { 
                                width: 640, 
                                height: 480,
                                facingMode: "user" 
                            }   
                        });
                        
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            streamRef.current = stream;
                            
                            // Set up video event handlers
                            videoRef.current.onloadedmetadata = () => {
                                if (videoRef.current) {
                                    videoRef.current.play().catch(e => console.error("Error playing video:", e));
                                }
                            };
                            
                            // Start detection after a short delay to ensure video is ready
                            setTimeout(() => {
                                if (isWebcamStarted && streamRef.current) {
                                    interval = setInterval(detectDistraction, 500);
                                    setDetectionInterval(interval);
                                    
                                    // Initialize with a default message
                                    if (!distractionMessage) {
                                        setDistractionMessage(getDistractionMessage('noFace'));
                                    }
                                }
                            }, 500);
                        }
                    } else {
                        // Stream exists, just start interval if not already started
                        if (!detectionInterval) {
                            interval = setInterval(detectDistraction, 500);
                            setDetectionInterval(interval);
                        }
                    }
                } else if (!isWebcamStarted) {
                    // Stop everything if webcam should be off
                    if (detectionInterval) {
                        clearInterval(detectionInterval);
                        setDetectionInterval(null);
                    }
                    
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => {
                            try { track.stop(); } catch (e) {}
                        });
                        streamRef.current = null;
                    }
                    
                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                    }
                    
                    setIsDistracted(false);
                    setShowAlert(false);
                    setFaceDetected(false);
                    
                    // Clear canvas
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    // Notify parent component
                    if (onDistractionChange) {
                        onDistractionChange(false, null);
                    }
                }
            } catch (error) {
                console.error('Error with webcam:', error);
                setIsWebcamStarted(false);
                if (onDistractionChange) onDistractionChange(false, null);
            }
        };
        
        startDetection();
        
        // Cleanup function
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isWebcamStarted, modelsLoaded]);

    // Fun distraction messages
    const getDistractionMessage = (type) => {
        const messages = {
            noFace: [
                "👻 Where did you go? Your screen misses you!",
                //"🚨 Alert: User vanished. Abducted by aliens? 👽",
                //"📢 Hey! There's work to be done here!",
                //"🌌 The void you left is as big as my to-do list"
            ],
            lookingAway: [
                "👀 Eyes! Literally, put your eyes here!",
                //"🧐 What's over there that's more interesting than me?",
                //"🔄 Your attention should be here like a magnet to metal",
                //"🎯 Focus, focus, focus... like a laser!"
            ],
            eyesClosed: [
                "😴 Sleeping on the job? Wake up, they're paying you!",
                //"💤 The beauty of code isn't appreciated with closed eyes",
                //"🛌 This isn't a hotel, but you seem to have fallen asleep",
                //"🌙 Dreaming about code doesn't count as working on it"
            ]
        };

        return messages[type][Math.floor(Math.random() * messages[type].length)];
    };

    // These functions are now handled directly in the useEffect

    // Detect distraction
    const detectDistraction = async () => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
        if (videoRef.current.readyState < 2) return; // Wait until video metadata is loaded
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Use fixed dimensions for consistency
        const displaySize = { width: 160, height: 120 };
        
        // Match canvas dimensions to video display size
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
        
                // Consider distracted if no face for 5+ consecutive detections
                if (stats.noFaceCount >= 5) {
                    setIsDistracted(true);
                    
                    // Always update the message when no face is detected
                    const message = getDistractionMessage('noFace');
                    console.log("Setting no face message:", message);
                    setDistractionMessage(message);                    
                    setShowAlert(true);
                    
                    // Notify parent component
                    if (onDistractionChange) {
                        const banner = (
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
                                {message}
                            </div>
                        );
                        onDistractionChange(true, banner);
                    }
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
                
                // Always update the message when distraction is detected
                let message;
                if (lookingAwayDistracted) {
                    message = getDistractionMessage('lookingAway');
                    console.log("Setting looking away message:", message);
                    setDistractionMessage(message);
                } else if (eyesClosedDistracted) {
                    message = getDistractionMessage('eyesClosed');
                    console.log("Setting eyes closed message:", message);
                    setDistractionMessage(message);
                }
                
                setShowAlert(true); // Always show the alert if distracted
                
                // Notify parent component
                if (onDistractionChange) {
                    const banner = (
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
                            {message}
                        </div>
                    );
                    onDistractionChange(true, banner);
                }
            } else {
                setIsDistracted(false);
                setShowAlert(false); // Hide the alert if not distracted
                
                // Notify parent component
                if (onDistractionChange) {
                    onDistractionChange(false, null);
                }
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <button 
                onClick={() => setIsWebcamStarted(prev => !prev)} 
                style={{ 
                    marginBottom: '8px',
                    padding: '6px 12px',
                    background: isWebcamStarted ? '#ff4757' : '#2ed573',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                {isWebcamStarted ? "Stop" : "Start"} Face Detection
            </button>
            
            {isWebcamStarted && showAlert && (
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
                    {distractionMessage}
                </div>
            )}
            
            <div style={{ position: 'relative', width: 160, height: 120 }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    width={160}
                    height={120}
                    style={{
                        display: isWebcamStarted ? 'block' : 'none',
                        borderRadius: 8,
                        border: '2px solid #7ed6df',
                        background: '#222',
                        objectFit: 'cover'
                    }}
                />
                <canvas
                    ref={canvasRef}
                    width={160}
                    height={120}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        display: isWebcamStarted ? 'block' : 'none',
                        borderRadius: 8,
                        pointerEvents: 'none'
                    }}
                />
                {!isWebcamStarted && (
                    <div style={{
                        width: 160,
                        height: 120,
                        borderRadius: 8,
                        border: '2px solid #7ed6df',
                        background: '#222',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#7ed6df',
                        fontSize: '12px'
                    }}>
                        Camera Off
                    </div>
                )}
            </div>
            
            {/* Minimalist status indicators */}
            {isWebcamStarted && (
                <div style={{ 
                    marginTop: '8px', 
                    display: 'flex', 
                    gap: '8px', 
                    flexWrap: 'wrap',
                    fontSize: '12px',
                }}>
                    <span style={{ 
                        padding: '2px 6px', 
                        background: faceDetected ? '#2ed573' : '#ff4757',
                        color: 'white',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    }}>
                        Face: {faceDetected ? 'Yes' : 'No'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default FaceAttentionDetection;