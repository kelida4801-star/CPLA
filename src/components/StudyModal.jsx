import React from 'react';

const StudyModal = ({ bookName, subjectName, num, record, onSave }) => {
  return (
    <div className="study-modal-form">
      <div className="info-badge" style={{ marginBottom: '15px' }}>
        <strong>{bookName} - {subjectName}</strong> ({num}번 문항)
      </div>
      
      <label>현재 레벨: <b>Lv.{record.level}</b></label>
      
      <div style={{ marginTop: '15px' }}>
        <label>쟁점/주제 메모</label>
        <input 
          type="text" 
          defaultValue={record.topic} 
          placeholder="이 문항의 핵심 키워드를 입력하세요"
          id="modal-topic-input"
          className="modal-input"
        />
      </div>

      <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button className="btn btn-primary" onClick={() => onSave('up')}>
          Lv UP & 다음 복습 설정
        </button>
        <button className="btn btn-warning" onClick={() => onSave('reset')}>
          초기화 (Lv.1)
        </button>
      </div>
    </div>
  );
};

export default StudyModal;