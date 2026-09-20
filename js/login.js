// ─────────────────────────────────────────────────────────────
// js/login.js — หน้า login.html: สลับแท็บเข้าสู่ระบบ/สมัครสมาชิก + เรียก Firebase Auth
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebaseConfig.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var แท็บเข้าสู่ระบบ = document.getElementById("แท็บเข้าสู่ระบบ");
var แท็บสมัครสมาชิก = document.getElementById("แท็บสมัครสมาชิก");
var ฟอร์มเข้าสู่ระบบ = document.getElementById("ฟอร์มเข้าสู่ระบบ");
var ฟอร์มสมัครสมาชิก = document.getElementById("ฟอร์มสมัครสมาชิก");
var กล่องข้อความผิดพลาด = document.getElementById("กล่องข้อความผิดพลาด");

แท็บเข้าสู่ระบบ.addEventListener("click", function () { สลับแท็บ(true); });
แท็บสมัครสมาชิก.addEventListener("click", function () { สลับแท็บ(false); });

function สลับแท็บ(เข้าสู่ระบบไหม) {
  ฟอร์มเข้าสู่ระบบ.classList.toggle("hidden", !เข้าสู่ระบบไหม);
  ฟอร์มสมัครสมาชิก.classList.toggle("hidden", เข้าสู่ระบบไหม);
  แท็บเข้าสู่ระบบ.className = เข้าสู่ระบบไหม ? "btn" : "btn btn-ghost";
  แท็บสมัครสมาชิก.className = เข้าสู่ระบบไหม ? "btn btn-ghost" : "btn";
  ซ่อนข้อความผิดพลาด();
}

function แสดงข้อความผิดพลาด(ข้อความ) {
  กล่องข้อความผิดพลาด.textContent = ข้อความ;
  กล่องข้อความผิดพลาด.classList.remove("hidden");
}
function ซ่อนข้อความผิดพลาด() {
  กล่องข้อความผิดพลาด.classList.add("hidden");
  กล่องข้อความผิดพลาด.textContent = "";
}

// แปลรหัส error ของ Firebase Auth ให้อ่านง่ายขึ้น
function แปลข้อความผิดพลาด(err) {
  var รหัส = err && err.code ? err.code : "";
  if (รหัส === "auth/invalid-credential" || รหัส === "auth/wrong-password" || รหัส === "auth/user-not-found") {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }
  if (รหัส === "auth/email-already-in-use") return "อีเมลนี้สมัครไว้แล้ว";
  if (รหัส === "auth/weak-password") return "รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)";
  if (รหัส === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
  return "เกิดข้อผิดพลาด: " + (err && err.message ? err.message : String(err));
}

ฟอร์มเข้าสู่ระบบ.addEventListener("submit", async function (e) {
  e.preventDefault();
  ซ่อนข้อความผิดพลาด();
  var อีเมล = document.getElementById("อีเมลเข้าสู่ระบบ").value.trim();
  var รหัสผ่าน = document.getElementById("รหัสผ่านเข้าสู่ระบบ").value;
  try {
    await signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    location.href = "leave-requests.html";
  } catch (err) {
    แสดงข้อความผิดพลาด(แปลข้อความผิดพลาด(err));
  }
});

ฟอร์มสมัครสมาชิก.addEventListener("submit", async function (e) {
  e.preventDefault();
  ซ่อนข้อความผิดพลาด();
  var ชื่อ = document.getElementById("ชื่อสมัคร").value.trim();
  var อีเมล = document.getElementById("อีเมลสมัคร").value.trim();
  var รหัสผ่าน = document.getElementById("รหัสผ่านสมัคร").value;
  try {
    var ข้อมูลรับรอง = await createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    await updateProfile(ข้อมูลรับรอง.user, { displayName: ชื่อ });
    await setDoc(doc(db, "users", ข้อมูลรับรอง.user.uid), {
      name: ชื่อ,
      email: อีเมล,
      role: "employee"
    });
    location.href = "leave-requests.html";
  } catch (err) {
    แสดงข้อความผิดพลาด(แปลข้อความผิดพลาด(err));
  }
});
