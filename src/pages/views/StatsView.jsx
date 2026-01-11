import React, { useState } from 'react';

const StatsView = ({ books, tabs }) => {
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.id || "");

  const currentSubjects = books[selectedTab] || [];
  const examDate2nd = new Date("2026-08-29");
  
  // 통계 데이터 계산
  let totalItems = 0, totalPoints = 0, totalResets = 0, totalWeights = 0;
  
  const subjectStats = currentSubjects.map(s => {
    let sPoints = 0, sResets = 0, sWeights = 0;
    totalItems += s.max;
    
    for (let i = 1; i <= s.max; i++) {
      const rec = s.records[i] || { level: 0, weight: 1, resetCount: 0 };
      sPoints += Math.min(rec.level, 6);
      sResets += (rec.resetCount || 0);
      if (rec.weight < 1) sWeights++;
    }
    
    totalPoints += sPoints;
    totalResets += sResets;
    totalWeights += sWeights;

    return { ...s, points: sPoints, maxPoints: s.max * 6, resets: sResets, weights: sWeights };
  });

  const target = totalItems * 6;
  const remain = target - totalPoints;
  const days = Math.max(1, Math.ceil((examDate2nd - new Date()) / (1000 * 60 * 60 * 24)));
  const speed = (remain / days).toFixed(2);

  return (
    <div id="stats-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 900 }}>📊 상세 수험 데이터 분석</h2>
        <select 
          value={selectedTab} 
          onChange={(e) => setSelectedTab(e.target.value)}
          style={{ padding: '12px 20px', borderRadius: '15px', border: '1px solid var(--border)', fontWeight: 800, background: 'var(--card)', color: 'var(--text)' }}
        >
          {tabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <h4>누적 마스터리</h4>
          <div className="stats-value">{totalPoints} / {target}</div>
        </div>
        <div className="stats-card">
          <h4>2차 권장 속도</h4>
          <div className="stats-value">일일 {speed} Lv UP</div>
        </div>
        <div className="stats-card">
          <h4>장애물 및 정체</h4>
          <div className="stats-value">🔥{totalWeights} / 🔄{totalResets}</div>
        </div>
      </div>

      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>과목명</th>
              <th>학습 히트맵</th>
              <th style={{ textAlign: 'center' }}>취약(🔥)</th>
              <th style={{ textAlign: 'center' }}>정체(🔄)</th>
            </tr>
          </thead>
          <tbody>
            {subjectStats.map((s, idx) => {
              const p = ((s.points / s.maxPoints) * 100).toFixed(1);
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 900, color: s.color }}>{s.name}</td>
                  <td>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '5px' }}>Progress: {p}%</div>
                    <div className="heatmap-bar">
                      <div className="heatmap-fill" style={{ width: `${p}%`, background: s.color }}></div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--danger)' }}>{s.weights}</td>
                  <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--info)' }}>{s.resets}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsView;