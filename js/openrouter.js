// ─────────────────────────────────────────────────────────────
// js/openrouter.js — เรียก AI ผ่าน OpenRouter (Chat Completions API)
// ใช้กับปุ่ม "ให้ AI ช่วยจัดประเภทการลา" (US-09) และสรุปใบลาให้หัวหน้าอ่าน
//
// วิธีใช้: import { เรียกAI } from "./openrouter.js"; แล้ว
//   var คำตอบ = await เรียกAI("ข้อความที่จะถาม", { system: "...", model: "..." });
// ─────────────────────────────────────────────────────────────

var URL_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
var โมเดลเริ่มต้น = "google/gemini-2.5-flash-lite";
var TIMEOUT_MS = 15000;

// หาคีย์ API ตามลำดับ:
//   (ก) import("./openrouter.config.js") ถ้ามีไฟล์และมีค่า OPENROUTER_API_KEY ไม่ว่าง
//   (ข) ถ้าไม่มีไฟล์ หรือไฟล์มีคีย์ว่าง — fallback ไป localStorage.getItem("openrouterKey")
// ไม่มีคีย์เลยทั้งสองทาง -> throw error บอกให้ไปตั้งค่า
async function หาคีย์() {
  try {
    var โมดูล = await import("./openrouter.config.js");
    if (โมดูล && โมดูล.OPENROUTER_API_KEY) return โมดูล.OPENROUTER_API_KEY;
  } catch (err) {
    // ไม่มีไฟล์ js/openrouter.config.js หรือโหลดไม่สำเร็จ — ไปลอง localStorage ต่อ
  }

  var จากที่เก็บในเบราว์เซอร์ = (function () {
    try { return localStorage.getItem("openrouterKey") || ""; } catch (err) { return ""; }
  })();
  if (จากที่เก็บในเบราว์เซอร์) return จากที่เก็บในเบราว์เซอร์;

  throw new Error(
    "ยังไม่ได้ตั้งค่าคีย์ OpenRouter — คัดลอก js/openrouter.config.example.js " +
    "เป็น js/openrouter.config.js แล้วใส่คีย์จริงของคุณ หรือเปิดคอนโซลของเบราว์เซอร์แล้วรัน " +
    "localStorage.setItem('openrouterKey', 'sk-or-...')"
  );
}

// เรียกAI(ข้อความ, ตัวเลือก) -> คืนข้อความตอบกลับ (string) จากโมเดล
// ตัวเลือก (ไม่บังคับ): { model, system, timeoutMs }
export async function เรียกAI(ข้อความ, ตัวเลือก) {
  ตัวเลือก = ตัวเลือก || {};
  var คีย์ = await หาคีย์();

  var ข้อความทั้งหมด = [];
  if (ตัวเลือก.system) ข้อความทั้งหมด.push({ role: "system", content: ตัวเลือก.system });
  ข้อความทั้งหมด.push({ role: "user", content: ข้อความ });

  var ตัวยกเลิก = new AbortController();
  var เวลาที่จะรอ = ตัวเลือก.timeoutMs || TIMEOUT_MS;
  var ตัวจับเวลา = setTimeout(function () { ตัวยกเลิก.abort(); }, เวลาที่จะรอ);

  try {
    var คำตอบ = await fetch(URL_OPENROUTER, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + คีย์,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ตัวเลือก.model || โมเดลเริ่มต้น,
        messages: ข้อความทั้งหมด
      }),
      signal: ตัวยกเลิก.signal
    });

    if (!คำตอบ.ok) {
      var ข้อความจากเซิร์ฟเวอร์ = await คำตอบ.text();
      throw new Error("OpenRouter ตอบกลับผิดพลาด: " + คำตอบ.status + " " + ข้อความจากเซิร์ฟเวอร์);
    }

    var ข้อมูล = await คำตอบ.json();
    var เนื้อหา = ข้อมูล && ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message
      ? ข้อมูล.choices[0].message.content
      : "";
    if (!เนื้อหา) throw new Error("OpenRouter ไม่ได้ส่งคำตอบกลับมา");
    return เนื้อหา;
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new Error("เรียก AI ไม่สำเร็จ — รอเกิน " + (เวลาที่จะรอ / 1000) + " วินาที");
    }
    throw err;
  } finally {
    clearTimeout(ตัวจับเวลา);
  }
}
