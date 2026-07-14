// src/components/Flashcard.tsx
"use client";
import React, { useState } from 'react';

// Định nghĩa một Interface chung cho Component hiển thị
interface FlashcardData {
  word: string;
  meaning: string;
  subInfo?: string;      // Có thể là 'verb', 'noun', 'phr'... bên Listening
  extraList?: string[];  // Có thể là 'synonyms' bên Vocabulary
}

interface FlashcardProps {
  card: FlashcardData;
}

export default function Flashcard({ card }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="w-full h-64 perspective cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full duration-500 transform-style preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Mặt trước: Từ tiếng Anh */}
        <div className="absolute inset-0 backface-hidden bg-white border border-gray-150 rounded-2xl shadow-sm flex flex-col items-center justify-center p-6">
          <span className="text-sm font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full mb-4">
            {card.subInfo || "Vocabulary"}
          </span>
          <h2 className="text-3xl font-bold text-gray-800 text-center">{card.word}</h2>
          <p className="text-xs text-gray-400 mt-4">Click để lật xem nghĩa</p>
        </div>

        {/* Mặt sau: Nghĩa tiếng Việt */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-50 to-white border border-gray-150 rounded-2xl shadow-sm flex flex-col items-center justify-center p-6">
          <p className="text-xl font-semibold text-gray-800 text-center mb-3">{card.meaning}</p>
          
          {/* Nếu có danh sách phụ (như từ đồng nghĩa) thì hiển thị thêm */}
          {card.extraList && card.extraList.length > 0 && (
            <div className="text-center">
              <span className="text-xs text-gray-400 block mb-1">Từ đồng nghĩa:</span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {card.extraList.map((syn, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}