import React from 'react';
import SubjectCard from '../../components/SubjectCard';

const MainDashBoard = ({ 
  books, 
  activeTab, 
  todayStr, 
  history, 
  // 아래 함수들은 상위(App.js 등)에서 정의하여 내려준다고 가정합니다.
  actions 
}) => {
  
  return (
    <div id="main-view">
      <div className="guide-dashboard">
        <div className="guide-grid">
          <div className="guide-item"><span className="guide-key">클릭</span><span className="guide-desc">학습완료</span></div>
          <div className="guide-item"><span className="guide-key">Ctrl</span><span className="guide-desc">주제입력</span></div>
          <div className="guide-item"><span className="guide-key">우클릭</span><span className="guide-desc">가중치🔥</span></div>
          <div className="guide-item"><span className="guide-key">Alt</span><span className="guide-desc">마스터🏆</span></div>
          <div className="guide-item"><span className="guide-key">Shift</span><span className="guide-desc">데이터리셋</span></div>
          <div class="guide-item"><span class="guide-key">A+S+클릭</span><span class="guide-desc">과거입력</span></div>
        </div>
        <button className="btn-mini" style={{ padding: '8px 18px', borderRadius: '12px' }} onClick={actions.addNewSubject}>
          + 과목 추가
        </button>
      </div>

      <div id="subject-grid" className="grid-container">
        {books[activeTab]?.map((book, idx) => (
          <SubjectCard
            key={`${activeTab}-${idx}`}
            book={book} 
            sIdx={idx} 
            todayStr={todayStr}
            onItemClick={actions.handleItemClick}
            onWeightToggle={actions.toggleWeight}
            onUpdateMax={actions.updateMax}
            onToggleExtract={actions.toggleSubjectExtract}
            onRename={actions.renameSubject}
            onBatchCheck={actions.batchCheck}
            onReset={actions.resetSubject}
            onDelete={actions.deleteSubject}
          />
        ))}
      </div>

      <div className="history-section">
        <h3 style={{ margin: 0, fontWeight: 900 }}>🕒 최근 추출 이력(랜덤미션)</h3>
        <div className="history-list">
          {history && history.length > 0 ? (
            history.map((item, i) => (
              <div key={i} className="history-item">
                <span className="history-time">{item.time}</span>
                <span className="history-result">{item.result}</span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>이력이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainDashBoard;