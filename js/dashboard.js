// ─────────────────────────────────────────────────────────────
// js/dashboard.js — หน้าที่ 5 แดชบอร์ดสรุป (US-11)
// เป็นงานของฝ่ายบุคคลเท่านั้น (ตามสเปก US-11: "ในฐานะฝ่ายบุคคล")
// role อื่นเข้าตรง ๆ ทาง URL ไม่ได้ ถูกเด้งกลับหน้าแรกให้เอง
// ─────────────────────────────────────────────────────────────

import { ต้องล็อกอิน } from "./auth.js";
import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var สถานะทั้งหมด = ["รอพิจารณา", "อนุมัติ", "ไม่อนุมัติ"];

(async function () {
  var กล่องสถิติ = document.getElementById("กล่องสถิติ");
  var กล่องล่าสุด = document.getElementById("ผลลัพธ์ล่าสุด");

  try {
    var ผู้ใช้ = await ต้องล็อกอิน();
    if (ผู้ใช้.role !== "hr") {
      location.href = "index.html";
      return;
    }

    var ผลลัพธ์ = await getDocs(collection(db, "leaveRequests"));
    var ใบลาทั้งหมด = ผลลัพธ์.docs.map(function (doc) {
      return Object.assign({ id: doc.id }, doc.data());
    });

    วาดสถิติ(ใบลาทั้งหมด);
    วาดล่าสุด(ใบลาทั้งหมด);

  } catch (ข้อผิดพลาด) {
    console.error("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ:", ข้อผิดพลาด);
    showConfigWarning("ไม่สามารถโหลดแดชบอร์ดได้: " + ข้อผิดพลาด.message);
    กล่องสถิติ.innerHTML = "";
    กล่องล่าสุด.innerHTML = "<p>โหลดข้อมูลไม่สำเร็จ</p>";
  }

  // ── กล่องตัวเลข 3 กล่องตามสถานะ — กดแล้วไปหน้ารายการพร้อมกรองสถานะนั้น ──
  function วาดสถิติ(รายการ) {
    กล่องสถิติ.innerHTML = สถานะทั้งหมด.map(function (สถานะ) {
      var จำนวน = รายการ.filter(function (ใบ) { return ใบ.status === สถานะ; }).length;
      return (
        '<a class="stat" href="leave-requests.html?status=' + encodeURIComponent(สถานะ) + '">' +
        '<div class="number">' + จำนวน + "</div>" +
        "<div>" + esc(สถานะ) + "</div>" +
        "</a>"
      );
    }).join("");
  }

  // ── ใบลา 5 รายการล่าสุด เรียงใหม่ไปเก่า ──
  function วาดล่าสุด(รายการ) {
    var ล่าสุด5ใบ = รายการ
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })
      .slice(0, 5);

    if (ล่าสุด5ใบ.length === 0) {
      กล่องล่าสุด.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ยื่น</th>' +
      "</tr></thead><tbody>";

    ล่าสุด5ใบ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.createdAt) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่องล่าสุด.innerHTML = html;

    กล่องล่าสุด.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
      });
    });
  }
})();
