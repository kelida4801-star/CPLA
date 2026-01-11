import React, { useMemo, useState } from 'react';

const CalendarView = ({ appData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); 
  const [memo, setMemo] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = new Date().toISOString().split("T")[0];

  const changeMonth = (val) => {
    const nextMonth = new Date(year, month + val, 1);
    setCurrentDate(nextMonth);
  };

  // 학습 데이터 맵핑
  const scheduleMap = useMemo(() => {
    if (!appData || !appData.books) return {};

    const map = {};
    const tabs = appData.tabs || [];
    
    tabs.forEach(tab => {
      const subjects = appData.books[tab.id];
      if (Array.isArray(subjects)) {
        subjects.forEach(subject => {
          const records = subject.records || {};
          Object.keys(records).forEach(num => {
            const rec = records[num];
            if (rec && rec.nextDate && !rec.mastered) {
              if (!map[rec.nextDate]) map[rec.nextDate] = [];
              map[rec.nextDate].push({
                name: subject.name,
                num: num,
                color: subject.color || '#0984e3',
                bookName: tab.name,
                level: rec.level
              });
            }
          });
        });
      }
    });

    return map;
  }, [appData]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevDaysInMonth - i, other: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    days.push({
      day: i,
      dateStr,
      items: scheduleMap[dateStr],   // ✅ 여기!
      isToday: dateStr === todayStr
    });
  }

  const handleDayClick = (d) => {
    if (d.other) return;
    setSelectedDay(d);
    setMemo(""); 
  };

  return (
    <div className="calendar-container">
      <div className="calendar-main" style={{ flex: 1 }}>
        <div className="calendar-header">
          <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 900 }}>
            {year}년 {month + 1}월
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-mini" onClick={() => changeMonth(-1)}>◀</button>
            <button className="btn-mini" onClick={() => setCurrentDate(new Date())}>오늘</button>
            <button className="btn-mini" onClick={() => changeMonth(1)}>▶</button>
          </div>
        </div>

        <div className="calendar-grid">
          {days.map((d, idx) => (
            <div 
              key={idx} 
              className={`calendar-day 
                ${d.other ? 'other-month' : ''} 
                ${d.isToday ? 'today' : ''} 
                ${selectedDay?.dateStr === d.dateStr ? 'selected-day' : ''}`}
              onClick={() => handleDayClick(d)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="calendar-date">{d.day}</span>
                {d.isToday && <span className="today-badge"></span>}
              </div>
              
              <div className="calendar-items-wrapper">
                {d.items && d.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="calendar-item" style={{ background: item.color }}>
                    {item.name} {item.num}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`calendar-sidebar ${selectedDay ? 'open' : ''}`}>
        {selectedDay && (
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h3>📅 학습 상세</h3>
              <button className="btn-close" onClick={() => setSelectedDay(null)}>✕</button>
            </div>
            <p className="sidebar-date">{selectedDay.dateStr}</p>
            <textarea 
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력하세요..."
            />
            <button className="btn btn-primary" onClick={() => setSelectedDay(null)}>저장</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
