'use client';

import React, { useState } from 'react';
import listeningDataRaw from '@/src/data/listening_data.json';
import { ListeningData } from '@/src/data/words';

const listeningData = listeningDataRaw as ListeningData;

// Màu nền cho các thẻ bài tập
const cardColors = [
    'bg-blue-50', 'bg-purple-50', 'bg-orange-50', 
    'bg-blue-50', 'bg-orange-50', 'bg-red-50', 
    'bg-blue-50', 'bg-purple-50', 'bg-orange-50'
];

export default function App() {
    const [totalPoints] = useState<number>(400);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 to-blue-200 p-4 md:p-10 font-sans">
            {/* CONTAINER TRẮNG DUY NHẤT */}
            <div className="max-w-5xl mx-auto bg-white rounded-[40px] shadow-xl p-8 md:p-12">
                
                {/* 1. HEADER (Tiêu đề trái, Tab & Tổng điểm phải) */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
                    <div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">TOEIC VOCABULARY</p>
                        <h1 className="text-3xl font-black text-slate-800">Lộ trình 235 từ đồng nghĩa</h1>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        {/* Tab Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button className="px-5 py-2 rounded-xl font-bold bg-slate-800 text-white text-sm">Từ Đồng Nghĩa</button>
                            <button className="px-5 py-2 rounded-xl font-bold text-slate-400 text-sm">Luyện Listening</button>
                        </div>
                        {/* Badge Tổng điểm */}
                        <div className="bg-slate-50 border border-slate-100 px-6 py-2 rounded-full font-bold text-indigo-600 text-sm">
                            Tổng điểm tích lũy: {totalPoints} pts
                        </div>
                    </div>
                </div>

                {/* 2. LƯỚI CARD BÀI TẬP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {listeningData.tests.map((test, idx) => (
                        <div key={idx} className={`${cardColors[idx % cardColors.length]} p-6 rounded-[24px] border border-slate-100 relative group`}>
                            {/* Icon & Label */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-xl">📚</div>
                                <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
                            </div>
                            
                            {/* Heading */}
                            <h3 className="font-black text-slate-800 text-xl mb-1">{test.test_name}</h3>
                            <p className="text-slate-500 text-sm mb-6">Từ {test.vocabulary[0].word} đến {test.vocabulary[test.vocabulary.length - 1].word}.</p>
                            
                            {/* Footer Buttons */}
                            <div className="flex gap-2 items-center">
                                <button className="bg-white px-4 py-1.5 rounded-lg text-xs font-bold text-pink-500 shadow-sm">LÀM LẠI</button>
                                <button className="bg-slate-800 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex-1">Kỷ lục: 0/100</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}