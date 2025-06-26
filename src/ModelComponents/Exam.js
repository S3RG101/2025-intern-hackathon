import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateExam as generateExamFromLangchain } from './langchain';
 
 function Exam({ onBack }) {
   const [isLoading, setIsLoading] = useState(false);
   const [examQuestions, setExamQuestions] = useState([]);
   const [showAnswers, setShowAnswers] = useState({});
 
   const handleGenerateExam = async () => {
     setIsLoading(true);
     setExamQuestions([]);
     try {
       const response = await generateExamFromLangchain("the loaded documents");
       
       const questions = response.split(/question\s*\d*:/i).slice(1).map(q => {
         const parts = q.split(/answer:/i);
         return {
           question: parts[0].trim(),
           answer: parts[1] ? parts[1].trim() : "No answer provided."
         };
       });

       if (questions.length > 0 && questions.some(q => q.question)) {
        setExamQuestions(questions.filter(q => q.question));
       } else {
        setExamQuestions([{ question: "Could not parse questions from the response.", answer: "Please check the format of the data returned by the server." }]);
       }
 
     } catch (error) {
       setExamQuestions([{ question: "Error generating exam", answer: error.message }]);
     }
     setIsLoading(false);
   };

  const toggleAnswer = (index) => {
    setShowAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div style={{ color: 'white', padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>&larr; Back to Timer</button>
      <h2>Time's up!</h2>
      <p>Do you want to evaluate yourself with a quick exam?</p>
      <button onClick={handleGenerateExam} disabled={isLoading}>
         {isLoading ? 'Generating Exam...' : 'Start Quick Exam'}
       </button>

       {examQuestions.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          {examQuestions.map((qa, index) => (
            <div key={index} style={{ marginBottom: '15px', border: '1px solid #555', borderRadius: '8px', padding: '15px', backgroundColor:"#4a4a4a"}}>
              <ReactMarkdown>{qa.question}</ReactMarkdown>
              <button onClick={() => toggleAnswer(index)} style={{ marginTop: '10px' }}>
                {showAnswers[index] ? 'Hide Answer' : 'Show Answer'}
              </button>
              {showAnswers[index] && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#4a4a4a', borderRadius: '4px' }}>
                  <ReactMarkdown>{qa.answer}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Exam;