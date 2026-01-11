import React from 'react';

const HelpView = ({ exportData, importData }) => {
  return (
    <div id="help-view" className="help-box">
      <div className="help-section">
        <h4>🧠 에빙하우스 복습 매커니즘</h4>
        <p>본 매니저는 지능형 알고리즘을 통해 망각을 차단합니다.</p>
        <ul>
          <li>
            <strong>레벨 시스템</strong>: 학습 시마다 배경색 게이지가 <code>1/6</code>씩 채워지며 장기 기억으로 전이됩니다.
          </li>
          <li>
            <strong>복습 주기 예약</strong>: 레벨에 따라 [1일, 3일, 7일, 14일, 30일, 45일, 60일] 간격으로 다음 학습일이 자동 지정됩니다.
          </li>
          <li>
            <strong>우선순위 추출</strong>: 추출 버튼 클릭 시, 예정일이 도래한 문항을 1순위, 미학습 문항을 2순위로 선별합니다.
          </li>
        </ul>
      </div>

      <div className="help-section">
        <h4>🎯 기능 활용 가이드</h4>
        <ul>
          <li><strong>가중치(🔥)</strong>: 유독 안 외워지는 문항은 우클릭하세요. 복습 주기가 0.5배로 단축됩니다.</li>
          <li><strong>마스터(🏆)</strong>: 완벽히 암기된 문항은 Alt+클릭하세요. 추출 대상에서 제외됩니다.</li>
        </ul>
      </div>

      <div className="help-section">
        <h4>💾 데이터 백업 및 복원</h4>
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <button className="btn btn-sub" style={{ flex: 1, backgroundColor: 'white' }} onClick={exportData}>
            📤 백업 코드 복사
          </button>
          <button className="btn btn-sub" style={{ flex: 1, backgroundColor: 'white' }} onClick={importData}>
            📥 백업 데이터 복원
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpView;