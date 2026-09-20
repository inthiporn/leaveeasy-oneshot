// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 7 (กลาง): อ่านจาก Firestore จริง
// ─────────────────────────────────────────────────────────────

import { ต้องล็อกอิน } from "./auth.js";
import { db } from "./firebaseConfig.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var กล่อง = document.getElementById("ผลลัพธ์");

  try {
    // ล็อกอินก่อนอ่านข้อมูล — คืน {uid, role, ...}
    var ผู้ใช้ = await ต้องล็อกอิน();

    // สร้าง query ตาม role
    var ตัวคิวรี;
    if (ผู้ใช้.role === "employee") {
      // ผู้ขอลา เห็นได้เฉพาะใบของตัวเอง
      ตัวคิวรี = query(
        collection(db, "leaveRequests"),
        where("requesterId", "==", ผู้ใช้.uid)
      );
    } else {
      // ผู้อนุมัติ / ฝ่ายบุคคล เห็นทั้งหมด
      ตัวคิวรี = collection(db, "leaveRequests");
    }

    // อ่านจาก Firestore
    var ผลลัพธ์ = await getDocs(ตัวคิวรี);
    var ใบลาทั้งหมด = ผลลัพธ์.docs.map(function (doc) {
      return Object.assign({ id: doc.id }, doc.data());
    });

    // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
    var สถานะที่กรอง = ค่าจากURL("status");
    if (สถานะที่กรอง) {
      ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
      document.querySelector(".subtitle").textContent =
        "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
    }

    แสดงตาราง(ใบลาทั้งหมด);

  } catch (ข้อผิดพลาด) {
    console.error("ล้มเหลวในการอ่านใบลา:", ข้อผิดพลาด);
    showConfigWarning("ไม่สามารถโหลดรายการใบลาได้: " + ข้อผิดพลาด.message);
  }

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      "</tr></thead><tbody>";

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่อง.innerHTML = html;

    // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
    กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
      });
    });
  }
})();
