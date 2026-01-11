import React from 'react';
// 화면 하단에 고정되어 주요 액션(추출, 테마변경)을 수행하는 패널입니다.
const ControlPanel = ({ onExtractDaily, onExtractWeighted, onToggleTheme }) => {
  return (
    <div className="control-panel">
      <button 
        className="btn btn-sub" 
        onClick={onToggleTheme} 
        title="테마 변경"
      >
        🌓
      </button>
      <button 
        className="btn btn-warning" 
        onClick={onExtractWeighted}
      >
        🔥 집중 학습 추출
      </button>
      <button 
        className="btn btn-primary" 
        onClick={onExtractDaily}
      >
        선택 과목 오늘의 문제 추출
      </button>
    </div>
  );
};

export default ControlPanel;