import { useState, useEffect } from 'react';

export const useStudyManager = () => {
  // 1. 초기 상태 설정 (localStorage 연동)
  const [appData, setAppData] = useState(() => {
    const saved = localStorage.getItem("cpla_ebbinghaus_v3_react");
    if (saved) return JSON.parse(saved);
    
    // 기본 과목 데이터
    const colors = ["#0984e3", "#d63031", "#00b894", "#6c5ce7", "#fdcb6e", "#fab1a0", "#00cec9", "#636e72"];
    const defaultSubjects = ["노동법 1", "노동법 2", "인사노무관리", "행정쟁송법", "노동경제학"].map((name, i) => ({
      name, color: colors[i % colors.length], max: 50, records: {}, extractEnabled: true
    }));

    return {
      activeTab: "basic",
      tabs: [{ id: "basic", name: "기본서" }, { id: "case", name: "사례집" }],
      books: { "basic": defaultSubjects, "case": [...defaultSubjects] },
      history: [],
      logs: [],
      isDark: false
    };
  });

  // 달력 전용 상태
  const [calendarDate, setCalendarDate] = useState(new Date());
  // 모달 전용 상태
  const [modal, setModal] = useState({ isOpen: false, title: "", content: "" });

  // 2. 자동 저장 (데이터가 변할 때마다)
  useEffect(() => {
    localStorage.setItem("cpla_ebbinghaus_v3_react", JSON.stringify(appData));
  }, [appData]);

  // --- 비즈니스 로직 함수들 (index.html 기능 전체) ---
  const actions = {
    // [탭 관리]
    switchTab: (id) => setAppData(prev => ({ ...prev, activeTab: id })),
    addTab: () => {
      const n = prompt("새 교재 명칭:");
      if (!n) return;
      const id = "tab_" + Date.now();
      const defaultSubjects = ["노동법 1", "노동법 2", "인사노무관리", "행정쟁송법", "노동경제학"].map((name, i) => ({
        name, color: "#0984e3", max: 50, records: {}, extractEnabled: true
      }));
      setAppData(prev => ({
        ...prev,
        tabs: [...prev.tabs, { id, name: n.trim() }],
        books: { ...prev.books, [id]: defaultSubjects },
        activeTab: id
      }));
    },
    deleteTab: (id) => {
      const target = appData.tabs.find(t => t.id === id);
      if (confirm(`[${target.name}] 교재와 모든 데이터를 영구 삭제하시겠습니까?`)) {
        setAppData(prev => {
          const newTabs = prev.tabs.filter(t => t.id !== id);
          const newBooks = { ...prev.books };
          delete newBooks[id];
          return { ...prev, tabs: newTabs, books: newBooks, activeTab: newTabs[0].id };
        });
      }
    },

    // [과목 관리]
    addNewSubject: () => {
      const n = prompt("새 과목 이름:");
      if (!n) return;
      setAppData(prev => {
        const newBooks = { ...prev.books };
        newBooks[prev.activeTab].push({ 
          name: n.trim(), 
          color: "#0984e3", 
          max: 50, 
          records: {}, 
          extractEnabled: true 
        });
        return { ...prev, books: newBooks };
      });
    },
    renameSubject: (sIdx) => {
      const currentName = appData.books[appData.activeTab][sIdx].name;
      const n = prompt("과목명을 입력하세요:", currentName);
      if (n) actions.updateSubject(sIdx, { name: n.trim() });
    },
    deleteSubject: (sIdx) => {
      if (confirm("과목을 영구 삭제하시겠습니까?")) {
        setAppData(prev => {
          const newBooks = { ...prev.books };
          newBooks[prev.activeTab].splice(sIdx, 1);
          return { ...prev, books: newBooks };
        });
      }
    },
    updateMax: (sIdx, val) => {
      actions.updateSubject(sIdx, { max: parseInt(val) || 50 });
    },
    resetSubject: (sIdx) => {
      if (confirm("이 과목의 모든 학습 기록을 초기화하시겠습니까?")) {
        actions.updateSubject(sIdx, { records: {} });
      }
    },
    toggleSubjectExtract: (sIdx) => {
      const current = appData.books[appData.activeTab][sIdx].extractEnabled;
      actions.updateSubject(sIdx, { extractEnabled: !current });
    },
    updateSubject: (sIdx, data) => {
      setAppData(prev => {
        const newBooks = { ...prev.books };
        newBooks[prev.activeTab][sIdx] = { ...newBooks[prev.activeTab][sIdx], ...data };
        return { ...prev, books: newBooks };
      });
    },

    // [문항 조작 및 학습 로직]
  processLevelUp: (sIdx, num) => {
      // 복습 주기 설정: Lv.1(1일), Lv.2(3일), Lv.3(7일), Lv.4(14일), Lv.5(30일), Lv.6(45일), Lv.7+(60일)
      const intervals = [0, 1, 3, 7, 14, 30, 45, 60];
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();

      setAppData(prev => {
        // 1. 상태 업데이트를 위한 깊은 복사 (해당 교재의 과목 리스트)
        const newBooks = { ...prev.books };
        const currentTabBooks = [...newBooks[prev.activeTab]];
        const subject = { 
      ...currentTabBooks[sIdx],
      records: { ...currentTabBooks[sIdx].records } 
    };
        const tabObj = prev.tabs.find(t => t.id === prev.activeTab);

        // 2. 기록이 없는 문항 초기화 확인
        if (!subject.records[num]) {
          subject.records[num] = { level: 0, weight: 1, topic: "", resetCount: 0 };
        }
        // 3. 레벨업 및 날짜 계산 로직 (HTML 버전 참조)
        const rec = { ...subject.records[num] };
        rec.level += 1;
        rec.lastDate = today;

        // 가중치(weight) 반영한 Gap 계산 (기본 1, 취약 0.5)
        const intervalIndex = Math.min(rec.level, intervals.length - 1);
        const gap = (intervals[intervalIndex] || 60) * (rec.weight || 1);
        
        // 다음 복습 예정일 계산
        const next = new Date();
        next.setDate(next.getDate() + Math.ceil(gap));
        rec.nextDate = next.toISOString().split("T")[0];

        // 4. 변경된 기록 적용
        subject.records[num] = rec;
        currentTabBooks[sIdx] = subject;
        newBooks[prev.activeTab] = currentTabBooks;

        // 5. 학습 로그 생성 (최신순 100개 유지)
        const newLog = {
          date: today,
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          book: tabObj ? tabObj.name : "알 수 없는 교재",
          subject: subject.name,
          num: num,
          level: rec.level
        };

        return {
          ...prev,
          books: newBooks,
          logs: [newLog, ...(prev.logs || [])].slice(0, 100)
        };
      });
    },
  
    handleItemClick: (e, sIdx, num) => {
      const rec = appData.books[appData.activeTab][sIdx].records[num] || {};
      if (e.ctrlKey) {
        const t = prompt(`[${num}번 주제 입력]`, rec.topic || "");
        if (t !== null) actions.updateRecord(sIdx, num, { topic: t.trim() });
      } else if (e.shiftKey) {
        if (confirm(`[${num}번] 데이터를 리셋할까요?`)) {
          actions.updateRecord(sIdx, num, { level: 0, nextDate: "", resetCount: (rec.resetCount || 0) + 1 });
        }
      } else if (e.altKey) {
        actions.updateRecord(sIdx, num, { mastered: !rec.mastered });
      } else {
        if (confirm(`${num}번 학습을 완료했습니까?`)) actions.processLevelUp(sIdx, num);
      }
    },
    toggleWeight: (e, sIdx, num) => {
      e.preventDefault();
      const rec = appData.books[appData.activeTab][sIdx].records[num] || { weight: 1 };
      actions.updateRecord(sIdx, num, { weight: rec.weight === 1 ? 0.5 : 1 });
    },
    batchCheck: (sIdx) => {
      const subject = appData.books[appData.activeTab][sIdx];
      const r = prompt(`[${subject.name} 범위 체크] (예: 1-10)`);
      if (!r) return;
      let [start, end] = r.includes("-") ? r.split("-").map(Number) : [Number(r), Number(r)];
      if (isNaN(start) || start < 1 || end > subject.max) return alert("유효한 범위가 아닙니다.");
      if (confirm(`${start}~${end}번 일괄 레벨업 하시겠습니까?`)) {
        for (let i = start; i <= end; i++) actions.processLevelUp(sIdx, i);
      }
    },
    updateRecord: (sIdx, num, data) => {
      setAppData(prev => {
        const newBooks = { ...prev.books };
        const rec = newBooks[prev.activeTab][sIdx].records[num] || { level: 0, weight: 1, topic: "", resetCount: 0 };
        newBooks[prev.activeTab][sIdx].records[num] = { ...rec, ...data };
        return { ...prev, books: newBooks };
      });
    },

    // [추출 기능]
    onExtractDaily: () => {
      const subjects = appData.books[appData.activeTab];
      const today = new Date().toISOString().split("T")[0];
      let results = [];
      let logText = "";

      subjects.forEach(s => {
        if (!s.extractEnabled) return;
        let due = [], news = [], learned = [];
        for (let i = 1; i <= s.max; i++) {
          const rec = s.records[i] || { level: 0 };
          if (rec.nextDate && rec.nextDate <= today && !rec.mastered) due.push(i);
          else if (rec.level === 0) news.push(i);
          else if (!rec.mastered) learned.push(i);
        }
        let pick = due.length ? { n: due[Math.floor(Math.random()*due.length)], t: "복습" } :
                   news.length ? { n: news[Math.floor(Math.random()*news.length)], t: "신규" } :
                   learned.length ? { n: learned[Math.floor(Math.random()*learned.length)], t: "보너스" } : null;
        if (pick) {
          results.push(`<span style="color:${s.color}">[${pick.t}] ${s.name}</span>: ${pick.n}번`);
          logText += `${s.name}(${pick.n}) `;
        }
      });
      if (results.length) {
        setAppData(prev => ({ 
          ...prev, 
          history: [{ time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}), result: logText }, ...prev.history].slice(0, 10) 
        }));
        setModal({ isOpen: true, title: "🎯 오늘의 학습 미션", content: results.join("<br>") });
      } else alert("추출할 문항이 없습니다.");
    },
    onExtractWeighted: () => {
      const subjects = appData.books[appData.activeTab];
      let weights = [];
      subjects.forEach(s => {
        if (!s.extractEnabled) return;
        Object.keys(s.records).forEach(num => {
          const rec = s.records[num];
          if (rec.weight < 1 && !rec.mastered) weights.push({ sName: s.name, color: s.color, num });
        });
      });
      if (!weights.length) return alert("가중치(🔥) 문항이 없습니다.");
      const picks = weights.sort(() => 0.5 - Math.random()).slice(0, 5);
      setModal({ 
        isOpen: true, 
        title: "🔥 집중 학습 미션", 
        content: picks.map(p => `<span style="color:${p.color}">[집중] ${p.sName}</span>: ${p.num}번`).join("<br>") 
      });
    },

    // [로그 및 히스토리 관리]
    deleteHistory: (idx) => {
      if (confirm("이력을 삭제하시겠습니까?")) {
        setAppData(prev => {
          const newHistory = [...prev.history];
          newHistory.splice(idx, 1);
          return { ...prev, history: newHistory };
        });
      }
    },
    onClearLogs: () => {
      if (confirm("모든 학습 로그를 삭제하시겠습니까?")) setAppData(prev => ({ ...prev, logs: [] }));
    },
    onDeleteLog: (idx) => {
      if (confirm("로그를 삭제하시겠습니까?")) {
        setAppData(prev => {
          const newLogs = [...prev.logs];
          newLogs.splice(idx, 1);
          return { ...prev, logs: newLogs };
        });
      }
    },

    // [달력 조작]
    changeMonth: (val) => {
      const newDate = new Date(calendarDate);
      if (val === 0) setCalendarDate(new Date());
      else {
        newDate.setMonth(newDate.getMonth() + val);
        setCalendarDate(newDate);
      }
    },

    // [데이터 백업/복원 및 설정]
    exportData: () => {
      const code = btoa(encodeURIComponent(JSON.stringify(appData)));
      navigator.clipboard.writeText(code);
      alert("백업 코드가 복사되었습니다!");
    },
    importData: () => {
      const d = prompt("백업 코드 입력:");
      if (d) {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(d)));
          setAppData(decoded);
          alert("복원 성공!");
        } catch(e) { alert("코드 오류"); }
      }
    },
    toggleTheme: () => setAppData(prev => ({ ...prev, isDark: !prev.isDark })),
    closeModal: () => setModal(prev => ({ ...prev, isOpen: false })),

    // useStudyManager.js 의 actions 객체 내부

  // 1. 새 교재(탭) 추가 함수
  onAddTab: () => {
    const name = prompt("새 교재 명칭을 입력하세요 (예: 사례집, 기출문제):");
    if (!name || name.trim() === "") return;

    const newId = `tab_${Date.now()}`; // 고유 ID 생성
    
    // 새 탭에 들어갈 기본 과목 세팅
    const colors = ["#0984e3", "#d63031", "#00b894", "#6c5ce7", "#fdcb6e"];
    const defaultSubjects = ["노동법 1", "노동법 2", "인사노무관리", "행정쟁송법", "노동경제학"].map((sName, i) => ({
      name: sName,
      color: colors[i % colors.length],
      max: 50,
      records: {},
      extractEnabled: true
    }));

    setAppData(prev => ({
      ...prev,
      tabs: [...prev.tabs, { id: newId, name: name.trim() }], // 탭 리스트 추가
      books: { ...prev.books, [newId]: defaultSubjects },    // 해당 탭의 과목 데이터 생성
      activeTab: newId // 추가 후 해당 탭으로 바로 이동
    }));
  },

    // 2. 교재(탭) 삭제 함수
    onDeleteTab: (id) => {
      // 방어 코드: 탭이 하나만 남았을 때는 삭제 불가
      if (appData.tabs.length <= 1) {
        alert("최소 하나의 교재 탭은 유지되어야 합니다.");
        return;
      }

      const targetTab = appData.tabs.find(t => t.id === id);
      if (confirm(`[${targetTab.name}] 교재와 해당되는 모든 학습 데이터가 영구 삭제됩니다. 계속하시겠습니까?`)) {
        setAppData(prev => {
          // 삭제할 탭 제외
          const remainingTabs = prev.tabs.filter(t => t.id !== id);
      
          // 관련 장부 데이터 삭제
          const newBooks = { ...prev.books };
          delete newBooks[id];

          // 현재 활성화된 탭을 삭제할 경우, 리스트의 첫 번째 탭으로 이동
          let nextActiveTab = prev.activeTab;
          if (prev.activeTab === id) {
            nextActiveTab = remainingTabs[0].id;
          }

          return {
            ...prev,
            tabs: remainingTabs,
            books: newBooks,
            activeTab: nextActiveTab
          };
        });
      }
    },
   
        
  };
  
  
  return { appData, calendarDate, modal, actions };
};