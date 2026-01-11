import React from 'react';

const ScheduleView = ({ books, tabs }) => {
  const todayStr = new Date().toISOString().split("T")[0];
  let rows = [];

  // 모든 교재(tabs)와 모든 과목(books)을 순회하며 데이터 수집
  Object.keys(books).forEach(bookId => {
    const bookName = tabs.find(t => t.id === bookId)?.name || "기타";
    books[bookId].forEach(s => {
      Object.keys(s.records).forEach(num => {
        const rec = s.records[num];
        if (rec.level > 0) {
          rows.push({
            bookName,
            subjectName: s.name,
            num,
            topic: rec.topic || "-",
            level: rec.level,
            next: rec.nextDate,
            mastered: rec.mastered
          });
        }
      });
    });
  });

  // 날짜순 정렬
  rows.sort((a, b) => a.next.localeCompare(b.next));

  return (
    <div id="schedule-view">
      <h2 style={{ color: 'var(--info)', fontWeight: 900 }}>🔄 에빙하우스 복습 리스트</h2>
      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>교재/과목</th>
              <th style={{ width: '10%' }}>번호</th>
              <th style={{ width: '30%' }}>쟁점/주제</th>
              <th style={{ width: '10%' }}>Lv</th>
              <th style={{ width: '15%' }}>예정일</th>
              <th style={{ width: '15%' }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((r, idx) => {
              const isOverdue = r.next <= todayStr && !r.mastered;
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 900 }}>
                    <small style={{ color: '#888', display: 'block' }}>{r.bookName}</small>
                    {r.subjectName}
                  </td>
                  <td style={{ textAlign: 'center' }}>{r.num}번</td>
                  <td style={{ color: '#636e72', fontWeight: 600 }}>{r.topic}</td>
                  <td style={{ textAlign: 'center', fontWeight: 900 }}>{r.level}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>{r.next}</td>
                  <td>
                    <span className="status-badge" style={{ 
                      background: r.mastered ? '#e6fff2' : (isOverdue ? '#fff0f0' : '#f0f7ff'),
                      color: r.mastered ? 'var(--accent)' : (isOverdue ? 'var(--danger)' : 'var(--primary)')
                    }}>
                      {r.mastered ? "🏆 완료" : (isOverdue ? "🔴 시급" : "🟢 대기")}
                    </span>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#888', fontWeight: 800 }}>
                  학습 데이터가 부족합니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleView;