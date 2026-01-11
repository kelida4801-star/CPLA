import { useState, useEffect } from 'react';
import { ref, get, set, child } from "firebase/database";
import { db } from "../firebase/db.js"; // firebase.js 경로 확인

export const useStudyManager = () => {
  const USER_ID = "jeonghwan"; 
  const BASE_PATH = "studyData"; 

  const intervals = [0, 1, 3, 7, 14, 30, 45, 60];
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. 기본값 정의 ---
  const getDefaultData = () => {
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
  };

  const [appData, setAppData] = useState(getDefaultData());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [modal, setModal] = useState({ isOpen: false, title: "", content: "" });

  // --- 2. [불러오기] Realtime DB ---
  useEffect(() => {
    const fetchData = async () => {
      console.log(`🔥 [${USER_ID}] 데이터 불러오기 시도...`);
      try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `${BASE_PATH}/${USER_ID}`));

        if (snapshot.exists()) {
          console.log("✅ 데이터 로드 성공!");
          setAppData(snapshot.val());
        } else {
          console.log("ℹ️ 데이터 없음, 기본값 사용");
        }
      } catch (error) {
        console.error("❌ 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 3. [자동 저장] Realtime DB ---
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(async () => {
      try {
        const dbRef = ref(db, `${BASE_PATH}/${USER_ID}`);
        await set(dbRef, appData);
        // console.log("💾 자동 저장 완료");
      } catch (error) {
        console.warn("⚠️ 자동 저장 실패:", error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [appData, isLoading]);


  // ==========================================================
  // ⭐ [핵심 수정] 함수들을 actions 객체 밖으로 꺼내서 안전하게 선언
  // ==========================================================

  // 1. 기록 업데이트 함수 (독립 선언)
  const updateRecord = (sIdx, num, data) => {
    setAppData(prev => {
      const newBooks = { ...prev.books };
      const currentTabBooks = [...newBooks[prev.activeTab]];
      const targetSubject = { ...currentTabBooks[sIdx] };
      
      // 방어 코드: records가 없으면 생성
      const newRecords = targetSubject.records ? { ...targetSubject.records } : {};
      const rec = newRecords[num] ? { ...newRecords[num] } : { level: 0, weight: 1, topic: "", resetCount: 0 };
      
      // 데이터 병합
      newRecords[num] = { ...rec, ...data };
      
      targetSubject.records = newRecords;
      currentTabBooks[sIdx] = targetSubject;
      newBooks[prev.activeTab] = currentTabBooks;
      
      return { ...prev, books: newBooks };
    });
  };

  // 2. 레벨업 처리 함수 (독립 선언)
  const updateItemLevel = (sIdx, num, daysAgo = 0) => {
    setAppData(prev => {
      const newBooks = { ...prev.books };
      const currentTabBooks = [...newBooks[prev.activeTab]];
      const targetSubject = { ...currentTabBooks[sIdx] };
      
      const newRecords = targetSubject.records ? { ...targetSubject.records } : {};
      const rec = newRecords[num] ? { ...newRecords[num] } : { level: 0, weight: 1, topic: "", resetCount: 0 };
      
      rec.level += 1;
      
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - daysAgo);
      rec.lastDate = baseDate.toISOString().split("T")[0];

      const intervalIndex = Math.min(rec.level, intervals.length - 1);
      const gap = (intervals[intervalIndex] || 60) * (rec.weight || 1);
      
      const next = new Date(baseDate);
      next.setDate(next.getDate() + Math.ceil(gap));
      rec.nextDate = next.toISOString().split("T")[0];

      newRecords[num] = rec;
      targetSubject.records = newRecords;
      currentTabBooks[sIdx] = targetSubject;
      newBooks[prev.activeTab] = currentTabBooks;

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
        logs: [newLog, ...(prev.logs || [])].slice(0, 100)
      };
    });
  };

  // 3. 클릭 핸들러 (이제 위에서 만든 함수들을 직접 호출함)
  // 3. 클릭 핸들러 (디버깅 로그 + 강제 리셋 로직 포함)
  const handleItemClick = (e, sIdx, num) => {
    // 🛑 [중요] Shift 클릭 시 글자 선택되는 브라우저 기본 동작 막기
    if (e.shiftKey) {
       e.preventDefault();
       if (window.getSelection) {
         window.getSelection().removeAllRanges();
       }
    }

    console.log(`👆 클릭 감지: ${num}번 | Shift: ${e.shiftKey} | Alt: ${e.altKey} | Ctrl: ${e.ctrlKey}`);

    const subject = appData.books[appData.activeTab][sIdx];
    // 방어코드: records가 없으면 빈 객체 {}
    const records = subject.records || {};
    const record = records[num] || { level: 0, topic: "", resetCount: 0 };

    // 1. Ctrl + 클릭: 주제 입력
    if (e.ctrlKey) {
      const t = prompt(`[${num}번 주제 입력]`, record.topic);
      if (t !== null) updateRecord(sIdx, num, { topic: t.trim() });
      return;
    }

    // 2. Alt + Shift + 클릭: 과거 소급
    if (e.shiftKey && e.altKey) {
      const val = prompt(`[${subject.name} ${num}번 과거 기록 소급]\n몇 일 전 학습인가요? (오늘=0)`, "0");
      if (val !== null && !isNaN(val)) updateItemLevel(sIdx, num, parseInt(val));
      return;
    }

    // 3. ⭐ Shift + 클릭: 초기화 (여기를 완전히 새로 짰습니다)
    if (e.shiftKey) {
      if (confirm(`⚠️ [${num}번 문항]\n정말 초기화하시겠습니까?\n(레벨이 0이 되고, 정체 지수(↻)가 1 오릅니다)`)) {
        console.log("🔥 초기화 실행!");
        
        // updateRecord 함수에 의존하지 않고 직접 상태를 수정하여 확실하게 처리
        setAppData(prev => {
          const newBooks = { ...prev.books };
          const currentTabBooks = [...newBooks[prev.activeTab]];
          const targetSubject = { ...currentTabBooks[sIdx] };
          
          // records 생성 방어 코드
          const newRecords = targetSubject.records ? { ...targetSubject.records } : {};
          const currentRec = newRecords[num] || { level: 0, weight: 1, topic: "", resetCount: 0 };

          // 강제 리셋 값 적용
          newRecords[num] = {
            ...currentRec,
            level: 0,
            lastDate: "", // 날짜도 초기화
            nextDate: "", // 다음 날짜도 초기화
            resetCount: (currentRec.resetCount || 0) + 1, // 정체 지수 증가
            mastered: false // 마스터 상태 해제
          };

          targetSubject.records = newRecords;
          currentTabBooks[sIdx] = targetSubject;
          newBooks[prev.activeTab] = currentTabBooks;

          return { ...prev, books: newBooks };
        });
      }
      return;
    }

    // 4. Alt + 클릭: 마스터 토글
    if (e.altKey) {
      updateRecord(sIdx, num, { mastered: !record.mastered });
      return;
    }

    // 5. 일반 클릭: 레벨업
    if (confirm(`[${subject.name} ${num}번] 레벨업 하시겠습니까?`)) {
      updateItemLevel(sIdx, num, 0);
    }
  };

  // 4. 가중치 토글
  const toggleWeight = (e, sIdx, num) => {
    e.preventDefault();
    const subject = appData.books[appData.activeTab][sIdx];
    const records = subject.records || {};
    const rec = records[num] || { weight: 1 };
    
    updateRecord(sIdx, num, { weight: rec.weight === 1 ? 0.5 : 1 });
  };


  // --- 5. 최종 actions 객체 조립 ---
  const actions = {
    updateRecord,
    updateItemLevel,
    handleItemClick,
    toggleWeight,
    
    switchTab: (id) => setAppData(prev => ({ ...prev, activeTab: id })),
    
    onAddTab: () => {
      const n = prompt("새 교재 명칭:");
      if (!n) return;
      const id = "tab_" + Date.now();
      const colors = ["#0984e3", "#d63031", "#00b894", "#6c5ce7", "#fdcb6e"];
      const defaultSubjects = ["노동법 1", "노동법 2", "인사노무관리", "행정쟁송법", "노동경제학"].map((name, i) => ({
        name, color: colors[i % colors.length], max: 50, records: {}, extractEnabled: true
      }));
      setAppData(prev => ({
        ...prev,
        tabs: [...prev.tabs, { id, name: n.trim() }],
        books: { ...prev.books, [id]: defaultSubjects },
        activeTab: id
      }));
    },

    onDeleteTab: (id) => {
      const target = appData.tabs.find(t => t.id === id);
      if(appData.tabs.length <= 1) return alert("최소 1개의 교재는 있어야 합니다.");
      if (confirm(`[${target.name}] 삭제하시겠습니까?`)) {
        setAppData(prev => {
          const newTabs = prev.tabs.filter(t => t.id !== id);
          const newBooks = { ...prev.books };
          delete newBooks[id];
          return { ...prev, tabs: newTabs, books: newBooks, activeTab: newTabs[0].id };
        });
      }
    },
    
    onExtractDaily: () => {
        const currentTabId = appData.activeTab;
        const subjects = appData.books?.[currentTabId];

        // 🔍 [디버깅 로그] F12 콘솔에서 이 내용을 확인하세요
        console.log("=== 추출 진단 시작 ===");
        console.log("1. 현재 탭 ID:", currentTabId);
        console.log("2. 전체 교재 목록:", Object.keys(appData.books));
        console.log("3. 찾은 과목 데이터:", subjects);

        // 1. 데이터가 아예 없는 경우 (탭 매칭 실패)
        if (!subjects || !Array.isArray(subjects)) {
            alert(`[오류] 현재 탭(${currentTabId})에 해당하는 데이터를 찾을 수 없습니다.\n콘솔(F12)을 확인해 주세요.`);
            return;
        }

        const today = new Date().toISOString().split("T")[0];
        let results = [], logText = "";
        let extractableCount = 0; // 추출 가능한 과목 수 카운트

        subjects.forEach(s => {
          // 2. 체크박스 확인
          if (!s.extractEnabled) {
              console.log(`PASS: [${s.name}]은 체크박스가 해제되어 건너뜁니다.`);
              return;
          }
          extractableCount++;

          let due = [], news = [], learned = [];
          const records = s.records || {};
          
          for (let i = 1; i <= s.max; i++) {
            const rec = records[i] || { level: 0 };
            
            // 날짜 비교 로직 확인
            if (rec.nextDate && rec.nextDate <= today && !rec.mastered) due.push(i);
            else if (rec.level === 0) news.push(i);
            else if (!rec.mastered) learned.push(i);
          }
          
          // 각 상태별 문항 수 로그
          console.log(`[${s.name}] 복습대기: ${due.length}개, 신규: ${news.length}개, 보너스후보: ${learned.length}개`);

          let pick = due.length ? { n: due[Math.floor(Math.random()*due.length)], t: "복습" } :
                     news.length ? { n: news[Math.floor(Math.random()*news.length)], t: "신규" } :
                     learned.length ? { n: learned[Math.floor(Math.random()*learned.length)], t: "보너스" } : null;
                     
          if (pick) {
            results.push(`<span style="color:${s.color}">[${pick.t}] ${s.name}</span>: ${pick.n}번`);
            logText += `${s.name}(${pick.n}) `;
          }
        });
        
        // 3. 체크박스가 모두 꺼져있는 경우
        if (extractableCount === 0) {
            alert("모든 과목의 체크박스가 해제되어 있습니다.\n과목 이름 옆의 체크박스를 켜주세요.");
            return;
        }

        if (results.length) {
          setAppData(prev => ({ 
            ...prev, 
            history: [{ time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}), result: logText }, ...(prev.history || [])].slice(0, 10) 
          }));
          setModal({ isOpen: true, title: "🎯 오늘의 학습 미션", content: results.join("<br>") });
        } else {
            alert("추출할 문항이 없습니다.\n(모든 문항을 마스터했거나, 오늘 복습할 분량이 없습니다.)");
        }
    },

    onToggleExtract: (sIdx) => {
      setAppData(prev => {
        const newBooks = { ...prev.books };
        const currentList = [...newBooks[prev.activeTab]];
        
        // 해당 과목의 extractEnabled 값을 반전(!) 시킴
        currentList[sIdx] = { 
            ...currentList[sIdx], 
            extractEnabled: !currentList[sIdx].extractEnabled 
        };
        
        newBooks[prev.activeTab] = currentList;
        return { ...prev, books: newBooks };
      });
    },

    onExtractWeighted: () => {
      
      const subjects = appData.books[appData.activeTab];
      // 🛑 [수정됨] 방어 코드 추가: 데이터가 없거나 배열이 아니면 중단
        if (!subjects || !Array.isArray(subjects)) {
            console.error(`❌ 오류: '${appData.activeTab}' 탭에 해당하는 과목 데이터가 없습니다.`);
            alert("현재 선택된 교재의 데이터를 찾을 수 없습니다.\n탭을 다시 선택하거나 새로고침 해주세요.");
            return;
        }
         let weights = [];
         subjects.forEach(s => {
           if (!s.extractEnabled) return;
           const records = s.records || {};
           Object.keys(records).forEach(num => {
             const rec = records[num];
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

    toggleTheme: () => setAppData(prev => ({ ...prev, isDark: !prev.isDark })),
    closeModal: () => setModal(prev => ({ ...prev, isOpen: false })),

    uploadLocalData: async () => {
      const localData = localStorage.getItem("cpla_ebbinghaus_v3_react");
      if (!localData) return alert("로컬 데이터가 없습니다.");

      if (confirm("로컬 데이터를 Firebase로 업로드하시겠습니까?")) {
        try {
          const parsedData = JSON.parse(localData);
          const dbRef = ref(db, `${BASE_PATH}/${USER_ID}`);
          await set(dbRef, parsedData);
          setAppData(parsedData);
          alert("✅ 업로드 완료!");
        } catch (error) {
          console.error(error);
          alert("업로드 실패");
        }
      }
    },
    handleResetSubject : (sIdx) => {
      if (window.confirm("이 과목의 모든 데이터를 초기화하시겠습니까? (정체 지수는 상승합니다)")) {
        setAppData(prev => {
          const newAppData = { ...prev };
          // 현재 탭의 해당 과목 찾기
          const currentTabId = newAppData.activeTab;
          const subject = newAppData.books[currentTabId][sIdx];

          // records 초기화 (빈 객체로 만듦)
          subject.records = {};
      
          return newAppData;
        });
      }
    },
  };
  
  

  return { appData, calendarDate, modal, actions, isLoading };
};