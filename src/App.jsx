import React from 'react';
import './App.css';

// 컴포넌트 임포트
import Header from './components/Header';
import Navigation from './components/Navigation';
import Modal from './components/Modal';
import StudyModal from './components/StudyModal';

// 페이지/뷰 임포트
import MainDashBoard from './pages/views/MainDashBoard';
import CalendarView from './pages/views/CalendarView';
import ScheduleView from './pages/views/ScheduleView';
import StatsView from './pages/views/StatsView';
import LogView from './pages/views/LogView';
import HelpView from './pages/views/HelpView';

// 커스텀 훅
import { useStudyManager } from './hook/useStudyManager';

// 상수 설정
const EXAM_DATE_1ST = new Date("2026-05-23");
const EXAM_DATE_2ND = new Date("2026-08-29");

function App() {
  // 1. 커스텀 훅에서 모든 데이터와 함수를 가져옴
  const { appData, modal, actions, calendarDate } = useStudyManager();
  const todayStr = new Date().toISOString().split('T')[0];

// --- [타이틀 결정 로직] ---
  // 1. 일반 교재 탭(basic, case 등)에서 이름 찾기
  const activeTabObj = appData.tabs.find(t => t.id === appData.activeTab);
  let currentTitle = activeTabObj ? activeTabObj.name : "";

  // 2. 만약 유틸리티 탭(달력, 분석 등)일 경우 수동 매핑
  if (!currentTitle) {
    const utilityNames = {
      calendar: "학습 달력",
      stats: "수험 분석",
      log: "학습 이력",
      schedule: "복습 일정",
      help: "가이드"
    };
    currentTitle = utilityNames[appData.activeTab] || "CPLA 매니저";
  }

  // 2. 현재 활성화된 탭에 따른 컨텐츠 렌더링
  const renderContent = () => {
    const { activeTab, books, logs, tabs, history } = appData;

    switch (activeTab) {
      case 'calendar':
        return <CalendarView books={books} calendarDate={calendarDate} actions={actions} />;
      case 'stats':
        return <StatsView books={books} tabs={tabs} actions={actions} />;
      case 'schedule':
        return <ScheduleView books={books} tabs={tabs} todayStr={todayStr} />;
      case 'log':
        return <LogView logs={logs} actions={actions} />;
      case 'help':
        return <HelpView actions={actions} />;
      default:
        // 기본서, 사례집 등 교재 대시보드
        return (
          <MainDashBoard 
            books={books}
            activeTab={activeTab}
            history={history}
            actions={actions}
            todayStr={todayStr}
          />
        );
    }
  };

  return (
    // appData.isDark 상태에 따라 다크모드 클래스 적용
    <div className={appData.isDark ? "dark-mode" : ""}>
      <div className="container">
        {/* 헤더: 디데이 표시 */}
        <Header currentTitle={currentTitle} />
        
        {/* 네비게이션: 탭 전환 및 추가/삭제 */}
        <Navigation 
          tabs={appData.tabs}
          activeTab={appData.activeTab}
          onSwitchTab={actions.switchTab}
          onAddTab={actions.onAddTab}
          onDeleteTab={actions.onDeleteTab}
        />
        
        {/* 메인 컨텐츠 영역 */}
        <main className="main-view">
          {renderContent()}
        </main>

        {/* 공통 알림/미션 모달 (오늘의 문제 추출 시 사용) */}
        <Modal 
          isOpen={modal.isOpen}      // 훅의 isOpen 상태 (true/false)
          onClose={actions.closeModal} // 훅의 닫기 함수
          title={modal.title}         // 훅의 title ("오늘의 학습 미션" 등)
        >
          {/* 모달 내부 내용(children): extractDaily에서 생성된 HTML 문자열을 안전하게 출력 */}
          <div 
            style={{ 
              lineHeight: '2.2', 
              fontSize: '1.15rem', 
              fontWeight: '800', 
              textAlign: 'left' 
            }}
            dangerouslySetInnerHTML={{ __html: modal.content }} 
          />
          
          {/* 하단 확인 버튼 */}
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '30px', padding: '15px' }} 
            onClick={actions.closeModal}
          >
            미션 수행 시작
          </button>
        </Modal>

        {/* 하단 고정 제어판 */}
        <div className="control-panel">
          <button className="btn btn-sub" onClick={actions.toggleTheme}>
            {appData.isDark ? "☀️ 라이트 모드" : "🌓 다크 모드"}
          </button>
          <button className="btn btn-warning" onClick={actions.onExtractWeighted}>
            🔥 집중 학습 추출
          </button>
          <button className="btn btn-primary" onClick={actions.onExtractDaily}>
            오늘의 문제 추출
          </button>
        </div>
      </div>
    </div>

    
  );
  
}


export default App;