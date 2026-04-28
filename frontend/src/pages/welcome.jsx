import React, { useState } from 'react';
import UserHeader from '../components/user/UserHeader';
import EjaanView from '../components/user/EjaanView';
import PlagiarismeView from '../components/user/PlagiarismeView';

export default function UserApp() {
  const [activeTab, setActiveTab] = useState('ejaan'); // 'ejaan' | 'plagiarisme'

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <UserHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'ejaan' ? <EjaanView /> : <PlagiarismeView />}
      </main>

      {/* Basic Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}