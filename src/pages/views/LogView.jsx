import React from 'react';

const LogView = ({ logs, actions}) => {
  return (
    <div id="log-view" style={{ width :"1200px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--info)', margin: 0, fontWeight: 900 }}>📜 상세 학습 완료 기록</h2>
        <button className="btn-mini danger" style={{ padding: '10px 20px' }} onClick={actions.onClearLogs}>
          로그 전체 삭제
        </button>
      </div>

      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>완료 일시</th>
              <th style={{ width: '20%' }}>교재</th>
              <th style={{ width: '20%' }}>과목</th>
              <th style={{ width: '10%' }}>번호</th>
              <th style={{ width: '20%' }}>학습결과</th>
              <th style={{ width: '10%' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {logs && logs.length > 0 ? logs.map((l, idx) => (
              <tr key={idx}>
                <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>{l.date} {l.time}</td>
                <td>{l.book}</td>
                <td style={{ fontWeight: 900 }}>{l.subject}</td>
                <td style={{ textAlign: 'center' }}>{l.num}번</td>
                <td>
                  <span className="status-badge" style={{ background: '#e6fff2', color: 'var(--accent)' }}>
                    Lv.{l.level} UP
                  </span>
                </td>
                <td>
                  <button className="btn-mini danger" onClick={()=>actions.onDeleteLog(idx)}>삭제</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#888', fontWeight: 800 }}>
                  학습 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogView;