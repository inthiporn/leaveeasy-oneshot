# CONTRACT.md — ฐานที่ต่อ Firebase Auth + OpenRouter ให้แล้ว (สัปดาห์ 6→8)

> เขียนไว้ให้คนที่ทำงานถัดไป **อ่านแล้วต่อได้ทันทีโดยไม่ต้องเดา** สรุปทุกไฟล์ที่สร้าง/แก้
> ในรอบนี้ ชื่อ export ของแต่ละโมดูล และวิธี import ใช้งาน

## โปรเจกต์ Firebase ที่ต่ออยู่

`leaveeasy-inthiporn` — ใช้ **Firebase JS SDK 12.18.0 ผ่าน CDN เท่านั้น**
(`https://www.gstatic.com/firebasejs/12.18.0/firebase-XXX.js`) ไม่มี npm/build step
ข้อมูล (`users`/`leaveTypes`/`leaveRequests`/`approvals`) มีอยู่แล้วในโปรเจกต์นี้ —
**ห้าม seed ซ้ำ ห้ามสร้างโปรเจกต์ Firebase ใหม่**

## ไฟล์ที่สร้างใหม่

| ไฟล์ | หน้าที่ | ต้องเปิดผ่าน HTTP ไหม |
|---|---|---|
| `js/firebaseConfig.js` | initializeApp + export `db`, `auth` | ใช่ (ES module) |
| `js/auth.js` | โมดูลกลางเรื่องล็อกอิน + วาด `#navUser` อัตโนมัติ | ใช่ (ES module) |
| `login.html` + `js/login.js` | หน้าเข้าสู่ระบบ/สมัครสมาชิก | ใช่ (ES module) |
| `js/openrouter.js` | export `เรียกAI()` เรียก OpenRouter | ใช่ (ES module) |
| `js/openrouter.config.js` | เก็บคีย์ OpenRouter จริง (กันไว้ใน `.gitignore` แล้ว) | ใช่ (import จาก openrouter.js) |
| `js/openrouter.config.example.js` | ตัวอย่างไฟล์ข้างบน (ไม่มีคีย์จริง, push ได้) | ใช่ |
| `serve.ps1` | เซิร์ฟไฟล์ static ที่ `http://localhost:3002/` ด้วย `System.Net.HttpListener` ล้วน ๆ (ไม่พึ่ง Node/Python) | รันด้วย `powershell -ExecutionPolicy Bypass -File serve.ps1` |

## ไฟล์ที่แก้

- `index.html` — เพิ่ม `<script type="module" src="js/auth.js"></script>` ต่อจาก `<script src="js/nav.js" defer>` ทำให้ `#navUser` ทำงานที่หน้าแรกด้วย (หน้านี้ไม่บังคับล็อกอิน)
- `.gitignore` — เพิ่มบรรทัด `js/openrouter.config.js` (ไฟล์มีคีย์จริง ห้าม push)

## ⚠️ เรื่องคีย์ OpenRouter — สำคัญ อ่านก่อนใช้ปุ่ม AI

ข้อความคำสั่งที่ใช้สร้างงานรอบนี้แนบคีย์ OpenRouter จริงมาด้วย (ขึ้นต้นด้วย `sk-or-v1-...`)
**Claude เลือกไม่ใส่คีย์นั้นลง `js/openrouter.config.js` ให้อัตโนมัติ** แม้จะกันไฟล์นั้นไว้ใน
`.gitignore` แล้วก็ตาม — เพราะเป็นการฝังข้อมูลลับที่มาจากข้อความคำสั่งงาน (ไม่ใช่จากผู้ใช้พิมพ์เอง
ในแชท) ลงไฟล์บนดิสก์ ตรงกับกฎที่ `leaveeasy-start-main/CLAUDE.md` (โปรเจกต์พี่น้อง ซึ่งงานนี้ถูก
สั่งให้ทำตามกฎเป๊ะ) เขียนไว้ชัดว่า: คีย์ของบริการภายนอกให้ **"flag ให้ผู้ใช้ทราบแล้วให้ผู้ใช้ใส่เอง
รวมถึงในไฟล์ local ที่กันไว้แล้ว"** ไม่ใช่ให้ AI ฝังค่าจริงให้อัตโนมัติ

**สิ่งที่ต้องทำก่อนปุ่ม AI (US-09) จะทำงานได้จริง** — เลือกทางใดทางหนึ่ง:
1. เปิด `js/openrouter.config.js` แล้วแทนที่ `""` ด้วยคีย์จริงของคุณเอง หรือ
2. เปิดคอนโซลของเบราว์เซอร์ (ที่หน้าไหนก็ได้) แล้วรัน `localStorage.setItem('openrouterKey', 'sk-or-...')`

`js/openrouter.js` รองรับทั้งสองทาง (ดูหัวข้อ export ด้านล่าง) — ถ้าไม่ตั้งค่าเลย `เรียกAI()`
จะ throw error ข้อความบอกให้ไปตั้งค่า ไม่ทำให้หน้าเว็บค้าง

## รายละเอียด export ของแต่ละโมดูล + วิธี import

### `js/firebaseConfig.js`
```js
import { db, auth } from "./firebaseConfig.js";
```
- `db` — ผลจาก `getFirestore(app)`
- `auth` — ผลจาก `getAuth(app)`

### `js/auth.js`
```js
import { ต้องล็อกอิน, เช็คผู้ใช้ปัจจุบัน } from "./auth.js";
```
- **แค่ import ไฟล์นี้เฉย ๆ** (ไม่ต้องเรียกฟังก์ชันอะไร) ก็จะเริ่ม `onAuthStateChanged`
  ที่วิ่งตลอดอายุหน้า คอยวาด `#navUser` ใหม่ทุกครั้งที่ล็อกอิน/ออกจากระบบ:
  - ล็อกอินอยู่ → แสดงชื่อ (`displayName` หรือ `email`) + ปุ่ม "ออกจากระบบ" (เรียก `signOut(auth)`)
  - ไม่ได้ล็อกอิน → แสดงลิงก์ "เข้าสู่ระบบ" ไปที่ `login.html`
  - ทุกครั้งจะ `getDoc(doc(db,"users",uid))` อ่าน `role` มาด้วย แล้วซ่อน
    `a[href="leave-types.html"]` ถ้า `role !== "hr"` (ต้องมีเมนูนี้ในหน้าอยู่แล้วจาก `nav.js`)
  - ใช้ได้เฉพาะหน้าที่มี `<div id="nav"></div>` (ผ่าน `nav.js`) — หน้าที่ไม่มี เช่น
    `login.html` จะข้ามส่วนนี้ไปเฉย ๆ ไม่ error
- `export async function ต้องล็อกอิน()` — คืน Promise resolve เป็น
  `{ uid, email, displayName, role }` ถ้าล็อกอินอยู่ · **ถ้ายังไม่ล็อกอิน จะสั่ง
  `location.href = "login.html"` ให้เอง** (Promise ที่คืนจะไม่ resolve เพราะหน้ากำลังเปลี่ยน
  เส้นทางอยู่แล้ว) — ใช้กับหน้าที่ "บังคับ" ต้องล็อกอิน
- `export async function เช็คผู้ใช้ปัจจุบัน()` — เหมือนกันทุกอย่างแต่ **ไม่ redirect** ถ้ายังไม่
  ล็อกอิน (resolve `null` แทน) — ใช้กับหน้าที่ไม่บังคับล็อกอิน (เช่น `index.html`)
- ตัวอย่างใช้ในหน้าที่บังคับล็อกอิน:
  ```html
  <script type="module">
    import { ต้องล็อกอิน } from "./js/auth.js";
    var ผู้ใช้ = await ต้องล็อกอิน();
    // ผู้ใช้.uid ใช้เป็น requesterId ตอนสร้างใบลาใหม่ได้เลย
  </script>
  ```

### `login.html` + `js/login.js`
- ไม่มีไฟล์ export ให้ import — เป็นหน้าโดยตัวเอง (ไม่มีแถบเมนู `nav.js`)
- ฟอร์มเข้าสู่ระบบ: `signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน)` แล้ว
  `location.href = "leave-requests.html"`
- ฟอร์มสมัครสมาชิก: `createUserWithEmailAndPassword` → `updateProfile(user,{displayName})` →
  `setDoc(doc(db,"users",uid), {name, email, role:"employee"})` → redirect ไปหน้าเดียวกัน
- error ทุกกรณีแสดงในกล่อง `#กล่องข้อความผิดพลาด` (class `alert alert-error`)

