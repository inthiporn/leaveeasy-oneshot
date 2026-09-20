// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 7-8: เช็คบทบาทผู้ใช้ก่อน — เฉพาะ hr เท่านั้นที่เพิ่ม/แก้/ลบได้
// (ไม่บังคับล็อกอินเข้าหน้านี้ — ไม่ล็อกอิน/ไม่ใช่ hr แค่เห็นรายการชื่อประเภทอย่างเดียว)
// ข้อมูลประเภทการลายังอ่านจาก window.LEAVE_DATA (mock) เหมือนเดิม ยังไม่ต่อ Firestore ส่วนนี้
// ─────────────────────────────────────────────────────────────

import { เช็คผู้ใช้ปัจจุบัน } from "./auth.js";

(async function () {
  var ผู้ใช้ = await เช็คผู้ใช้ปัจจุบัน(); // หน้านี้ไม่บังคับล็อกอิน — ไม่ล็อกอินจะได้ null กลับมา
  var เป็นhr = !!ผู้ใช้ && ผู้ใช้.role === "hr";

  var รายการ = window.LEAVE_DATA.leaveTypes.slice();   // ทำสำเนาไว้แก้
  var ที่วางตาราง = document.getElementById("ตารางประเภท");
  var กล่องเพิ่มประเภท = document.getElementById("กล่องเพิ่มประเภท");
  var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
  var กล่องเตือน = document.getElementById("เตือนประเภท");

  if (เป็นhr) {
    document.getElementById("ปุ่มเพิ่ม").addEventListener("click", เพิ่มประเภท);
  } else {
    // ไม่ใช่ hr (รวมถึงไม่ล็อกอิน) — ซ่อนกล่องเพิ่มประเภททั้งกล่อง
    กล่องเพิ่มประเภท.classList.add("hidden");
  }

  วาดตาราง();

  function วาดตาราง() {
    if (รายการ.length === 0) {
      ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
      return;
    }

    var หัวคอลัมน์จัดการ = เป็นhr ? "<th>จัดการ</th>" : "";
    var html = "<table><thead><tr><th>ชื่อประเภทการลา</th>" + หัวคอลัมน์จัดการ + "</tr></thead><tbody>";
    รายการ.forEach(function (ประเภท) {
      var คอลัมน์จัดการ = เป็นhr
        ? "<td>" +
          '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
          '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
          "</td>"
        : "";
      html += "<tr><td>" + esc(ประเภท.name) + "</td>" + คอลัมน์จัดการ + "</tr>";
    });
    html += "</tbody></table>";
    ที่วางตาราง.innerHTML = html;

    if (!เป็นhr) return; // ไม่ใช่ hr — ไม่มีปุ่มแก้ไข/ลบให้ผูก event อยู่แล้ว

    ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
    });
    ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
    });
  }

  function เพิ่มประเภท() {
    var ชื่อ = ช่องชื่อใหม่.value.trim();
    if (!ชื่อ) {
      กล่องเตือน.textContent = "⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้";
      กล่องเตือน.classList.remove("hidden");
      return;
    }
    กล่องเตือน.classList.add("hidden");
    รายการ.push({ id: "lt-ใหม่-" + Date.now(), name: ชื่อ });
    ช่องชื่อใหม่.value = "";
    วาดตาราง();
  }

  function แก้ประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
    if (ชื่อใหม่ === null) return;              // กดยกเลิก
    if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }
    ประเภท.name = ชื่อใหม่.trim();
    วาดตาราง();
  }

  function ลบประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;
    รายการ = รายการ.filter(function (t) { return t.id !== id; });
    วาดตาราง();
  }
})();
