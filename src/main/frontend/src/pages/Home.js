import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { setTokens, isAuthenticated } from '../utils/auth';
import '../App.css';
import './Auth.css';

function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const chatEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken) {
      setTokens(accessToken, refreshToken || '');
      navigate('/', { replace: true });
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(isAuthenticated());
    }
  }, [location, navigate]);

  // 새로고침해도 started 상태 유지
  useEffect(() => {
    const startedFlag = localStorage.getItem('chatStarted');
    if (startedFlag === 'true') {
      setStarted(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatStarted', started.toString());
  }, [started]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat, answer]);

  const sendQuestionToBackend = async (q) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: q }),
      });

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('❌ 서버 통신 오류:', error);
      return '서버와 연결할 수 없습니다.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    if (!started) {
      if (!isLoggedIn) return alert('로그인이 필요합니다.');
      setStarted(true);
    }

    setChat((prev) => [...prev, { type: 'question', text: question }]);
    const fullAnswer = await sendQuestionToBackend(question);

    setQuestion('');
    setAnswer('');
    setLoading(true);

    let i = 0;
    const interval = setInterval(() => {
      if (i < fullAnswer.length) {
        setAnswer((prev) => prev + fullAnswer[i]);
        i++;
      } else {
        clearInterval(interval);
        setLoading(false);
        setChat((prev) => [...prev, { type: 'answer', text: fullAnswer }]);
        setAnswer('');
      }
    }, 50);
  };

  const handleSuggestion = (text) => {
    if (!isLoggedIn) return alert('로그인이 필요합니다.');
    setQuestion(text);
    setStarted(true);
  };

  return (
    <div className="main-wrapper">
      <Sidebar open={sidebarOpen} />
      <button
        className="menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      <div className="content-container">
        <div className="content-inner">
          {!started ? (
              <div className="home-container">
                <div className="message-box" onClick={() => {
                  if (!isLoggedIn) return alert('로그인이 필요합니다.');
                  setStarted(true);
                }}>
                  <p>무엇을 알려드릴까요??</p>
                </div>
              </div>
            ) : (
              // 기존 채팅화면

            <div className="chat-container">
              {isLoggedIn && <div className="welcome-msg">😊 환영합니다!</div>}
              <div className="chat-history">
                {chat.map((item, index) => (
                  <div
                    key={index}
                    className={`chat-bubble ${item.type}`}
                  >
                    {item.text}
                  </div>
                ))}
                {answer && loading && (
                  <div className="chat-bubble answer">{answer}</div>
                )}
                {loading && !answer && (
                  <div className="loading-text">답변 생성 중...</div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSubmit} className="chat-form">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="질문을 입력하세요"
                  className="question-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button type="submit" className="question-button">
                  질문
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
