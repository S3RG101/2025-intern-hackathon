import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  initializeStudyBuddy,
  loadDocuments,
  loadPDFDocuments,
  askQuestionSpecialized
} from './langchain';

function StudyBuddy({
  sidebarOpen,
  setSidebarOpen,
  studyBuddyChatOpen,
  setStudyBuddyChatOpen,
}) {
  const [studyBuddyResponse, setStudyBuddyResponse] = useState('');
  const [question, setQuestion] = useState('');
  const [studyNotes, setStudyNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studyBuddyStatus, setStudyBuddyStatus] = useState('Not initialized');

  // Initialize StudyBuddy on component mount
  useEffect(() => {
    const initStudyBuddy = async () => {
      try {
        const result = await initializeStudyBuddy();
        setStudyBuddyStatus(result);
        console.log('StudyBuddy initialized:');
      } catch (error) {
        setStudyBuddyStatus('Error initializing: ' + error.message);
      }
    };
    initStudyBuddy();
  }, []);

  const handleLoadNotes = async () => {
    if (!studyNotes.trim()) {
      alert('Please enter your study notes first.');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await loadDocuments(studyNotes);
      setStudyBuddyStatus(result);
      setStudyBuddyResponse('Notes loaded successfully. You can now ask questions!');
    } catch (error) {
      setStudyBuddyResponse('Error loading notes: ' + error.message);
    }
    setIsLoading(false);
  };

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.includes('pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    
    setIsLoading(true);
    setStudyBuddyResponse('📄 Processing PDF file...');
    
    try {
      const result = await loadPDFDocuments(file);
      setStudyBuddyStatus(result);
      setStudyBuddyResponse('✅ PDF loaded successfully. You can now ask questions!');
    } catch (error) {
      setStudyBuddyResponse(`❌ PDF Processing Not Available\n\n${error.message}\n\n💡 Workaround:\n1. Open your PDF in a PDF viewer\n2. Copy the text content (Ctrl+A, then Ctrl+C)\n3. Paste it in the "Text Notes" section above`);
    }
    setIsLoading(false);
    
    // Clear the file input
    event.target.value = '';
  };

  const handleStudyBuddyClick = () => {
    setStudyBuddyChatOpen(!studyBuddyChatOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
    // When closing sidebar, also close chat
    if (sidebarOpen) {
      setStudyBuddyChatOpen(false);
    }
  };

  const handleSimpleQuestion = async () => {
    if (!question.trim()) {
      alert('Please enter a question.');
      return;
    }
    
    setIsLoading(true);
    try {
      const answer = await askQuestionSpecialized(question);
      setStudyBuddyResponse(answer);
      setQuestion(''); // Clear input after asking
    } catch (error) {
      setStudyBuddyResponse('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <>
      {/* Modern Toggle Button */}
      <button
        onClick={handleSidebarToggle}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: sidebarOpen ? (studyBuddyChatOpen ? '630px' : '300px') : '20px',
          zIndex: 1001,
          backgroundColor: '#F08455',
          color: 'white',
          border: '1px solid #F08455',
          borderRadius: '12px',
          width: sidebarOpen ? '50px' : '150px',
          height: '48px',
          fontSize: '18px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#DAA856';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#F08455';
          e.target.style.transform = 'scale(1)';
        }}
      >
        {sidebarOpen ? '✕' : 'Pomotato AI'}
      </button>

      {/* Modern Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? '0' : '-280px',
          width: '280px',
          height: '100vh',
          backgroundColor: '#DAA856', // Potato Yellow
          color: '#ffffff',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          overflowY: 'auto',
          boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
          borderRight: sidebarOpen ? '1px solid #a98244' : 'none'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #a98244',
          marginTop: '60px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: '600',
            color: '#000000' // Black text
          }}>
            <span style={{ marginRight: '12px', fontSize: '24px', color:'black' }}>🚀</span>
            StudyHub
          </div>
          <div style={{
            fontSize: '12px',
            color: '#000000', // Black text
            opacity: 0.7,
            marginTop: '4px',
            letterSpacing: '0.5px'
          }}>
            AI-POWERED LEARNING
          </div>
        </div>
        
        {/* Navigation */}
        <div style={{ padding: '16px 0' }}>
          {/* StudyBuddy Feature */}
          <div
            onClick={handleStudyBuddyClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 20px',
              margin: '2px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: studyBuddyChatOpen ? '#F08455' : 'transparent', // Orange Button
              color: studyBuddyChatOpen ? '#ffffff' : '#000000', // Black text
              transition: 'all 0.2s ease',
              position: 'relative',
              borderLeft: studyBuddyChatOpen ? '3px solid #F08455' : '3px solid transparent' // Orange Button
            }}
            onMouseEnter={(e) => {
              if (!studyBuddyChatOpen) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = '#000000'; // Black text
              }
            }}
            onMouseLeave={(e) => {
              if (!studyBuddyChatOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#000000'; // Black text
              }
            }}
          >
            <span style={{
              fontSize: '18px',
              marginRight: '12px',
              width: '20px',
              textAlign: 'center'
            }}>🎓</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>StudyBuddy AI</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Smart learning assistant</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            backgroundColor: '#a98244',
            margin: '16px 20px'
          }}></div>

          {/* Coming Soon Features */}
          <div style={{ padding: '0 20px', marginBottom: '12px' }}>
            <div style={{
              fontSize: '11px',
              color: '#000000', // Black text
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: '600',
              opacity: 0.6
            }}>
              Coming Soon
            </div>
          </div>

          {[
            { icon: '📝', title: 'Note Organizer', desc: 'Smart note management' },
            { icon: '🧠', title: 'Memory Palace', desc: 'Visual memory techniques' },
            { icon: '📊', title: 'Progress Tracker', desc: 'Learning analytics' },
            { icon: '🔗', title: 'Study Groups', desc: 'Collaborative learning' }
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 20px',
                margin: '2px 12px',
                borderRadius: '6px',
                cursor: 'not-allowed',
                opacity: 0.5,
                color: '#000000' // Black text
              }}
            >
              <span style={{
                fontSize: '16px',
                marginRight: '12px',
                width: '20px',
                textAlign: 'center',
                filter: 'grayscale(100%)'
              }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '400' }}>{item.title}</div>
                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '1px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          padding: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          border: '1px solid #a98244'
        }}>
          <div style={{ fontSize: '11px', color: '#000000', textAlign: 'center', opacity: 0.8 }}>
            <div>StudyHub v1.0</div>
            <div style={{ marginTop: '4px' }}>Powered by AI</div>
          </div>
        </div>
      </div>

      {/* StudyBuddy Chat Panel - Expandable */}
      {sidebarOpen && studyBuddyChatOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '280px',
            width: '350px',
            height: '100vh',
            backgroundColor: '#FCE5AE', // Light Yellow
            borderRight: '1px solid #DAA856', // Potato Yellow
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
          }}
        >
          {/* Chat Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #DAA856', // Potato Yellow
            backgroundColor: '#DAA856' // Potato Yellow
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '18px',
              fontWeight: '600',
              color: '#000000' // Black text
            }}>
              <span style={{ marginRight: '12px', fontSize: '20px' }}>🎓</span>
              StudyBuddy Chat
            </div>
            <div style={{
              fontSize: '12px',
              color: '#333333', // Dark text
              marginTop: '4px'
            }}>
              Status: {studyBuddyStatus}
            </div>
          </div>

          {/* PDF Upload Section */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #DAA856', // Potato Yellow
            backgroundColor: '#DAA856', // Potato Yellow
            paddingRight:'25px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000000' }}>
              📄 Load PDFs
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handlePDFUpload}
              disabled={isLoading}
              multiple
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #a98244',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: '#FCE5AE', // Light Yellow
                color: '#000000' // Black text
              }}
            />
            {/* Alternative text input */}
            <div style={{ marginTop: '12px' }}>
              <textarea
                placeholder="Or paste your study notes here..."
                value={studyNotes}
                onChange={(e) => setStudyNotes(e.target.value)}
                style={{
                  width: '100%',
                  height: '60px',
                  padding: '8px',
                  border: '1px solid #a98244',
                  borderRadius: '6px',
                  fontSize: '12px',
                  resize: 'vertical',
                  backgroundColor: '#FCE5AE', // Light Yellow
                  color: '#000000' // Black text
                }}
              />
              <button
                onClick={handleLoadNotes}
                disabled={isLoading}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#F08455', // Orange Button
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Load Notes
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            backgroundColor: '#FCE5AE' // Light Yellow
          }}>
            {studyBuddyResponse ? (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #DAA856', // Potato Yellow
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '10px', color: '#a98244', marginBottom: '6px' }}>
                  StudyBuddy:
                </div>
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h1 style={{fontSize: '16px', color: '#000000', margin: '8px 0'}}>{children}</h1>,
                    h2: ({children}) => <h2 style={{fontSize: '14px', color: '#111111', margin: '6px 0'}}>{children}</h2>,
                    h3: ({children}) => <h3 style={{fontSize: '13px', color: '#222222', margin: '4px 0'}}>{children}</h3>,
                    p: ({children}) => <p style={{fontSize: '12px', lineHeight: '1.4', margin: '4px 0', color: '#000000'}}>{children}</p>,
                    code: ({children}) => <code style={{backgroundColor: '#FCE5AE', color: '#000000', padding: '2px 4px', borderRadius: '3px', fontSize: '11px'}}>{children}</code>,
                    pre: ({children}) => <pre style={{backgroundColor: '#DAA856', color: '#000000', padding: '8px', borderRadius: '4px', fontSize: '11px', overflow: 'auto'}}>{children}</pre>,
                    ul: ({children}) => <ul style={{fontSize: '12px', paddingLeft: '16px', color: '#000000'}}>{children}</ul>,
                    ol: ({children}) => <ol style={{fontSize: '12px', paddingLeft: '16px', color: '#000000'}}>{children}</ol>,
                    li: ({children}) => <li style={{marginBottom: '2px', color: '#000000'}}>{children}</li>
                  }}
                >
                  {studyBuddyResponse}
                </ReactMarkdown>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#a98244',
                fontSize: '12px',
                fontStyle: 'italic',
                marginTop: '20px'
              }}>
                Load your PDFs or notes above, then ask questions here!
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #DAA856', // Potato Yellow
            backgroundColor: '#DAA856' // Potato Yellow
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ask a question about your notes..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSimpleQuestion()}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #a98244',
                  borderRadius: '6px',
                  fontSize: '12px',
                  backgroundColor: '#FCE5AE', // Light Yellow
                  color: '#000000' // Black text
                }}
              />
              <button
                onClick={handleSimpleQuestion}
                disabled={isLoading || !question.trim()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: isLoading || !question.trim() ? '#F8C4B4' : '#F08455', // Light Orange for disabled
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading || !question.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                {isLoading ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StudyBuddy;