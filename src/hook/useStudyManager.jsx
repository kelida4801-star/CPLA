import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { db} from "../firebase/db.js"; // ⚠️ firebase.js가 있는 경로로 맞춰주세요 (예: ./firebase 또는 ../firebase)

export const useStudyManager = () => {

  console.log("DB 상태 확인:", db);
  const USER_ID = "jeonghwan"; 
  const COLLECTION_NAME = "studyData";

  const intervals = [0, 1, 3, 7, 14, 30, 45, 60];
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  // 초기 로딩이 끝났는지 체크하는 ref
  const isMounted = useRef(false);


  // --- 1. 기본값 정의 (초기 상태) ---
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

  // State 초기화: 일단 기본값으로 시작
  const [appData, setAppData] = useState(getDefaultData());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [modal, setModal] = useState({ isOpen: false, title: "", content: "" });

  // --- 2. [불러오기] Firebase에서 데이터 Fetch (앱 시작 시 1회) ---
 // --- 2. [불러오기] 앱 시작 시 실행 ---
  useEffect(() => {
    const fetchData = async () => {
      console.log(`🔥 [${USER_ID}] 데이터 불러오기 시도...`);
      try {
        // ⭐ 경로 수정: studyData 컬렉션 -> jeonghwan 문서
        const docRef = doc(db, COLLECTION_NAME, USER_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log("✅ 데이터 로드 성공!");
          const data = docSnap.data();
          
          // 데이터가 비어있지 않은지 확인 후 적용
          if (data && data.books) {
            setAppData(data);
          }
        } else {
          console.log("ℹ️ 데이터 없음, 기본값으로 시작합니다.");
        }
      } catch (error) {
        console.error("❌ 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchData();
  }, []); // 빈 배열 유지

  // --- 3. [자동 저장] 데이터 변경 시 실행 ---
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(async () => {
      try {
        // ⭐ 경로 수정: studyData 컬렉션 -> jeonghwan 문서
        const docRef = doc(db, COLLECTION_NAME, USER_ID);
        await setDoc(docRef, appData);
        console.log("💾 자동 저장 완료");
      } catch (error) {
        console.warn("⚠️ 자동 저장 실패");
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [appData, isLoading]);


  
  // --- 4. 액션 로직 (기존과 동일, 로컬 State만 바꾸면 useEffect가 알아서 저장함) ---
  const actions = {
    updateItemLevel: (sIdx, num, daysAgo = 0) => {
      setAppData(prev => {
        const newBooks = { ...prev.books };
        const currentTabBooks = [...newBooks[prev.activeTab]];
        const targetSubject = { ...currentTabBooks[sIdx] };
        const newRecords = { ...targetSubject.records };
        
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
          logs: [newLog, ...prev.logs].slice(0, 100)
        };
      });
    },

    handleItemClick: (e, sIdx, num) => {
      const subject = appData.books[appData.activeTab][sIdx];
      const record = subject.records[num] || { level: 0, topic: "" };

      if (e.ctrlKey) {
        const t = prompt(`[${num}번 주제 입력]`, record.topic);
        if (t !== null) actions.updateRecord(sIdx, num, { topic: t.trim() });
        return;
      }

      if (e.shiftKey && e.altKey) {
        const val = prompt(`[${subject.name} ${num}번 과거 기록 소급]\n몇 일 전 학습인가요? (오늘=0)`, "0");
        if (val !== null && !isNaN(val)) actions.updateItemLevel(sIdx, num, parseInt(val));
        return;
      }

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

      if (e.altKey) {
        actions.updateRecord(sIdx, num, { mastered: !record.mastered });
        return;
      }
      if (confirm(`[${subject.name} ${num}번]\n학습을 완료하고 레벨을 올리시겠습니까?`)) {
  actions.updateItemLevel(sIdx, num, 0);
}

    },

    batchCheck: (sIdx) => {
  const s = appData.books[appData.activeTab][sIdx];
  const r = prompt(`[${s.name} 범위 체크] (예: 1-10)`);
  if (!r) return;

  let start, end;
  if (r.includes("-")) [start, end] = r.split("-").map(Number);
  else start = end = Number(r);

  if (isNaN(start) || isNaN(end) || start < 1 || end > s.max || start > end) {
    alert("유효하지 않은 범위입니다.");
    return;
  }

  if (confirm(`${start}번~${end}번 일괄 레벨업 하시겠습니까?`)) {
    for (let i = start; i <= end; i++) {
      actions.updateItemLevel(sIdx, i, 0);
    }
  }
},



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

    // 탭 추가/삭제 로직 포함
    switchTab: (id) => setAppData(prev => ({ ...prev, activeTab: id })),
    
    // (이하 필요한 나머지 액션들: addTab, deleteTab 등 기존 코드 유지...)
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

    // 추출 관련 기능
    onExtractDaily: () => {
      const subjects = appData.books[appData.activeTab];
      const today = new Date().toISOString().split("T")[0];
      let results = [], logText = "";

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

    toggleTheme: () => setAppData(prev => ({ ...prev, isDark: !prev.isDark })),
    closeModal: () => setModal(prev => ({ ...prev, isOpen: false })),
    // 👇 [추가] 로컬 스토리지 데이터를 읽어서 Firebase로 강제 업로드하는 함수
    uploadLocalData: async () => {
      const localData = localStorage.getItem("cpla_ebbinghaus_v3_react");
      
      if (!localData) {
        alert("로컬에 저장된 데이터가 없습니다!");
        return;
      }

      if (confirm("로컬 스토리지의 데이터를 Firebase로 업로드하시겠습니까?\n(기존 DB 데이터는 덮어씌워집니다)")) {
        try {
          const parsedData = JSON.parse(localData);
          
          // 1. Firebase에 업로드
         const docRef = doc(db, COLLECTION_NAME, USER_ID);
          await setDoc(docRef, parsedData);
          
          // 2. 현재 화면 상태도 업데이트
          setAppData(parsedData);
          
          alert("✅ 업로드 성공! 이제 데이터가 클라우드에 저장되었습니다.");
        } catch (error) {
          console.error("업로드 실패:", error);
          alert("업로드 중 오류가 발생했습니다.");
        }
      }
    },
  };

  return { appData, calendarDate, modal, actions, isLoading };
};