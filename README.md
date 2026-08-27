# 🎓 ANH GIÁO AI - TRỢ LÝ HỌC TẬP ĐA MÔN & TẠO ĐỀ THI
> **Phát triển bởi: Thầy PHẠM QUỐC ĐẠT**  
> Trợ lý trí tuệ nhân tạo thế hệ mới đồng hành cùng học sinh và giáo viên Việt Nam từ Tiểu học, THCS, THPT đến Ôn thi Tốt nghiệp THPT & ĐGNL.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Đa môn học toàn diện theo chương trình GDPT mới**:
   - Hỗ trợ chuyên sâu 12+ môn học (Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý, Tin học, GDCD & KTPL, Công nghệ, KHTN...).
2. **3 Chế độ sư phạm độc quyền**:
   - 💡 **Gợi ý nhẹ (Hint)**: Không giải hộ ngay, đưa ra công thức cốt lõi và câu hỏi gợi mở để kích thích tư duy độc lập.
   - 📖 **Hướng dẫn từng bước (Guided)**: Chia nhỏ bài toán theo các bước logic (Bước 1, Bước 2...) và giải thích bản chất "Tại sao lại làm như vậy".
   - ✅ **Giải / Phân tích chi tiết (Full)**: Lời giải mẫu mực, phân tích phương pháp tối ưu, mẹo nhớ nhanh và cảnh báo các bẫy đề thi dễ mất điểm.
3. **Trợ lý Tạo Đề Thi & Đề Kiểm Tra GDPT 2018 (CV 7991)**:
   - Tự động sinh đề kiểm tra 15p, 45p, giữa kỳ, học kỳ và thi thử tốt nghiệp gồm 4 phần chuẩn:
     - **Phần I**: Trắc nghiệm 4 lựa chọn (A, B, C, D)
     - **Phần II**: Trắc nghiệm Đúng/Sai (4 ý a, b, c, d)
     - **Phần III**: Trắc nghiệm Trả lời ngắn
     - **Phần IV**: Câu hỏi Tự luận (Lớp 10, 11) hoặc 100% trắc nghiệm (Lớp 12).
   - Kèm bảng đáp án, ma trận và hướng dẫn chấm thang điểm 10 chi tiết.
4. **Bộ Thẻ Ghi Nhớ Flashcard & Thuật Toán SM-2 (Spaced Repetition)**:
   - Lưu công thức, định nghĩa, từ vựng và mốc lịch sử thành thẻ ghi nhớ lật 3D.
   - Thuật toán lặp lại ngắt quãng SM-2 nhắc nhở ôn tập đúng chu kỳ não bộ ghi nhớ.
5. **Phòng Thí Nghiệm Ảo & Mô Phỏng Trực Quan**:
   - **Vật lý**: Con lắc đơn dao động điều hòa theo thời gian thực ($T = 2\pi\sqrt{l/g}$).
   - **Toán học**: Khảo sát đồ thị Parabol ($y = ax^2 + bx + c$) với thanh trượt tương tác.
   - **Hóa học**: Mô phỏng chuẩn độ Axit - Bazơ và đổi màu chất chỉ thị pH.
6. **Nhận diện Giọng nói Tiếng Việt (Voice Input)**:
   - Tích hợp Web Speech API cho phép học sinh đọc đề bài bằng giọng nói tự nhiên.
7. **Định dạng Toán học & Khoa học đỉnh cao**:
   - Tích hợp **LaTeX / KaTeX** hiển thị công thức sắc nét nội dòng `$..$` và dạng khối `$$..$$`, hỗ trợ sao chép nhanh mã LaTeX.
8. **Xử lý Đa phương thức (Multimodal OCR)**:
   - Học sinh có thể chụp ảnh hoặc tải ảnh đề bài từ sách, vở, bài kiểm tra để AI giải đáp tức thì.
9. **Cơ chế Fallback Đa Tầng & Hỗ trợ Dual Provider (`api.md`)**:
   - Tự động fallback: `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3.5-flash-lite` → `gemini-3.1-pro-preview` → `gemini-2.5-flash` khi gặp tải cao 503 mà không báo sai key.
   - Hỗ trợ cả **Google Gemini API** và **Google Cloud Agent Platform API**.
   - Chấp nhận cả key cũ `AIzaSy...` lẫn auth key mới `AQ...`.
   - Tự động xoay API Key khi gặp lỗi quá tải `429 Rate Limit`.
10. **Bộ Đếm Lượt Truy Cập Server-Side (`counterapi.dev`)**:
    - Hiển thị tổng lượt học tập toàn quốc, lượt hôm nay và lượt cá nhân với hiệu ứng số đếm mượt mà.
11. **Tự Động Lưu Phiên Làm Việc (Session Persistence)**:
    - Tự động lưu trạng thái học tập vào `localStorage` mỗi 5 giây, có thông báo và khôi phục khi mở lại app.

---

## 🛠️ TECH STACK

- **Frontend**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS (Mobile-first, Dark/Light Mode, Safe-area iOS Safari).
- **AI Engine**: `@google/genai` (Gemini 3.6 Flash, 3.5 Flash, 3.5 Flash Lite, 3.1 Pro, 2.5 Flash, Agent Platform API).
- **Icons & Math**: `lucide-react`, `katex`.
- **Hosting**: Vercel Static Hosting (`vercel.json` SPA Routing).

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI VERCEL (TỪ GITHUB)

Ứng dụng được thiết kế kiến trúc **Dual-Mode Client-Side AI**, chạy trực tiếp trên trình duyệt của người dùng với API key cá nhân (BYOK), sẵn sàng 100% để deploy lên Vercel:

1. Đẩy mã nguồn dự án lên kho chứa GitHub:
   ```bash
   git add .
   git commit -m "feat: upgrade Anh Giao AI with GDPT 2018 exam gen, flashcards, simulations and Gemini 3.x"
   git push origin main
   ```
2. Truy cập [Vercel Dashboard](https://vercel.com) -> Nhấn **Add New Project** -> Chọn repository vừa tải lên.
3. Build Settings mặc định của Vite:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Nhấn **Deploy**.
5. File `vercel.json` có sẵn ở thư mục gốc sẽ tự động cấu hình SPA routing, đảm bảo truy cập và tải lại trang mượt mà không bị lỗi 404.

---

## 🔑 HƯỚNG DẪN LẤY GEMINI API KEY MIỄN PHÍ

1. Truy cập trang quản lý khóa của Google: [Google AI Studio API Keys](https://aistudio.google.com/api-keys).
2. Đăng nhập bằng tài khoản Google bất kỳ.
3. Nhấn nút **Create API Key** (Tạo khóa API).
4. Sao chép chuỗi ký tự API Key (bắt đầu bằng `AIzaSy...` hoặc `AQ...`).
5. Mở ứng dụng **Anh Giáo AI** -> Nhấn vào nút đỏ **"Lấy API key để sử dụng app"** hoặc biểu tượng **Cài đặt** (⚙️) -> Dán mã khóa vào ô **Gemini API Key** -> Nhấn **Lưu cấu hình**.

---

*Phát triển với trọn vẹn tâm huyết bởi **Thầy PHẠM QUỐC ĐẠT** - Vì sự tiến bộ của nền Giáo dục Việt Nam.*
