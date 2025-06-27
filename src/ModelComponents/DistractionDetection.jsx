import React, { useRef, useState, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';

const DistractionDetection = ({ onDistractionChange }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const objectDetectionIntervalRef = useRef(null);
    const faceDetectionIntervalRef = useRef(null);

    // State management
    const [isWebcamStarted, setIsWebcamStarted] = useState(false);
    const [currentDistraction, setCurrentDistraction] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    // Object detection states
    const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(true);

    // Face detection states
    const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [isDistracted, setIsDistracted] = useState(false);
    const [distractionMessage, setDistractionMessage] = useState('');
    const [distractionType, setDistractionType] = useState(''); // To show the type of distraction
    const [stats, setStats] = useState({
        noFaceCount: 0,
        lookingAwayCount: 0,
        eyesClosedCount: 0
    });

    // Ref to maintain current counters without depending on state
    const statsRef = useRef({
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
                console.log('Face detection models loaded successfully');
            } catch (error) {
                console.error('Error loading face detection models:', error);
            }
        };
        loadModels();
    }, []);

    // Start webcam and detection
    const startWebcamAndDetection = async () => {
        try {
            if (videoRef.current && !videoRef.current.srcObject) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: 640, 
                        height: 480,
                        facingMode: "user" 
                    } 
                });
            
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                // Set up video event handlers
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play().catch(e => console.error("Error playing video:", e));
                    }
                };
            }

            // Start object detection
            if (objectDetectionEnabled && !objectDetectionIntervalRef.current) {
                objectDetectionIntervalRef.current = setInterval(predictObject, 500);
            }

            // Start face detection after models are loaded
            if (faceDetectionEnabled && modelsLoaded && !faceDetectionIntervalRef.current) {
                setTimeout(() => {
                    if (isWebcamStarted && streamRef.current) {
                        faceDetectionIntervalRef.current = setInterval(detectFaceDistraction, 500);
                    }
                }, 500);
            }
        } catch (err) {
            console.error('Error starting webcam:', err);
            setIsWebcamStarted(false);
            if (onDistractionChange) onDistractionChange(false, null);
        }
    };

    // Stop webcam and detection
    const stopWebcamAndDetection = () => {
        // Stop intervals
        if (objectDetectionIntervalRef.current) {
            clearInterval(objectDetectionIntervalRef.current);
            objectDetectionIntervalRef.current = null;
        }
    
        if (faceDetectionIntervalRef.current) {
            clearInterval(faceDetectionIntervalRef.current);
            faceDetectionIntervalRef.current = null;
        }
    
        // Stop camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try { track.stop(); } catch (e) {}
            });
            streamRef.current = null;
        }
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        // Clear canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        
        // Reset states
        setShowAlert(false);
        setCurrentDistraction('');
        setIsDistracted(false);
        setFaceDetected(false);
        setDistractionType('');
        setStats({
            noFaceCount: 0,
            lookingAwayCount: 0,
            eyesClosedCount: 0
        });
        
        // Reset ref counters
        statsRef.current = {
            noFaceCount: 0,
            lookingAwayCount: 0,
            eyesClosedCount: 0
        };
        
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
    }, [isWebcamStarted, objectDetectionEnabled, faceDetectionEnabled, modelsLoaded]);

    // Object detection messages
    const getObjectDetectionMessage = (distractionType) => {
        const messages = {
            phone: [
                "📱 Put that rectangle of distraction down! Your productivity called, it's crying! 😭",
            ],
            pet: [
                "🐕 Aww, pet therapy session detected! But your work is feeling lonely too! 🥺",
            ],
            people: [
                "👫 Multiple humans detected! Are you starting a productivity support group? 🤝📊",
            ]
        };
        const typeMessages = messages[distractionType] || messages.phone;
        return typeMessages[Math.floor(Math.random() * typeMessages.length)];
    };

    // Face detection messages
    const getFaceDetectionMessage = (type) => {
        const messages = {
            noFace: [
                "👻 Where did you go? Your screen misses you!",
            ],
            lookingAway: [
                "👀 Eyes! Literally, put your eyes here!",
            ],
            eyesClosed: [
                "😴 Sleeping on the job? Wake up, they're paying you!",
            ]
        };
        return messages[type][Math.floor(Math.random() * messages[type].length)];
    };

    // Object detection function
    const predictObject = async () => {
        if (!videoRef.current || !objectDetectionEnabled) return;
        
        try {
            const model = await cocoSsd.load();
            const predictions = await model.detect(videoRef.current);        
            
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
            
            const anyObjectDistractionDetected = cellPhoneDetected || petDetected || multiplePersonDetected;
            
            if (anyObjectDistractionDetected) {
                const message = getObjectDetectionMessage(distractionType);
                handleDistractionDetected(message, distractionType);
            }
        } catch (err) {
            console.error('Object detection error:', err);
        }
    };

    // Face detection function
    const detectFaceDistraction = async () => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current || !faceDetectionEnabled) return;
        if (videoRef.current.readyState < 2) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const displaySize = { width: 160, height: 120 };
        
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
                statsRef.current.noFaceCount += 1;
                setStats(prev => ({ ...prev, noFaceCount: statsRef.current.noFaceCount }));

                if (statsRef.current.noFaceCount >= 5) {
                    const message = getFaceDetectionMessage('noFace');
                    handleDistractionDetected(message, 'noFace');
                }
                return;
            }

            // Face detected
            setFaceDetected(true);
            statsRef.current.noFaceCount = 0;
            setStats(prev => ({ ...prev, noFaceCount: 0 }));

            const landmarks = detections[0].landmarks;
            const expressions = detections[0].expressions;

            // Calculate gaze direction and eye state
            const isLookingAway = checkIfLookingAway(landmarks);
            const eyesClosed = expressions.happy > 0.9 || checkIfEyesClosed(landmarks);

            // Update counters using ref for immediate access
            if (isLookingAway) {
                statsRef.current.lookingAwayCount += 1;
                setStats(prev => ({ ...prev, lookingAwayCount: statsRef.current.lookingAwayCount }));
            } else {
                statsRef.current.lookingAwayCount = 0;
                setStats(prev => ({ ...prev, lookingAwayCount: 0 }));
            }

            if (eyesClosed) {
                statsRef.current.eyesClosedCount += 1;
                setStats(prev => ({ ...prev, eyesClosedCount: statsRef.current.eyesClosedCount }));
            } else {
                statsRef.current.eyesClosedCount = 0;
                setStats(prev => ({ ...prev, eyesClosedCount: 0 }));
            }

            // Determine if distracted using ref values for immediate access
            const lookingAwayDistracted = statsRef.current.lookingAwayCount >= 3;
            const eyesClosedDistracted = statsRef.current.eyesClosedCount >= 5;
            
            if (lookingAwayDistracted) {
                const message = getFaceDetectionMessage('lookingAway');
                handleDistractionDetected(message, 'lookingAway');
            } else if (eyesClosedDistracted) {
                const message = getFaceDetectionMessage('eyesClosed');
                handleDistractionDetected(message, 'eyesClosed');
            } else {
                // No face distraction detected
                if (!showAlert) { // Only clear if no other distractions
                handleNoDistraction();
                }
            }
        } catch (error) {
            console.error('Error detecting faces:', error);
        }
    };

    // Handle distraction detected
    const handleDistractionDetected = (message, type = '') => {
        setCurrentDistraction(message);
        setShowAlert(true);
        setIsDistracted(true);
        setDistractionMessage(message);
        setDistractionType(type);
        
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
    };

    // Handle no distraction
    const handleNoDistraction = () => {
        setShowAlert(false);
        setCurrentDistraction('');
        setIsDistracted(false);
        setDistractionType('');
        
        if (onDistractionChange) {
        onDistractionChange(false, null);
        }
    };

    // Face analysis helper functions
    const checkIfLookingAway = (landmarks) => {
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();

        const noseTip = nose[6];
        const jawLeft = jaw[0];
        const jawRight = jaw[16];

        const faceWidth = jawRight.x - jawLeft.x;
        const noseDeviation = Math.abs(noseTip.x - (jawLeft.x + faceWidth/2));

        return noseDeviation > faceWidth * 0.2;
    };

    const checkIfEyesClosed = (landmarks) => {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const leftEyeHeight = getEyeHeight(leftEye);
        const rightEyeHeight = getEyeHeight(rightEye);
        
        const eyeClosedThreshold = 0.268;
        
        return leftEyeHeight < eyeClosedThreshold || rightEyeHeight < eyeClosedThreshold;
    };

    const getEyeHeight = (eyePoints) => {
        const top = (eyePoints[1].y + eyePoints[2].y) / 2;
        const bottom = (eyePoints[4].y + eyePoints[5].y) / 2;
        const left = eyePoints[0].x;
        const right = eyePoints[3].x;

        const height = bottom - top;
        const width = right - left;

        return height / width;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'absolute', top: 24, left: 24, zIndex: 2000 }}>
        {/* Main control button */}
        <button 
            onClick={() => setIsWebcamStarted((prev) => !prev)} 
            style={{ 
            marginBottom: '8px',
            padding: '8px 16px',
            background: isWebcamStarted ? '#ff4757' : '#F08455',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
            }}
        >
            {isWebcamStarted ? "Stop" : "Start"} Distraction Detection
        </button>        

        {/* Video display */}
        {isWebcamStarted && (
            <div style={{ position: 'relative', width: 160, height: 120 }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                width={160}
                height={120}
                style={{
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
                borderRadius: 8,
                pointerEvents: 'none'
                }}
            />
            </div>
        )}

        {/* Status indicators */}
        {isWebcamStarted && (
            <div style={{ 
            marginTop: '8px', 
            display: 'flex', 
            gap: '8px', 
            flexWrap: 'wrap',
            fontSize: '10px',
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
            <span style={{ 
                padding: '2px 6px', 
                background: modelsLoaded ? '#2ed573' : '#ffa502',
                color: 'white',
                borderRadius: '4px',
                fontWeight: 'bold'
            }}>
                Models: {modelsLoaded ? 'Loaded' : 'Loading...'}
            </span>
            </div>
        )}

        {/* Distraction status label */}
        {isWebcamStarted && (
            <div style={{ 
            marginTop: '8px', 
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            maxWidth: '180px',
            textAlign: 'center',
            border: '2px solid',
            background: isDistracted ? '#ff4757' : '#2ed573',
            borderColor: isDistracted ? '#ff3742' : '#26de5c',
            color: 'white',
            boxShadow: isDistracted ? '0 4px 12px rgba(255, 71, 87, 0.3)' : '0 4px 12px rgba(46, 213, 115, 0.3)'
            }}>
            {isDistracted ? (
                <div>
                <div>🚨 DISTRACTION</div>
                <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.9 }}>
                    {distractionType === 'phone' && '📱 Phone'}
                    {distractionType === 'pet' && '🐕 Pet'}
                    {distractionType === 'people' && '👫 People'}
                    {distractionType === 'noFace' && '👻 No Face'}
                    {distractionType === 'lookingAway' && '👀 Looking Away'}
                    {distractionType === 'eyesClosed' && '😴 Eyes Closed'}
                </div>
                </div>
            ) : (
                <div>✅ FOCUSED</div>
            )}
            </div>
        )}

        {/* Debug counters (optional) */}
        {isWebcamStarted && faceDetectionEnabled && (
            <div style={{ 
            marginTop: '8px', 
            fontSize: '9px',
            color: '#666',
            background: '#f8f9fa',
            padding: '4px 8px',
            borderRadius: '4px',
            lineHeight: '1.3'
            }}>
            <div>No face: {stats.noFaceCount}/5</div>
            <div>Looking away: {stats.lookingAwayCount}/3</div>
            <div>Eyes closed: {stats.eyesClosedCount}/5</div>
            </div>
        )}
        </div>
    );
};
export default DistractionDetection;
