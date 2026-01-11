import React from 'react';

const Modal = ({ 
  isOpen,       // 모달 오픈 여부 (boolean)
  onClose,      // 닫기 함수
  title,        // 모달 제목
  children,     // 모달 내부에 들어갈 내용 (추출 리스트 or 수정 폼 등)
  footer        // (선택) 하단 버튼 영역
}) => {
  if (!isOpen) return null;

  // 배경 클릭 시 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;