// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7-8: บังคับล็อกอินก่อน แล้วบันทึกใบลาลง Firestore จริง
// พร้อมปุ่ม AI ช่วยจัดประเภทการลา (US-09)
// ─────────────────────────────────────────────────────────────

import { ต้องล็อกอิน } from "./auth.js";
import { db } from "./firebaseConfig.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { เรียกAI } from "./openrouter.js";

(async function () {
  var ผู้ใช้ = await ต้องล็อกอิน(); // หน้านี้บังคับล็อกอิน — ไม่ล็อกอินจะถูกเด้งไป login.html ให้เอง

  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ช่องเหตุผล = document.getElementById("reason");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var ป้ายข้อเสนอAI = document.getElementById("ป้ายข้อเสนอAI");

  // ประเภทการลาอ่านจากโฟลเดอร์ leaveTypes บน Firestore (US-02 สัปดาห์ที่ 7)
  // ประเภทที่ฝ่ายบุคคลเพิ่มในหน้า จัดการประเภทการลา จึงมาโผล่ที่นี่ทันที
  var ประเภทการลาทั้งหมด = [];
  try {
    var ผลประเภทการลา = await getDocs(collection(db, "leaveTypes"));
    ประเภทการลาทั้งหมด = ผลประเภทการลา.docs.map(function (d) {
      return { id: d.id, name: d.data().name };
    });
  } catch (err) {
    เตือน("โหลดประเภทการลาจากฐานข้อมูลไม่สำเร็จ — " + (err && err.message ? err.message : "ลองใหม่อีกครั้ง"));
  }

  // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่
  ประเภทการลาทั้งหมด.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  // ปุ่ม "ให้ AI ช่วยจัดประเภทการลา" — อ่านเหตุผลปัจจุบัน ส่งให้ AI เลือกชื่อประเภทที่ตรงกับระบบเป๊ะ
  ปุ่มAI.addEventListener("click", async function () {
    var เหตุผล = ช่องเหตุผล.value.trim();
    if (!เหตุผล) {
      เตือน("กรอกเหตุผลการลาก่อน ถึงจะให้ AI ช่วยจัดประเภทได้");
      return;
    }

    ป้ายข้อเสนอAI.classList.add("hidden");
    ปุ่มAI.disabled = true; // กันกดซ้ำระหว่างรอ — ปุ่มบันทึกไม่ถูกแตะ ยังยื่นใบลาได้ตลอด
    var ข้อความปุ่มเดิม = ปุ่มAI.textContent;
    ปุ่มAI.textContent = "กำลังจัดประเภท...";

    try {
      var รายชื่อประเภท = ประเภทการลาทั้งหมด.map(function (t) { return t.name; });
      var คำตอบ = await เรียกAI(
        "เหตุผลการลา: " + เหตุผล,
        {
          system:
            "คุณคือผู้ช่วยจัดประเภทการลา ประเภทการลาที่มีอยู่ในระบบมีเท่านี้: " +
            รายชื่อประเภท.join(", ") +
            " — อ่านเหตุผลการลาที่ผู้ใช้ส่งมาแล้วตอบกลับด้วยชื่อประเภทการลาเพียงชื่อเดียวที่ตรงกับ" +
            "รายการข้างต้นตัวสะกดเป๊ะ ๆ เท่านั้น ห้ามอธิบายเพิ่มเติม ห้ามมีคำอื่นปนมา"
        }
      );

      var ชื่อที่ตอบมา = (คำตอบ || "").trim();
      var ประเภทที่ตรง = ประเภทการลาทั้งหมด.find(function (t) { return t.name === ชื่อที่ตอบมา; });

      if (ประเภทที่ตรง) {
        ช่องประเภท.value = ประเภทที่ตรง.id;
        ป้ายข้อเสนอAI.classList.remove("hidden");
      } else {
        เตือน("AI จัดประเภทให้ไม่ได้");
      }
    } catch (err) {
      เตือน("AI จัดประเภทให้ไม่ได้");
    } finally {
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = ข้อความปุ่มเดิม;
    }
  });

  ฟอร์ม.addEventListener("submit", async function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: ช่องเหตุผล.value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = ประเภทการลาทั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });

    var ข้อความปุ่มบันทึกเดิม = ปุ่มบันทึก.textContent;
    ปุ่มบันทึก.disabled = true;
    ปุ่มบันทึก.textContent = "กำลังบันทึก...";

    try {
      await addDoc(collection(db, "leaveRequests"), {
        title: ค่า.title,
        reason: ค่า.reason,
        status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
        requesterId: ผู้ใช้.uid,
        requesterName: ผู้ใช้.displayName || ผู้ใช้.email,
        approverId: "",      approverName: "",
        leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
        startDate: ค่า.startDate,
        endDate: ค่า.endDate,
        createdAt: เวลาตอนนี้()
      });

      location.href = "leave-requests.html";
    } catch (err) {
      เตือน("บันทึกใบลาไม่สำเร็จ — " + (err && err.message ? err.message : "ลองใหม่อีกครั้ง"));
      ปุ่มบันทึก.disabled = false;
      ปุ่มบันทึก.textContent = ข้อความปุ่มบันทึกเดิม;
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
