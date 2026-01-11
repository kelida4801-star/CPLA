import React from 'react';

const SubjectCard = ({ 
  book, 
  sIdx, 
  todayStr, 
  onItemClick, 
  onWeightToggle, 
  onUpdateMax, 
  onToggleExtract,
  onRename,
  onBatchCheck,
  onReset,
  onDelete
}) => {
  if (!book) return null;

  // HTML 버전과 동일하게 50개 기준 또는 가변 기준으로 설정 가능
  const items = Array.from({ length: Math.max(book.max, 50) }, (_, i) => i + 1);
  const records = book.records || {};

  const dueCount = Object.values(records).filter(
    rec => rec && rec.nextDate && rec.nextDate <= todayStr && !rec.mastered
  ).length;

  return (
    <div className="card">
      <div className="subject-top">
        <div className="subject-info">
          <div className="subject-title-area">
            <input 
              type="checkbox" 
              className="subject-checkbox" 
              checked={book.extractEnabled} 
              onChange={() => onToggleExtract(sIdx)}
            />
            <h3 style={{ color: book.color }} onClick={() => onRename(sIdx)} title="이름 수정">
              {book.name}
            </h3>
          </div>
          <div className="subject-meta">
            <span>복습: <b style={{ color: 'var(--danger)' }}>{dueCount}</b></span>
            <span>문항: 
              <input 
                type="number" 
                className="input-max" 
                value={book.max} 
                onChange={(e) => onUpdateMax(sIdx, e.target.value)}
              />
            </span>
          </div>
        </div>
        <div className="subject-actions">
          <button className="btn-mini" onClick={() => onBatchCheck(sIdx)}>범위</button>
          <button className="btn-mini danger" onClick={() => onReset(sIdx)}>초기화</button>
          <span className="btn-close" onClick={() => onDelete(sIdx)}>✕</span>
        </div>
      </div>

      <div className="num-grid">
        {items.map((num) => {
          const rec = records[num] || { level: 0, weight: 1, topic: "", mastered: false };
          const isDue = rec.nextDate && rec.nextDate <= todayStr;
          // const fillHeight = (Math.min(rec.level, 6) / 6) * 100;
          const isOutOfRange = num > book.max;

          return (
            <div 
              key={num}
              className={`num-item 
                ${rec.level >= 6 ? 'max-lv' : ''} 
                ${isDue && !rec.mastered ? 'due' : ''} 
                ${rec.mastered ? 'mastered' : ''}
                ${rec.weight < 1 ? 'has-weight' : ''}
                ${rec.topic ? 'has-topic' : ''}
                ${isOutOfRange ? 'out-of-range' : ''}
              `}
              style={{ 
                '--item-color': book.color,
                display: isOutOfRange ? 'none' : 'flex' // 범위 밖은 숨김 처리
              }}
              onClick={(e) => {
    e.preventDefault();
    e.stopPropagation(); // ⭐ 클릭 이벤트가 중복으로 전파되는 것을 차단
    onItemClick(e, sIdx, num);
  }}
              onContextMenu={(e) => onWeightToggle(e, sIdx, num)}
              title={rec.topic || `${num}번 문항`}
            >
              <div className="progress-fill" style={{ height: `calc((${Math.min(rec.level, 6)} / 6) * 100%)` }}></div>
              <span className="num-text">{num}</span>
              <span className="weight-tag">🔥</span>
              <div className="topic-dot"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectCard;