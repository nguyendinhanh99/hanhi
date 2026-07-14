'use client';

import React, { useState, useEffect } from 'react';
import wordsDataRaw from '@/src/data/words_data.json'; 
import { WordItem } from '@/src/data/words';
import confetti from 'canvas-confetti';

interface DayLearning {
  dayNumber: number;
  title: string;
  words: WordItem[];
  colorClass: string;
  icon: string;
}

interface FlashcardItem {
  originalWord: WordItem;
  displayWord: string; 
  meaning: string;
}

// Cấu trúc một câu hỏi trắc nghiệm
interface QuizQuestion {
  questionWord: string;       // Từ tiếng Anh đưa ra hỏi (từ gốc hoặc từ đồng nghĩa)
  correctMeaning: string;     // Nghĩa đúng (Đáp án chính xác)
  options: string[];          // Danh sách 4 đáp án A, B, C, D
  originalWord: WordItem;     // Từ gốc liên quan
}

// Cấu trúc lưu trữ lịch sử trả lời của mỗi câu hỏi trắc nghiệm
interface QuizHistoryItem {
  questionWord: string;
  correctMeaning: string;
  selectedMeaning: string;
  isCorrect: boolean;
  originalWord: WordItem;
}

export default function HomePage() {
  const words = wordsDataRaw as WordItem[];
  const WORDS_PER_DAY = 20;
  const totalDays = Math.ceil(words.length / WORDS_PER_DAY);

  // Thêm State quản lý Tab đang hoạt động
  const [activeTab, setActiveTab] = useState<'vocab' | 'listening'>('vocab');

  // Điểm số kỷ lục đã lưu của từng ngày (Học từ vựng)
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // States chung phục vụ học tập từ vựng
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false); 
  
  // States Flashcard
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'en-vi' | 'vi-en'>('en-vi'); 
  
  // States Trắc nghiệm
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // Đáp án người dùng chọn
  const [isAnswered, setIsAnswered] = useState(false); 
  
  // State lưu lịch sử làm bài trắc nghiệm của lượt học hiện tại
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);

  // Điểm số tạm thời chạy theo thời gian thực trong lượt chơi hiện tại
  const [knownCount, setKnownCount] = useState(0);
  const [liveScore, setLiveScore] = useState(0);

  // State hiển thị màn hình kết quả sau khi hoàn thành
  const [sessionResult, setSessionResult] = useState<{
    show: boolean;
    score: number;
    correct: number;
    total: number;
    type: 'flashcard' | 'quiz';
  } | null>(null);

  // Đọc điểm số đã lưu khi load trang
  useEffect(() => {
    const savedScores = localStorage.getItem('toeic_learning_scores');
    if (savedScores) {
      try {
        setScores(JSON.parse(savedScores));
      } catch (e) {
        console.error("Lỗi đọc điểm số:", e);
      }
    }
  }, []);

  // Hàm xáo trộn mảng
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Khởi động chế độ Flashcard
  const startFlashcardSession = (dayNum: number, mode: 'en-vi' | 'vi-en') => {
    const startIndex = (dayNum - 1) * WORDS_PER_DAY;
    const dayWords = words.slice(startIndex, startIndex + WORDS_PER_DAY);

    const generatedCards: FlashcardItem[] = dayWords.map((item) => {
      const allPossibleWords = [item.word, ...item.synonyms].filter(Boolean);
      const randomDisplayWord = allPossibleWords[Math.floor(Math.random() * allPossibleWords.length)];

      return {
        originalWord: item,
        displayWord: randomDisplayWord,
        meaning: item.meaning,
      };
    });

    setFlashcards(shuffleArray(generatedCards));
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyMode(mode);
    setKnownCount(0);
    setLiveScore(0);
    setSessionResult(null);
    setIsQuizMode(false);
    setIsFlashcardMode(true);
  };

  // Khởi động chế độ Trắc nghiệm A B C D (lần đầu học cả ngày)
  const startQuizSession = (dayNum: number) => {
    const startIndex = (dayNum - 1) * WORDS_PER_DAY;
    const dayWords = words.slice(startIndex, startIndex + WORDS_PER_DAY);
    const allMeaningsInDay = dayWords.map(w => w.meaning);

    const generatedQuestions: QuizQuestion[] = dayWords.map((item) => {
      const allPossibleWords = [item.word, ...item.synonyms].filter(Boolean);
      const questionWord = allPossibleWords[Math.floor(Math.random() * allPossibleWords.length)];
      
      const incorrectMeanings = allMeaningsInDay.filter(m => m !== item.meaning);
      const shuffledIncorrect = shuffleArray(incorrectMeanings).slice(0, 3);
      const options = shuffleArray([item.meaning, ...shuffledIncorrect]);

      return {
        questionWord,
        correctMeaning: item.meaning,
        options,
        originalWord: item
      };
    });

    setQuizQuestions(shuffleArray(generatedQuestions));
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setKnownCount(0);
    setLiveScore(0);
    setSessionResult(null);
    setQuizHistory([]);
    setIsFlashcardMode(false);
    setIsQuizMode(true);
  };

  // Chức năng: LUYỆN LẠI CÁC TỪ ĐÃ LÀM SAI (Quiz)
  const startWrongWordsQuizSession = () => {
    const wrongAnswers = quizHistory.filter(h => !h.isCorrect);
    if (wrongAnswers.length === 0) return;

    const dayNum = selectedDay || 1;
    const startIndex = (dayNum - 1) * WORDS_PER_DAY;
    const dayWords = words.slice(startIndex, startIndex + WORDS_PER_DAY);
    const allMeaningsInDay = dayWords.map(w => w.meaning);

    const generatedQuestions: QuizQuestion[] = wrongAnswers.map((item) => {
      const incorrectMeanings = allMeaningsInDay.filter(m => m !== item.correctMeaning);
      const shuffledIncorrect = shuffleArray(incorrectMeanings).slice(0, 3);
      const options = shuffleArray([item.correctMeaning, ...shuffledIncorrect]);

      return {
        questionWord: item.questionWord,
        correctMeaning: item.correctMeaning,
        options,
        originalWord: item.originalWord
      };
    });

    setQuizQuestions(shuffleArray(generatedQuestions));
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setKnownCount(0);
    setLiveScore(0);
    setSessionResult(null);
    setQuizHistory([]); // Reset lịch sử
    setIsFlashcardMode(false);
    setIsQuizMode(true);
  };

  // Kích hoạt hiệu ứng pháo hoa hoành tráng
  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Xử lý chọn đáp án Trắc nghiệm
  const handleSelectAnswer = (option: string) => {
    if (isAnswered) return; 
    setSelectedAnswer(option);
    setIsAnswered(true);

    const currentQuestion = quizQuestions[currentQuizIndex];
    const isCorrect = option === currentQuestion.correctMeaning;
    const newKnownCount = isCorrect ? knownCount + 1 : knownCount;

    // Thêm vào lịch sử làm bài
    const historyItem: QuizHistoryItem = {
      questionWord: currentQuestion.questionWord,
      correctMeaning: currentQuestion.correctMeaning,
      selectedMeaning: option,
      isCorrect,
      originalWord: currentQuestion.originalWord
    };
    setQuizHistory(prev => [...prev, historyItem]);

    if (isCorrect) {
      setKnownCount(newKnownCount);
      const currentLive = Math.round((newKnownCount / quizQuestions.length) * 100);
      setLiveScore(currentLive);
    }
  };

  // Chuyển sang câu hỏi trắc nghiệm tiếp theo
  const handleNextQuiz = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setIsAnswered(false);
      setSelectedAnswer(null);
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      // ĐÃ HOÀN THÀNH HẾT CÂU HỎI TRẮC NGHIỆM
      const finalScore = Math.round((knownCount / quizQuestions.length) * 100);
      
      if (selectedDay !== null && quizQuestions.length === WORDS_PER_DAY) {
        const currentRecord = scores[selectedDay] || 0;
        if (finalScore > currentRecord) {
          const updatedScores = { ...scores, [selectedDay]: finalScore };
          setScores(updatedScores);
          localStorage.setItem('toeic_learning_scores', JSON.stringify(updatedScores));
        }
      }

      if (finalScore > 90) {
        triggerConfetti();
      }

      setSessionResult({
        show: true,
        score: finalScore,
        correct: knownCount,
        total: quizQuestions.length,
        type: 'quiz'
      });
      setIsQuizMode(false);
    }
  };

  // Xử lý khi bấm "Đã thuộc" hoặc "Chưa thuộc" ở chế độ Flashcard
  const handleNextCard = (wasKnown: boolean) => {
    const newKnownCount = wasKnown ? knownCount + 1 : knownCount;
    
    if (wasKnown) {
      setKnownCount(newKnownCount);
      const currentLive = Math.round((newKnownCount / flashcards.length) * 100);
      setLiveScore(currentLive);
    }

    if (currentCardIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 150);
    } else {
      const finalScore = Math.round((newKnownCount / flashcards.length) * 100);
      
      if (selectedDay !== null) {
        const currentRecord = scores[selectedDay] || 0;
        if (finalScore > currentRecord) {
          const updatedScores = { ...scores, [selectedDay]: finalScore };
          setScores(updatedScores);
          localStorage.setItem('toeic_learning_scores', JSON.stringify(updatedScores));
        }
      }

      if (finalScore > 90) {
        triggerConfetti();
      }

      setSessionResult({
        show: true,
        score: finalScore,
        correct: newKnownCount,
        total: flashcards.length,
        type: 'flashcard'
      });
      setIsFlashcardMode(false);
    }
  };

  // Reset điểm số của Ngày học cụ thể
  const resetScore = (dayNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedScores = { ...scores, [dayNum]: 0 };
    setScores(updatedScores);
    localStorage.setItem('toeic_learning_scores', JSON.stringify(updatedScores));
  };

  const days: DayLearning[] = Array.from({ length: totalDays }, (_, index) => {
    const dayNum = index + 1;
    const startIndex = index * WORDS_PER_DAY;
    const dayWords = words.slice(startIndex, startIndex + WORDS_PER_DAY);
    
    const stylePresets = [
      { color: 'from-emerald-400/10 to-teal-400/10 border-teal-500/20 text-teal-800', icon: '📝' },
      { color: 'from-blue-400/10 to-indigo-400/10 border-indigo-500/20 text-indigo-800', icon: '📊' },
      { color: 'from-purple-400/10 to-pink-400/10 border-purple-500/20 text-purple-800', icon: '⚡' },
      { color: 'from-cyan-400/10 to-sky-400/10 border-sky-500/20 text-sky-800', icon: '🎯' },
      { color: 'from-amber-400/10 to-orange-400/10 border-amber-500/20 text-amber-800', icon: '💡' },
      { color: 'from-rose-400/10 to-red-400/10 border-rose-500/20 text-rose-800', icon: '🔥' },
    ];
    
    const preset = stylePresets[index % stylePresets.length];

    return {
      dayNumber: dayNum,
      title: `Ngày ${dayNum}`,
      words: dayWords,
      colorClass: preset.color,
      icon: preset.icon,
    };
  });

  // Tính tổng điểm tích lũy thực tế
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  // Lọc số câu sai
  const wrongCount = quizHistory.filter(h => !h.isCorrect).length;

  return (
    <div className={`min-h-screen w-full p-4 sm:p-12 font-sans flex items-center justify-center transition-colors duration-500 ${
      activeTab === 'listening' 
        ? 'bg-gradient-to-tr from-[#ebe3fc] via-[#f3e7ff] to-[#d4e4ff]' 
        : 'bg-gradient-to-tr from-[#e0c3fc] via-[#fbc2eb] to-[#a1c4fd]'
    }`}>
      <div className="w-full max-w-4xl bg-white/45 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-2xl p-6 sm:p-10 relative">
        
        {/* Header bar */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 border-b border-white/20 pb-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              {activeTab === 'listening' ? 'TOEIC Listening Practice' : 'TOEIC Vocabulary'}
            </span>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
              {activeTab === 'listening' ? 'Luyện nghe phản xạ' : 'Lộ trình 235 từ đồng nghĩa'}
            </h1>
          </div>

          {/* Thanh chuyển đổi Tab */}
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white/30 shadow-sm">
            <button
              onClick={() => {
                setActiveTab('vocab');
                setSelectedDay(null); 
                setSessionResult(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'vocab'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/30'
              }`}
            >
              📚 Từ Đồng Nghĩa
            </button>
          </div>

          {/* Chỉ hiện điểm tích lũy của Từ vựng khi đang ở tab vocab */}
          {activeTab === 'vocab' && (
            <div className="flex gap-3">
              <span className="px-5 py-2 bg-white/70 backdrop-blur-md rounded-full text-sm font-extrabold text-indigo-600 shadow-sm border border-white/40">
                Tổng điểm tích lũy: {totalScore} pts
              </span>
            </div>
          )}
        </header>

        {/* ==================== PHÂN KHU 1: GIAO DIỆN TỪ VỰNG ==================== */}
        {activeTab === 'vocab' && (
          <>
            {/* MÀN HÌNH BÁO CÁO KẾT QUẢ CUỐI BÀI */}
            {sessionResult && sessionResult.show && (
              <div className="max-w-2xl mx-auto py-4 animate-fade-in">
                <div className="text-center mb-8">
                  {sessionResult.score < 70 ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 shadow-xl max-w-md mx-auto">
                      <div className="text-6xl mb-4">❤️</div>
                      <h2 className="text-3xl font-black text-rose-600 mb-2 animate-bounce">Cố lên vợ yêu!</h2>
                      <p className="text-slate-600 font-semibold mb-6">Bạn đã đúng {sessionResult.correct}/{sessionResult.total} từ ({sessionResult.score}%)</p>
                      <div className="w-full bg-rose-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${sessionResult.score}%` }}></div>
                      </div>
                    </div>
                  ) : sessionResult.score >= 70 && sessionResult.score <= 90 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 shadow-xl max-w-md mx-auto">
                      <div className="text-6xl mb-4">🥰</div>
                      <h2 className="text-3xl font-black text-amber-600 mb-2">Vợ yêu giỏi quá chời!</h2>
                      <p className="text-slate-600 font-semibold mb-6">Bạn đã đúng {sessionResult.correct}/{sessionResult.total} từ ({sessionResult.score}%)</p>
                      <div className="w-full bg-amber-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${sessionResult.score}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 shadow-xl max-w-md mx-auto">
                      <div className="text-6xl mb-4">😘🎉</div>
                      <h2 className="text-3xl font-black text-emerald-600 mb-2 leading-snug">Vợ yêu đã hoàn thành xuất sắc moa moa!</h2>
                      <p className="text-slate-600 font-semibold mb-6">Bạn đã đúng {sessionResult.correct}/{sessionResult.total} từ ({sessionResult.score}%)</p>
                      <div className="w-full bg-emerald-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${sessionResult.score}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CHI TIẾT ĐÚNG/SAI */}
                {sessionResult.type === 'quiz' && quizHistory.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-md border border-white/60 mb-8">
                    <h3 className="text-lg font-black text-slate-800 mb-4 pb-2 border-b border-slate-200 flex justify-between items-center">
                      <span>📊 Chi tiết bài thi vừa qua</span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                        Sai: {wrongCount} | Đúng: {sessionResult.correct}
                      </span>
                    </h3>
                    
                    <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                      {quizHistory.map((item, index) => (
                        <div 
                          key={index} 
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-sm ${
                            item.isCorrect 
                              ? 'bg-emerald-50/70 border-emerald-200' 
                              : 'bg-rose-50/70 border-rose-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                item.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {item.isCorrect ? '✓' : '✗'}
                              </span>
                              <span className="font-bold text-slate-800 text-base">{item.questionWord}</span>
                              <span className="text-xs text-slate-400 font-medium">({item.originalWord.word})</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-600 pl-7">
                              Nghĩa đúng: <span className="text-emerald-700 font-bold">{item.correctMeaning}</span>
                              {!item.isCorrect && (
                                <>
                                  {" — "} Đã chọn: <span className="text-rose-600 font-bold line-through">{item.selectedMeaning}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 pl-7 sm:pl-0">
                            {item.originalWord.synonyms.slice(0, 3).map((syn, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {sessionResult.type === 'quiz' && wrongCount > 0 && (
                    <button
                      onClick={startWrongWordsQuizSession}
                      className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      🔁 Luyện lại {wrongCount} từ sai
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSessionResult(null);
                      setIsFlashcardMode(false);
                      setIsQuizMode(false);
                    }}
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                  >
                    Quay lại danh sách từ
                  </button>
                </div>
              </div>
            )}

            {/* 1. MÀN HÌNH CHỌN NGÀY HỌC */}
            {!selectedDay && !sessionResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {days.map((day) => {
                  const score = scores[day.dayNumber] || 0;
                  return (
                    <div
                      key={day.dayNumber}
                      onClick={() => setSelectedDay(day.dayNumber)}
                      className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-br ${day.colorClass} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white/50 backdrop-blur-md`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-2">
                          <div className="w-10 h-10 bg-white/80 rounded-xl shadow-sm flex items-center justify-center text-xl">
                            {day.icon}
                          </div>
                          <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center text-xs text-slate-500 border border-white/30">
                            {day.words.length} từ
                          </div>
                        </div>
                        {score > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm animate-pulse"></span>}
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 mb-2">{day.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-8">
                        Từ {day.words[0]?.word} đến {day.words[day.words.length - 1]?.word}.
                      </p>

                      <div className="flex justify-between items-center mt-auto">
                        {score > 0 && (
                          <button 
                            onClick={(e) => resetScore(day.dayNumber, e)}
                            className="text-[10px] uppercase tracking-wider font-bold text-rose-500 hover:underline bg-white/30 px-2 py-1 rounded"
                          >
                            Làm lại
                          </button>
                        )}
                        <span className="ml-auto text-xs font-extrabold tracking-wider bg-slate-800/80 text-white px-3 py-1.5 rounded-full">
                          Kỷ lục: {score}/100
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. GIAO DIỆN HỌC FLASHCARD */}
            {selectedDay && isFlashcardMode && !sessionResult && flashcards.length > 0 && (
              <div className="max-w-2xl mx-auto py-4 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => setIsFlashcardMode(false)}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
                  >
                    ← Thoát Flashcard
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      Live Score: {liveScore}/100
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-white/50 px-3 py-1 rounded-full">
                      Thẻ {currentCardIndex + 1} / {flashcards.length}
                    </span>
                  </div>
                </div>

                {/* Khung xoay 3D Flashcard */}
                <div 
                  className="w-full h-80 cursor-pointer [perspective:1000px] mb-8"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                    
                    {/* MẶT TRƯỚC THẺ */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-white/90 border border-white shadow-xl backdrop-blur-md flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-4">
                        {studyMode === 'en-vi' ? 'Tiếng Anh (Bấm để lật nghĩa)' : 'Tiếng Việt (Bấm để lật tiếng Anh)'}
                      </span>
                      <h2 className="text-4xl font-extrabold text-slate-800 text-center tracking-tight leading-snug">
                        {studyMode === 'en-vi' ? flashcards[currentCardIndex].displayWord : flashcards[currentCardIndex].meaning}
                      </h2>
                    </div>

                    {/* MẶT SAU THẺ */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] text-white">
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Đáp án</span>
                      
                      {studyMode === 'en-vi' ? (
                        <>
                          <h3 className="text-3xl font-black text-white mb-2 text-center">{flashcards[currentCardIndex].meaning}</h3>
                          <p className="text-xs bg-white/20 px-2 py-0.5 rounded uppercase font-bold mb-4 tracking-wider">
                            {flashcards[currentCardIndex].originalWord.partOfSpeech}
                          </p>
                        </>
                      ) : (
                        <h3 className="text-3xl font-black text-white mb-6 text-center">{flashcards[currentCardIndex].displayWord}</h3>
                      )}

                      <div className="w-full border-t border-white/10 pt-4 text-center">
                        <span className="text-xs text-slate-400 font-semibold block mb-2">Nhóm từ đồng nghĩa liên quan:</span>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <span className="text-xs bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                            {flashcards[currentCardIndex].originalWord.word}
                          </span>
                          {flashcards[currentCardIndex].originalWord.synonyms.map((syn, i) => (
                            <span key={i} className="text-xs bg-white/10 text-white/80 px-3 py-1 rounded-full">
                              {syn}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {isFlipped && (
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => handleNextCard(false)}
                      className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                    >
                      🔴 Chưa thuộc
                    </button>
                    <button 
                      onClick={() => handleNextCard(true)}
                      className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                    >
                      🟢 Đã thuộc (+5đ)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. GIAO DIỆN THI TRẮC NGHIỆM */}
            {selectedDay && isQuizMode && !sessionResult && quizQuestions.length > 0 && (
              <div className="max-w-2xl mx-auto py-4 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => setIsQuizMode(false)}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
                  >
                    ← Thoát Trắc Nghiệm
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                      Live Score: {liveScore}/100
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-white/50 px-3 py-1 rounded-full">
                      Câu {currentQuizIndex + 1} / {quizQuestions.length}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-white/85 border border-white shadow-xl rounded-2xl p-8 mb-6 text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2 block">Từ này có nghĩa là gì?</span>
                  <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight leading-snug my-4">
                    {quizQuestions[currentQuizIndex].questionWord}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3.5 mb-6">
                  {quizQuestions[currentQuizIndex].options.map((option, index) => {
                    const isCorrectOption = option === quizQuestions[currentQuizIndex].correctMeaning;
                    const isSelectedOption = option === selectedAnswer;
                    
                    let btnStyle = "bg-white/80 hover:bg-white text-slate-700 border-white/60 hover:shadow-md";
                    if (isAnswered) {
                      if (isCorrectOption) {
                        btnStyle = "bg-emerald-500 text-white border-emerald-400 shadow-md font-bold"; 
                      } else if (isSelectedOption) {
                        btnStyle = "bg-rose-500 text-white border-rose-400 shadow-md font-bold"; 
                      } else {
                        btnStyle = "bg-white/30 text-slate-400 border-white/20 scale-98 cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={index}
                        disabled={isAnswered}
                        onClick={() => handleSelectAnswer(option)}
                        className={`w-full p-4 rounded-xl border text-left text-base font-semibold transition-all flex items-center gap-3 ${btnStyle}`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                          isAnswered && isCorrectOption ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <button
                    onClick={handleNextQuiz}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                  >
                    {currentQuizIndex === quizQuestions.length - 1 ? 'Xem Kết Quả 🎉' : 'Câu Tiếp Theo →'}
                  </button>
                )}
              </div>
            )}

            {/* 4. MÀN HÌNH DANH SÁCH CHI TIẾT CÁC TỪ */}
            {selectedDay && !isFlashcardMode && !isQuizMode && !sessionResult && (
              <div className="animate-fade-in">
                <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="px-4 py-2 bg-white/60 hover:bg-white/80 backdrop-blur-md rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-all border border-white/40"
                  >
                    ← Quay lại danh sách
                  </button>

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => startFlashcardSession(selectedDay, 'en-vi')}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md transition-all"
                    >
                      🃏 Học Anh → Việt
                    </button>
                    <button 
                      onClick={() => startFlashcardSession(selectedDay, 'vi-en')}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-xs font-black shadow-md transition-all"
                    >
                      🃏 Học Việt → Anh
                    </button>
                    <button 
                      onClick={() => startQuizSession(selectedDay)}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md transition-all"
                    >
                      📝 Thi Trắc Nghiệm
                    </button>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 p-6 shadow-lg">
                  <h2 className="text-2xl font-black text-slate-800 mb-6 border-b border-slate-200 pb-3">
                    Danh sách từ vựng - Ngày {selectedDay}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {days[selectedDay - 1].words.map((w) => (
                      <div key={w.id} className="bg-white/80 p-4 rounded-xl border border-white/50 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 text-lg">{w.word}</span>
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium uppercase">{w.partOfSpeech}</span>
                        </div>
                        <p className="text-sm text-indigo-600 font-semibold mt-1">Nghĩa: {w.meaning}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs font-semibold text-slate-400 block mb-1">Từ đồng nghĩa:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {w.synonyms.map((syn, i) => (
                              <span key={i} className="text-xs bg-indigo-50/70 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}


      </div>
    </div>
  );
}