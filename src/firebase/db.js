import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// 본인의 Config를 유지하세요
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdljK3SeulhUaoj3FAQRjFprifR18xKKg",
  authDomain: "cpla-study.firebaseapp.com",
  databaseURL: "https://cpla-study-default-rtdb.firebaseio.com",
  projectId: "cpla-study",
  storageBucket: "cpla-study.firebasestorage.app",
  messagingSenderId: "946106228182",
  appId: "1:946106228182:web:32f00533b75b678e8cd877",
  measurementId: "G-FCTLYKXXEC"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, 
});

/**
 * 특정 유저의 데이터를 가져오는 함수
 */
export const fetchUserData = async (userId) => {
  try {
    const dbRef = ref(db, `studyData/${userId}`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("데이터 로드 에러:", error);
    return null;
  }
};

/**
 * 특정 유저의 데이터를 저장하는 함수
 */
export const saveUserData = async (userId, data) => {
  try {
    const dbRef = ref(db, `studyData/${userId}`);
    await set(dbRef, data);
    console.log(`${userId} 데이터 저장 성공`);
  } catch (error) {
    console.error("데이터 저장 에러:", error);
  }
};