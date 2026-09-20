// ─────────────────────────────────────────────────────────────
// js/firebaseConfig.js — ตั้งค่า Firebase ของโปรเจกต์ + export db/auth
//
// ไฟล์นี้เป็น ES module (import/export) — หน้าไหนใช้ไฟล์นี้ต้องประกาศ
// <script type="module"> และต้องเปิดผ่าน HTTP (serve.ps1) เท่านั้น
// เปิดตรง ๆ ผ่าน file:// ไม่ได้ เบราว์เซอร์จะบล็อกด้วย CORS
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// ค่านี้คือ "ตัวระบุแอปฝั่งเว็บ" (public web app identifier) ของ Firebase — ไม่ใช่คีย์ลับ
// ปลอดภัยที่จะฝังไว้ในไฟล์ที่ push ขึ้น GitHub ได้ตามเอกสารของ Firebase เอง
// ตัวกันสิทธิ์จริงคือ Firestore Security Rules ไม่ใช่ apiKey ตัวนี้
const firebaseConfig = {
  apiKey: "AIzaSyAIaWpmP2LL3m8xp2d6jQUfatLEVUEKIwk",
  authDomain: "leaveeasy-inthiporn.firebaseapp.com",
  projectId: "leaveeasy-inthiporn",
  storageBucket: "leaveeasy-inthiporn.firebasestorage.app",
  messagingSenderId: "483933167593",
  appId: "1:483933167593:web:4ae659b3c2f8d686a1b578",
  measurementId: "G-SLN0WX1LFT"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