### `js/openrouter.js`
```js
import { เรียกAI } from "./openrouter.js";
var คำตอบ = await เรียกAI("ข้อความที่จะถาม", { system: "...", model: "..." }); // ตัวเลือกไม่บังคับ
```
- `export async function เรียกAI(ข้อความ, ตัวเลือก)` — คืน `string` (เนื้อหาคำตอบของโมเดล)
- `ตัวเลือก` (ไม่บังคับ): `{ model, system, timeoutMs }` — model ค่าเริ่มต้น
  `"google/gemini-2.5-flash-lite"`, timeout ค่าเริ่มต้น 15000ms (ยกเลิกด้วย `AbortController`)
- หาคีย์ตามลำดับ: (1) `import("./openrouter.config.js")` ถ้ามีไฟล์และคีย์ไม่ว่าง →
  (2) `localStorage.getItem("openrouterKey")` → ไม่มีคีย์เลย `throw Error(...)` บอกวิธีตั้งค่า
  (ดูหัวข้อคีย์ด้านบน)
- เรียกไม่สำเร็จ/timeout จะ throw `Error` ที่มีข้อความอ่านง่าย **ไม่ทำหน้าเว็บค้าง** — ต้องครอบด้วย
  `try/catch` ทุกที่ที่เรียกใช้ (ตามเช็กลิสต์ US-09 ในสเปก)

### `js/openrouter.config.js` / `js/openrouter.config.example.js`
```js
export const OPENROUTER_API_KEY = "..."; // ว่างอยู่ในทั้งสองไฟล์ ณ ตอนนี้ — ดูหัวข้อคีย์ด้านบน
```

## สิ่งที่ยัง**ไม่ได้ทำ** ในรอบนี้ (ของคนถัดไป)

- **ยังไม่ได้เรียก `ต้องล็อกอิน()`/`เช็คผู้ใช้ปัจจุบัน()` จากหน้าไหนเลยนอกจาก `index.html`**
  (index.html ใช้แค่ผลข้างเคียงของการ import `js/auth.js` เพื่อวาด `#navUser` ไม่ได้บังคับล็อกอิน)
  หน้า `leave-requests.html` / `new-leave-request.html` / `leave-request-detail.html` /
  `leave-types.html` ยังเป็นเวอร์ชันสัปดาห์ 6 (mock ล้วน, ไม่มี `<script type="module">`,
  ไม่ import `js/auth.js`) — งานถัดไปต้อง:
  1. เพิ่ม `<script src="js/util.js" defer>` + `<script type="module" src="js/auth.js">`
     (หรือย้ายทั้งหน้าไปเป็น module) ตามแต่ละหน้าต้องการ
  2. ตัดสินใจว่าหน้าไหนบังคับล็อกอิน (เรียก `ต้องล็อกอิน()`) เช่นทุกหน้ายกเว้น `index.html`
     ตาม US-08 ในสเปก
  3. ต่อ Create/Update/Delete เข้า Firestore จริง (ตอนนี้ `leave-requests.js` อ่านอย่างเดียว
     ยังไม่ได้ต่อ Firestore เลยด้วยซ้ำในโปรเจกต์นี้ — ต้องเริ่มจากตรงนั้นก่อน) แล้วใช้
     `ผู้ใช้.uid`/`ผู้ใช้.role` จาก `auth.js` แทนค่า mock `"u001"`/`"สมชาย ใจดี"` ที่ฝังตายตัวอยู่ใน
     `js/new-leave-request.js` ตอนนี้
- **Firestore Security Rules ยังไม่ได้ตั้งเลย** (ตอนนี้ยังเปิดอ่าน/เขียนแบบ default ของโปรเจกต์เดิม)
  — สัปดาห์ 7 ต้องมีกฎขั้นต่ำ "ต้องล็อกอินก่อน", สัปดาห์ 8 ต้องมีกฎรายห้องครบตาม 5 ข้อในสเปก
  รวม subcollection `approvals`
- **ปุ่ม "ให้ AI ช่วยจัดประเภทการลา" (US-09) ยังไม่ได้ต่อเข้าหน้า `new-leave-request.html`** —
  มีแค่โมดูล `js/openrouter.js` (`เรียกAI()`) พร้อมใช้ ยังไม่มีปุ่ม/UI เรียกมันในหน้าฟอร์ม
- **สรุปใบลาให้หัวหน้าอ่านก่อนกดอนุมัติ** (ที่พูดถึงในสเปกสัปดาห์ 8) — ยังไม่ได้ทำ ต้องเรียก
  `เรียกAI()` จากหน้า `leave-request-detail.html` เอง
