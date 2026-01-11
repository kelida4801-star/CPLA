import { useState, useEffect } from 'react';

export const useStudyManager = () => {
  const intervals = [0, 1, 3, 7, 14, 30, 45, 60];

  const [appData, setAppData] = useState(() => {
    const saved = localStorage.getItem("cpla_ebbinghaus_v3_react");
    if (saved) return JSON.parse(saved);
    
    const colors = ["#0984e3", "#d63031", "#00b894", "#6c5ce7", "#fdcb6e", "#fab1a0", "#00cec9", "#636e72"];
    const defaultSubjects = ["노동법 1", "노동법 2", "인사노무관리", "행정쟁송법", "노동경제학"].map((name, i) => ({
      name, color: colors[i % colors.length], max: 50, records: {}, extractEnabled: true
    }));

    return {
      activeTab: "basic",
      tabs: [{ id: "basic", name: "기본서" }, { id: "case", name: "사례집" }],
      books: { "basic": defaultSubjects, "case": JSON.parse(JSON.stringify(defaultSubjects)) },
      history: [],
      logs: [],
      isDark: false
    };
  });

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [modal, setModal] = useState({ isOpen: false, title: "", content: "" });

  useEffect(() => {
    localStorage.setItem("cpla_ebbinghaus_v3_react", JSON.stringify(appData));
  }, [appData]);

  const actions = {
    // [공통 업데이트 헬퍼] - 불변성을 지키며 특정 문항 레벨업
    updateItemLevel: (sIdx, num, daysAgo = 0) => {
      setAppData(prev => {
        const newBooks = { ...prev.books };
        const currentTabBooks = [...newBooks[prev.activeTab]];
        const targetSubject = { ...currentTabBooks[sIdx] };
        const newRecords = { ...targetSubject.records };
        
        // 문항 기록 초기화 및 레벨업
        const rec = newRecords[num] ? { ...newRecords[num] } : { level: 0, weight: 1, topic: "", resetCount: 0 };
        rec.level += 1;
        
        // 날짜 계산 (소급 적용 반영)
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - daysAgo);
        rec.lastDate = baseDate.toISOString().split("T")[0];

        const intervalIndex = Math.min(rec.level, intervals.length - 1);
        const gap = (intervals[intervalIndex] || 60) * (rec.weight || 1);
        
        const next = new Date(baseDate);
        next.setDate(next.getDate() + Math.ceil(gap));
        rec.nextDate = next.toISOString().split("T")[0];

        // 상태 조립
        newRecords[num] = rec;
        targetSubject.records = newRecords;
        currentTabBooks[sIdx] = targetSubject;
        newBooks[prev.activeTab] = currentTabBooks;

        // 로그 추가
        const tabObj = prev.tabs.find(t => t.id === prev.activeTab);
        const newLog = {
          date: rec.lastDate,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          book: tabObj?.name || "교재",
          subject: targetSubject.name,
          num: num,
          level: rec.level
        };

        return {
          ...prev,
          books: newBooks,
          logs: [newLog, ...prev.logs].slice(0, 100)
        };
      });
    },

    // [이벤트 핸들러] - HTML의 클릭 로직을 React actions로 변환
    handleItemClick: (e, sIdx, num) => {
      const subject = appData.books[appData.activeTab][sIdx];
      const record = subject.records[num] || { level: 0, topic: "" };

      // 1. Ctrl + 클릭: 주제 입력
      if (e.ctrlKey) {
        const t = prompt(`[${num}번 주제 입력]`, record.topic);
        if (t !== null) actions.updateRecord(sIdx, num, { topic: t.trim() });
        return;
      }

      // 2. Alt + Shift + 클릭: 과거 소급 입력
      if (e.shiftKey && e.altKey) {
        const val = prompt(`[${subject.name} ${num}번 과거 기록 소급]\n몇 일 전 학습인가요? (오늘=0)`, "0");
        if (val !== null && !isNaN(val)) actions.updateItemLevel(sIdx, num, parseInt(val));
        return;
      }

      // 3. Shift + 클릭: 리셋
      if (e.shiftKey) {
        if (confirm(`[${num}번] 초기화하시겠습니까?`)) {
          actions.updateRecord(sIdx, num, { 
            level: 0, 
            nextDate: "", 
            resetCount: (record.resetCount || 0) + 1 
          });
        }
        return;
      }

      // 4. Alt + 클릭: 마스터
      if (e.altKey) {
        actions.updateRecord(sIdx, num, { mastered: !record.mastered });
        return;
      }

      // 5. 일반 클릭: 레벨업
      if (confirm(`[${subject.name} ${num}번] 레벨업 하시겠습니까?`)) {
        actions.updateItemLevel(sIdx, num, 0);
      }
    },

    // [기타 기능들]
    updateRecord: (sIdx, num, data) => {
      setAppData(prev => {
        const newBooks = { ...prev.books };
        const currentTabBooks = [...newBooks[prev.activeTab]];
        const targetSubject = { ...currentTabBooks[sIdx] };
        const newRecords = { ...targetSubject.records };
        
        const rec = newRecords[num] ? { ...newRecords[num] } : { level: 0, weight: 1, topic: "", resetCount: 0 };
        newRecords[num] = { ...rec, ...data };
        
        targetSubject.records = newRecords;
        currentTabBooks[sIdx] = targetSubject;
        newBooks[prev.activeTab] = currentTabBooks;
        
        return { ...prev, books: newBooks };
      });
    },

    toggleWeight: (e, sIdx, num) => {
      e.preventDefault();
      const rec = appData.books[appData.activeTab][sIdx].records[num] || { weight: 1 };
      actions.updateRecord(sIdx, num, { weight: rec.weight === 1 ? 0.5 : 1 });
    },

    // ... (기타 탭 추가, 삭제, 테마 변경 등의 기존 코드는 동일하게 유지)
    switchTab: (id) => setAppData(prev => ({ ...prev, activeTab: id })),
    toggleTheme: () => setAppData(prev => ({ ...prev, isDark: !prev.isDark })),
    closeModal: () => setModal(prev => ({ ...prev, isOpen: false })),
    // (이하 생략 - 기존에 작성해주신 탭/과목 관리 로직 포함 가능)
  };

  return { appData, calendarDate, modal, actions };
};