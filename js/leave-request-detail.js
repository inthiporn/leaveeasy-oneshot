// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// อ่านจาก Firestore จริง · ปุ่มอนุมัติ/ไม่อนุมัติเขียนเฉพาะช่อง status
// ─────────────────────────────────────────────────────────────

import { db } from "./firebaseConfig.js";
import { ต้องล็อกอิน } from "./auth.js";
import { เรียกAI } from "./openrouter.js";
import {
  doc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");
  var เอกสารใบลา = doc(db, "leaveRequests", รหัสใบลา);
  var ผู้ใช้ = await ต้องล็อกอิน();

  var ใบ, ความเห็น;
  try {
    var สแนปช็อต = await getDoc(เอกสารใบลา);
    if (!สแนปช็อต.exists()) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ใบ = Object.assign({ id: สแนปช็อต.id }, สแนปช็อต.data());

    // employee ดูใบลาของคนอื่นไม่ได้
    if (ผู้ใช้.role === "employee" && ใบ.requesterId !== ผู้ใช้.uid) {
      กล่องใบลา.innerHTML = "<p>คุณไม่มีสิทธิ์ดูใบลานี้</p>";
      return;
    }

    var สแนปช็อตความเห็น = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
    ความเห็น = สแนปช็อตความเห็น.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
  } catch (err) {
    showConfigWarning("อ่านข้อมูลจาก Firestore ไม่สำเร็จ (" + err.message + ")");
    กล่องใบลา.innerHTML = "<p>โหลดรายละเอียดใบลาไม่สำเร็จ</p>";
    return;
  }

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];
    if (ใบ.aiSuggestion) แถว.push(["สรุปโดย AI", esc(ใบ.aiSuggestion)]);

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ/ไม่อนุมัติ + ปุ่ม AI สรุป: เฉพาะ manager/hr และใบต้องยังรอพิจารณา
    // ปุ่มลบ: เฉพาะเจ้าของใบเอง (ไม่อิง role) และใบต้องยังรอพิจารณา
    var ขึ้นปุ่มอนุมัติ = ใบ.status === "รอพิจารณา" && (ผู้ใช้.role === "manager" || ผู้ใช้.role === "hr");
    var ขึ้นปุ่มลบ = ใบ.status === "รอพิจารณา" && ใบ.requesterId === ผู้ใช้.uid;

    if (ขึ้นปุ่มอนุมัติ || ขึ้นปุ่มลบ) {
      html += '<div class="btn-row">';
      if (ขึ้นปุ่มอนุมัติ) {
        html +=
          '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
          '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
          '<button type="button" class="btn-ghost" id="ปุ่มสรุป">ให้ AI ช่วยสรุปใบลา</button>';
      }
      if (ขึ้นปุ่มลบ) {
        html += '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลา</button>';
      }
      html += "</div>";
    } else if (ใบ.status !== "รอพิจารณา") {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
    var ปุ่มไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
    var ปุ่มลบ = document.getElementById("ปุ่มลบ");
    var ปุ่มที่ขึ้นทั้งหมด = [ปุ่มอนุมัติ, ปุ่มไม่อนุมัติ, ปุ่มลบ].filter(function (ป) { return !!ป; });

    if (ขึ้นปุ่มอนุมัติ) {
      ปุ่มอนุมัติ.addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ", ปุ่มที่ขึ้นทั้งหมด); });
      ปุ่มไม่อนุมัติ.addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ", ปุ่มที่ขึ้นทั้งหมด); });
      document.getElementById("ปุ่มสรุป").addEventListener("click", สรุปใบลา);
    }
    if (ขึ้นปุ่มลบ) {
      ปุ่มลบ.addEventListener("click", function () { ลบใบลา(ปุ่มที่ขึ้นทั้งหมด); });
    }
  }

  // ── เปลี่ยนสถานะ — เขียนเฉพาะช่อง status ลง Firestore ห้ามแตะช่องอื่น ──
  async function เปลี่ยนสถานะ(สถานะใหม่, ปุ่มทั้งหมด) {
    // กฎ: จะตั้งไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    ปุ่มทั้งหมด.forEach(function (ปุ่ม) { ปุ่ม.disabled = true; });
    try {
      await updateDoc(เอกสารใบลา, { status: สถานะใหม่ });   // ส่งแค่ฟิลด์ status ฟิลด์เดียว
      ใบ.status = สถานะใหม่;
      วาดใบลา();
    } catch (err) {
      alert("บันทึกสถานะลง Firestore ไม่สำเร็จ (" + err.message + ")");
      ปุ่มทั้งหมด.forEach(function (ปุ่ม) { ปุ่ม.disabled = false; });
    }
  }

  // ── ให้ AI ช่วยสรุปใบลา — เขียนเฉพาะช่อง aiSuggestion ห้ามแตะ status ──
  async function สรุปใบลา() {
    var ปุ่มสรุป = document.getElementById("ปุ่มสรุป");
    var ข้อความปุ่มเดิม = ปุ่มสรุป.textContent;
    ปุ่มสรุป.disabled = true;
    ปุ่มสรุป.textContent = "กำลังสรุป...";

    try {
      var คำถาม =
        "สรุปใบลานี้สั้นๆ ไม่เกิน 2 ประโยค เป็นภาษาไทย ให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติ:\n" +
        "ผู้ขอลา: " + ใบ.requesterName + "\n" +
        "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
        "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
        "หัวข้อ: " + ใบ.title + "\n" +
        "เหตุผล: " + ใบ.reason;

      var สรุป = (await เรียกAI(คำถาม)).trim();
      await updateDoc(เอกสารใบลา, { aiSuggestion: สรุป });   // ส่งแค่ฟิลด์ aiSuggestion ฟิลด์เดียว
      await addDoc(collection(db, "leaveRequests", รหัสใบลา, "aiLog"), {
        input: คำถาม,
        output: สรุป,
        createdAt: เวลาตอนนี้()
      });
      ใบ.aiSuggestion = สรุป;
      วาดใบลา();
    } catch (err) {
      alert("สรุปใบลาไม่สำเร็จ (" + err.message + ")");
      ปุ่มสรุป.disabled = false;
      ปุ่มสรุป.textContent = ข้อความปุ่มเดิม;
    }
  }

  // ── ลบใบลา — ต้องยืนยันก่อนเสมอ ──
  async function ลบใบลา(ปุ่มทั้งหมด) {
    if (!confirm("ยืนยันว่าจะลบใบลานี้? ลบแล้วกู้คืนไม่ได้")) return;

    ปุ่มทั้งหมด.forEach(function (ปุ่ม) { ปุ่ม.disabled = true; });
    try {
      await deleteDoc(เอกสารใบลา);
      location.href = "leave-requests.html";
    } catch (err) {
      alert("ลบใบลาไม่สำเร็จ (" + err.message + ")");
      ปุ่มทั้งหมด.forEach(function (ปุ่ม) { ปุ่ม.disabled = false; });
    }
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ (สัปดาห์นี้เก็บในหน่วยความจำอย่างเดียว ยังไม่เขียน Firestore) ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    ความเห็น.push({
      id: "ap-ใหม่-" + Date.now(),
      requestId: ใบ.id,
      authorId: ผู้ใช้.uid, authorName: ผู้ใช้.displayName || ผู้ใช้.email,
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    });
    ช่อง.value = "";
    วาดความเห็น();
  }
})();
