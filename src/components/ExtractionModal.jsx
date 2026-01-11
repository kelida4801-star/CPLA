// 추출된 리스트를 깔끔하게 보여주는 용도

const ExtractionModal = ({ items }) => {
  return (
    <ul className="extraction-list">
      {items.map((item, idx) => (
        <li key={idx} className="extraction-item">
          <span className="item-badge" style={{ background: item.color }}>
            {item.subject}
          </span>
          <span className="item-num">{item.num}번</span>
          <span className="item-topic">{item.topic || '주제 미지정'}</span>
        </li>
      ))}
    </ul>
  );
};
export default ExtractionModal;