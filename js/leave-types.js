// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 7-8: อ่าน/เพิ่ม/แก้/ลบโฟลเดอร์ leaveTypes บน Firestore จริง (US-06)
// บังคับล็อกอินก่อน (ไม่ล็อกอินอ่านข้อมูลไม่ได้เลยตาม US-08)
// หน้านี้เป็นงานของฝ่ายบุคคลเท่านั้น — role อื่นเข้าตรง ๆ ทาง URL ไม่ได้ ถูกเด้งกลับหน้าแรกให้เอง
// ─────────────────────────────────────────────────────────────

import { ต้องล็อกอิน } from "./auth.js";
import { db } from "./firebaseConfig.js";
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var ผู้ใช้ = await ต้องล็อกอิน(); // ไม่ล็อกอินจะถูกเด้งไป login.html ให้เอง
  if (ผู้ใช้.role !== "hr") {
    location.href = "index.html";
    return;
  }
  var รายการ = [];
  var ที่วางตาราง = document.getElementById("ตารางประเภท");
  var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
  var กล่องเตือน = document.getElementById("เตือนประเภท");
  var ปุ่มเพิ่ม = document.getElementById("ปุ่มเพิ่ม");

  ปุ่มเพิ่ม.addEventListener("click", เพิ่มประเภท);

  try {
    รายการ = await อ่านประเภททั้งหมด();
  } catch (err) {
    showConfigWarning("อ่านประเภทการลาจาก Firestore ไม่สำเร็จ (" + err.message + ")");
    ที่วางตาราง.innerHTML = "<p>โหลดประเภทการลาไม่สำเร็จ</p>";
    return;
  }

  วาดตาราง();

  // ── อ่านโฟลเดอร์ leaveTypes ทั้งหมดจาก Firestore ──
  async function อ่านประเภททั้งหมด() {
    var ผลลัพธ์ = await getDocs(collection(db, "leaveTypes"));
    return ผลลัพธ์.docs.map(function (d) { return { id: d.id, name: d.data().name }; });
  }

  function วาดตาราง() {
    if (รายการ.length === 0) {
      ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
      return;
    }

    var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
    รายการ.forEach(function (ประเภท) {
      html += "<tr><td>" + esc(ประเภท.name) + "</td><td>" +
        '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
        '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
        "</td></tr>";
    });
    html += "</tbody></table>";
    ที่วางตาราง.innerHTML = html;

    ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
    });
    ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
    });
  }

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  // ── เพิ่มประเภทการลาใหม่ลง Firestore ──
  async function เพิ่มประเภท() {
    var ชื่อ = ช่องชื่อใหม่.value.trim();
    if (!ชื่อ) {
      เตือน("พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้");
      return;
    }
    กล่องเตือน.classList.add("hidden");

    var ข้อความปุ่มเดิม = ปุ่มเพิ่ม.textContent;
    ปุ่มเพิ่ม.disabled = true;
    ปุ่มเพิ่ม.textContent = "กำลังเพิ่ม...";
    try {
      var เอกสารใหม่ = await addDoc(collection(db, "leaveTypes"), { name: ชื่อ });
      รายการ.push({ id: เอกสารใหม่.id, name: ชื่อ });
      ช่องชื่อใหม่.value = "";
      วาดตาราง();
    } catch (err) {
      เตือน("เพิ่มประเภทการลาไม่สำเร็จ (" + err.message + ")");
    } finally {
      ปุ่มเพิ่ม.disabled = false;
      ปุ่มเพิ่ม.textContent = ข้อความปุ่มเดิม;
    }
  }

  // ── แก้ชื่อประเภทการลา — เขียนเฉพาะช่อง name ──
  async function แก้ประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
    if (ชื่อใหม่ === null) return;              // กดยกเลิก
    if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }

    try {
      await updateDoc(doc(db, "leaveTypes", id), { name: ชื่อใหม่.trim() });
      ประเภท.name = ชื่อใหม่.trim();
      วาดตาราง();
    } catch (err) {
      alert("แก้ชื่อประเภทการลาไม่สำเร็จ (" + err.message + ")");
    }
  }

  // ── ลบประเภทการลา — ต้องยืนยันก่อนเสมอ ──
  async function ลบประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;

    try {
      await deleteDoc(doc(db, "leaveTypes", id));
      รายการ = รายการ.filter(function (t) { return t.id !== id; });
      วาดตาราง();
    } catch (err) {
      alert("ลบประเภทการลาไม่สำเร็จ (" + err.message + ")");
    }
  }
})();
