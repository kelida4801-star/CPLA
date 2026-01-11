import React from 'react';

const Header = () => {
  const examDate1st = new Date("2026-05-23");
  const examDate2nd = new Date("2026-08-29");
  const today = new Date();

  const getDDay = (target) => {
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return `D-${diff}`;
  };

  return (
    <div className="header">
      <h1 id="main-title">🚀 CPLA 합격 매니저</h1>
      <div className="dday-container">
        <div className="d-day first">1차 합격 {getDDay(examDate1st)}</div>
        <div className="d-day second">2차 합격 {getDDay(examDate2nd)}</div>
      </div>
    </div>
  );
};

export default Header;