// ─────────────────────────────────────────────────────────────
// js/auth.js — โมดูลกลางเรื่องล็อกอิน (Firebase Authentication)
//
// วิธีใช้:
//   1) ใส่ <script type="module" src="js/auth.js"></script> ต่อจาก script
//      ของ js/nav.js ในทุกหน้าที่มี <div id="nav"></div> — จะทำให้ #navUser
//      เติมชื่อ/ปุ่มออกจากระบบ (หรือลิงก์เข้าสู่ระบบ) ให้อัตโนมัติตลอดเวลา
//      พร้อมซ่อนเมนู "ประเภทการลา" ถ้าไม่ใช่ role "hr"
//   2) หน้าที่ "บังคับ" ต้องล็อกอิน: import { ต้องล็อกอิน } from "./auth.js"
//      แล้วเรียก await ต้องล็อกอิน() — ถ้ายังไม่ล็อกอินจะเด้งไป login.html ให้เอง
//   3) หน้าที่ "ไม่บังคับ" ล็อกอิน: import { เช็คผู้ใช้ปัจจุบัน } from "./auth.js"
//      แล้วเรียก await เช็คผู้ใช้ปัจจุบัน() — ไม่ล็อกอินจะได้ null กลับมาแทน (ไม่เด้งหน้า)
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebaseConfig.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// อ่านบทบาท (role) ของผู้ใช้จากโฟลเดอร์ users/{uid} — คืน "" ถ้าไม่พบ/อ่านไม่สำเร็จ
async function อ่านบทบาท(uid) {
  try {
    var สแนปช็อต = await getDoc(doc(db, "users", uid));
    return สแนปช็อต.exists() ? (สแนปช็อต.data().role || "") : "";
  } catch (err) {
    console.error("อ่านบทบาทผู้ใช้ไม่สำเร็จ:", err);
    return "";
  }
}

// วาด #navUser ใหม่ทุกครั้งที่สถานะล็อกอินเปลี่ยน + ซ่อนเมนู "ประเภทการลา" ถ้าไม่ใช่ hr
// ใช้ createElement/textContent แทน innerHTML เพื่อไม่ต้องพึ่ง esc() จาก util.js
// (บางหน้า เช่น index.html ยังไม่ได้โหลด js/util.js)
function วาดNavUser(ผู้ใช้, บทบาท) {
  var ช่อง = document.getElementById("navUser");
  if (!ช่อง) return; // หน้านี้ไม่มีแถบเมนู (เช่น login.html)
  ช่อง.innerHTML = "";

  if (ผู้ใช้) {
    var ป้ายชื่อ = document.createElement("span");
    ป้ายชื่อ.textContent = "👤 " + (ผู้ใช้.displayName || ผู้ใช้.email);

    var ปุ่มออกจากระบบ = document.createElement("button");
    ปุ่มออกจากระบบ.type = "button";
    ปุ่มออกจากระบบ.className = "btn btn-ghost";
    ปุ่มออกจากระบบ.textContent = "ออกจากระบบ";
    ปุ่มออกจากระบบ.addEventListener("click", function () { signOut(auth); });

    ช่อง.appendChild(ป้ายชื่อ);
    ช่อง.appendChild(ปุ่มออกจากระบบ);
  } else {
    var ลิงก์เข้าสู่ระบบ = document.createElement("a");
    ลิงก์เข้าสู่ระบบ.className = "btn btn-ghost";
    ลิงก์เข้าสู่ระบบ.href = "login.html";
    ลิงก์เข้าสู่ระบบ.textContent = "เข้าสู่ระบบ";
    ช่อง.appendChild(ลิงก์เข้าสู่ระบบ);
  }

  // querySelectorAll แทน querySelector ตัวเดียว — บางหน้า (เช่น index.html) มีลิงก์ไปหน้านี้
  // ซ้ำทั้งในแถบเมนูและในการ์ดเนื้อหา ถ้าใช้ querySelector จะซ่อนได้แค่อันแรกที่เจอ
  // ทั้งสองหน้านี้เป็นงานของฝ่ายบุคคลเท่านั้น (จัดการประเภทการลา + แดชบอร์ดสรุปทั้งระบบ)
  document.querySelectorAll('a[href="leave-types.html"], a[href="dashboard.html"]').forEach(function (ลิงก์) {
    ลิงก์.style.display = (ผู้ใช้ && บทบาท === "hr") ? "" : "none";
  });
}

// วิ่งตลอดอายุของหน้า — ล็อกอิน/ออกจากระบบเมื่อไร วาด #navUser ใหม่ทันที
onAuthStateChanged(auth, async function (ผู้ใช้) {
  var บทบาท = ผู้ใช้ ? await อ่านบทบาท(ผู้ใช้.uid) : "";
  วาดNavUser(ผู้ใช้, บทบาท);
});

// รอสถานะล็อกอิน "รอบแรก" ให้นิ่งก่อน (Firebase เช็ก session ที่เก็บไว้ในเบราว์เซอร์แบบ async)
function รอสถานะเริ่มต้น() {
  return new Promise(function (resolve) {
    var ยกเลิกการฟัง = onAuthStateChanged(auth, function (ผู้ใช้) {
      ยกเลิกการฟัง();
      resolve(ผู้ใช้);
    });
  });
}

function สร้างข้อมูลผู้ใช้(ผู้ใช้, บทบาท) {
  return { uid: ผู้ใช้.uid, email: ผู้ใช้.email, displayName: ผู้ใช้.displayName, role: บทบาท };
}

// หน้าที่ "บังคับ" ต้องล็อกอินก่อนถึงจะใช้งานได้
// คืน Promise resolve เป็น {uid,email,displayName,role} ถ้าล็อกอินอยู่
// ถ้ายังไม่ล็อกอิน จะสั่ง location.href = "login.html" ให้เอง
// และคอยฟังต่อไปตลอดอายุของหน้า — ถ้าออกจากระบบระหว่างที่ยังเปิดหน้านี้ค้างไว้
// (เช่น กดออกจากระบบจากแท็บอื่น) จะเด้งไป login.html ทันที ไม่ปล่อยให้ข้อมูลเก่าค้างจอ
export async function ต้องล็อกอิน() {
  var ผู้ใช้ = await รอสถานะเริ่มต้น();
  if (!ผู้ใช้) {
    location.href = "login.html";
    return new Promise(function () {}); // ค้าง Promise ไว้เฉย ๆ ระหว่างที่หน้ากำลังเปลี่ยนเส้นทาง
  }
  var บทบาท = await อ่านบทบาท(ผู้ใช้.uid);

  onAuthStateChanged(auth, function (ผู้ใช้ตอนนี้) {
    if (!ผู้ใช้ตอนนี้) location.href = "login.html";
  });

  return สร้างข้อมูลผู้ใช้(ผู้ใช้, บทบาท);
}

// หน้าที่ "ไม่บังคับ" ล็อกอิน — เหมือน ต้องล็อกอิน() แต่ไม่ redirect ถ้ายังไม่ล็อกอิน
// (resolve null แทน)
export async function เช็คผู้ใช้ปัจจุบัน() {
  var ผู้ใช้ = await รอสถานะเริ่มต้น();
  if (!ผู้ใช้) return null;
  var บทบาท = await อ่านบทบาท(ผู้ใช้.uid);
  return สร้างข้อมูลผู้ใช้(ผู้ใช้, บทบาท);
}
