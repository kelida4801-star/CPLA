import React from 'react';

const Navigation = ({ 
  tabs,           // [{id: 'basic', name: '기본서'}, ...]
  activeTab,      // 현재 선택된 탭 ID
  onSwitchTab,    // 탭 클릭 시 실행할 함수
  onAddTab,       // 새 교재 추가 함수
  onDeleteTab     // 탭 삭제 함수
}) => {
  
  // 오른쪽 유틸리티 메뉴 설정
  const utilityTabs = [
    { id: 'calendar', name: '📅 달력' },
    { id: 'stats', name: '📊 분석' },
    { id: 'log', name: '📜 이력' },
    { id: 'schedule', name: '🔄 복습' },
    { id: 'help', name: '📖 도움말' },
  ];

  return (
    <div className="nav-wrapper">
      {/* 왼쪽: 사용자가 추가한 교재 탭 리스트 */}
      <nav className="tabs-left">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onSwitchTab(tab.id)}
          >
            {tab.name}
            {/* 삭제 버튼: 기본 탭이 아닐 경우만 노출하거나 전체 노출 선택 가능 */}
            <span 
              className="btn-close" 
              onClick={(e) => {
                e.stopPropagation(); // 탭 전환 방지
                onDeleteTab(tab.id);
              }}
            >
              ✕
            </span>
          </button>
        ))}
        {/* 새 교재 추가 버튼 */}
        <button 
          className="tab-btn" 
          style={{ color: 'var(--accent)' }} 
          onClick={onAddTab}
        >
          + 교재 추가
        </button>
      </nav>

      {/* 오른쪽: 시스템 유틸리티 메뉴 */}
      <div className="tabs-right">
        {utilityTabs.map((uTab) => (
          <button
            key={uTab.id}
            className={`tab-btn utility ${activeTab === uTab.id ? 'active' : ''}`}
            onClick={() => onSwitchTab(uTab.id)}
          >
            {uTab.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;