import React, { useState, useEffect } from 'react';

const EMOTIONS = [
  { emoji: '😊', label: '행복해' },
  { emoji: '😆', label: '신나' },
  { emoji: '🥰', label: '사랑스러워' },
  { emoji: '😌', label: '편안해' },
  { emoji: '🤩', label: '기대돼' },
  { emoji: '😎', label: '자랑스러워' },
  { emoji: '🤔', label: '고민돼' },
  { emoji: '🥱', label: '피곤해' },
  { emoji: '😒', label: '귀찮아' },
  { emoji: '😕', label: '아쉬워' },
  { emoji: '😢', label: '슬퍼' },
  { emoji: '😭', label: '우울해' },
  { emoji: '😡', label: '화나' },
  { emoji: '😠', label: '짜증나' },
  { emoji: '😨', label: '무서워' },
  { emoji: '😲', label: '깜짝이야' },
  { emoji: '😳', label: '부끄러워' },
  { emoji: '🥺', label: '외로워' },
  { emoji: '😑', label: '심심해' },
  { emoji: '🧐', label: '궁금해' }
];

const STUDENTS = Array.from({ length: 30 }, (_, i) => i + 1);

function App() {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [emotion, setEmotion] = useState('');
  const [diaryText, setDiaryText] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !studentName || !emotion || !diaryText) {
      alert("모든 항목을 꼼꼼히 채워주세요!");
      return;
    }

    setIsLoading(true);
    const gasUrl = import.meta.env.VITE_GAS_URL;

    if (!gasUrl || gasUrl.includes("여기에_GAS_웹앱_URL을_입력하세요")) {
      alert("GAS URL이 설정되지 않았습니다. .env 파일을 확인해주세요!");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({
          studentId,
          studentName,
          emotion,
          diaryText
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        setFeedback(result.studentFeedback);
        setShowModal(true);
      } else {
        alert("오류가 발생했어요: " + result.message);
      }
    } catch (error) {
      alert("네트워크 오류가 발생했어요. 다시 시도해주세요!");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEmotion('');
    setDiaryText('');
  };

  return (
    <div className="glass-container">
      <h1>오늘의 마음 일기</h1>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group input-row">
          <div style={{ flex: 1 }}>
            <label>몇 번인가요?</label>
            <select 
              className="input-field"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">선택</option>
              <option value="미입력">번호 미입력</option>
              {STUDENTS.map(num => (
                <option key={num} value={num}>{num}번</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label>이름이 무엇인가요?</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="이름 입력"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>지금 기분은 어떤가요?</label>
          <div className="emotion-grid">
            {EMOTIONS.map((emo, idx) => (
              <button
                key={idx}
                type="button"
                title={emo.label}
                className={`emotion-btn ${emotion === `${emo.emoji} ${emo.label}` ? 'selected' : ''}`}
                onClick={() => setEmotion(`${emo.emoji} ${emo.label}`)}
              >
                {emo.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>오늘 무슨 일이 있었나요?</label>
          <textarea 
            className="input-field" 
            placeholder="선생님에게 하고 싶은 이야기를 자유롭게 적어보세요..."
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? <div className="spinner"></div> : '선생님께 마음 전하기'}
        </button>
      </form>

      {showModal && (
        <FeedbackModal feedback={feedback} onClose={closeModal} />
      )}
    </div>
  );
}

function FeedbackModal({ feedback, onClose }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + feedback.charAt(i));
      i++;
      if (i >= feedback.length) {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [feedback]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="teacher-icon">👩‍🏫</div>
        <h2 style={{ marginBottom: '15px', color: '#ff758c' }}>선생님의 답장</h2>
        <div className="feedback-text">
          {displayedText}
          <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
        </div>
        <button className="close-btn" onClick={onClose}>닫기</button>
      </div>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

export default App;
