import { Conversation } from '../types';

/**
 * Trình xuất tệp Microsoft Word (.doc / .docx) chuẩn thể thức văn bản Giáo dục Việt Nam
 * Tuân thủ Nghị định 30/2020/NĐ-CP: Phông chữ Times New Roman, cỡ chữ 13-14pt, lề A4 chuẩn
 */

export function exportExamToWord(title: string, rawContent: string, subject: string, grade: string): void {
  const fileName = `DeThi_${subject}_${grade}_${Date.now()}.doc`;

  // Chuyển đổi Markdown cơ bản sang HTML cho Word
  const htmlBody = markdownToWordHtml(rawContent);

  const documentContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 56.7pt 56.7pt 56.7pt 85.0pt; /* Top 2cm, Bottom 2cm, Right 2cm, Left 3cm */
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 13pt;
            line-height: 1.3;
            color: #000;
          }
          table.header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table.header-table td {
            vertical-align: top;
            padding: 2px 8px;
            font-size: 12pt;
          }
          .bold { font-weight: bold; }
          .center { text-align: center; }
          .right { text-align: right; }
          .underline { text-decoration: underline; }
          h1, h2, h3, h4 {
            font-family: 'Times New Roman', serif;
            color: #000;
            margin-top: 14px;
            margin-bottom: 6px;
          }
          h1 { font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; }
          h2 { font-size: 13pt; font-weight: bold; text-align: center; }
          h3 { font-size: 13pt; font-weight: bold; margin-top: 10px; }
          p { margin: 6px 0; }
          table.content-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          table.content-table th, table.content-table td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 12pt;
          }
          table.content-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .footer-note {
            font-style: italic;
            font-size: 11pt;
            margin-top: 25px;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <!-- Bảng tiêu đề trường / kỳ thi chuẩn công văn Bộ GD&ĐT -->
          <table class="header-table">
            <tr>
              <td class="center" style="width: 45%;">
                <span class="bold">SỞ GIÁO DỤC VÀ ĐÀO TẠO</span><br/>
                <span class="bold">TRƯỜNG THPT ....................</span><br/>
                <span>Mã đề thi: <strong>101</strong></span>
              </td>
              <td class="center" style="width: 55%;">
                <span class="bold">KỲ THI ĐÁNH GIÁ CHẤT LƯỢNG HỌC TẬP</span><br/>
                <span class="bold">NĂM HỌC 2025 - 2026</span><br/>
                <span>Môn thi: <strong>${subject.toUpperCase()} - ${grade.toUpperCase()}</strong></span><br/>
                <span style="font-style: italic;">(Thời gian làm bài: 45 - 90 phút)</span>
              </td>
            </tr>
          </table>

          <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin-bottom: 18px; font-size: 12pt;">
            Họ và tên thí sinh: ................................................................ Lớp: ................. SBD: .................
          </div>

          <!-- Nội dung đề thi -->
          ${htmlBody}

          <div class="footer-note">
            Đề thi được biên soạn tự động bởi Trợ lý Giáo dục <strong>ANH GIÁO AI</strong> (Thầy PHẠM QUỐC ĐẠT).
          </div>
        </div>
      </body>
    </html>
  `;

  downloadWordFile(documentContent, fileName);
}

export function exportConversationToWord(conversation: Conversation): void {
  const fileName = `AnhGiaoAI_${conversation.title.replace(/[^\w\s-]/g, '').trim() || 'HoiThoai'}_${Date.now()}.doc`;

  let contentHtml = `<h1>${conversation.title || 'HỘI THOẠI HỌC TẬP CÙNG ANH GIÁO AI'}</h1>`;
  contentHtml += `<p class="center" style="font-style: italic; font-size: 12pt;">Môn học: <strong>${conversation.subject || 'Đa môn'}</strong> | Lớp: <strong>${conversation.grade || 'Mặc định'}</strong> | Ngày: <strong>${new Date(conversation.createdAt).toLocaleDateString('vi-VN')}</strong></p><hr/>`;

  conversation.messages.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const sender = isUser ? '👤 CÂU HỎI CỦA HỌC SINH' : '🎓 BÀI GIẢNG / LỜI GIẢI CỦA ANH GIÁO AI';
    const color = isUser ? '#1e3a8a' : '#065f46';

    contentHtml += `
      <div style="margin-top: 16px; margin-bottom: 6px;">
        <span style="font-weight: bold; color: ${color}; font-size: 13pt;">${idx + 1}. ${sender}</span>
        <span style="font-size: 11pt; color: #666; margin-left: 10px;">(${new Date(msg.timestamp).toLocaleTimeString('vi-VN')})</span>
      </div>
      <div style="padding-left: 8px; border-left: 3px solid ${color};">
        ${markdownToWordHtml(msg.content)}
      </div>
    `;
  });

  const documentContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${conversation.title}</title>
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 56.7pt 56.7pt 56.7pt 85.0pt;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 13pt;
            line-height: 1.35;
            color: #000;
          }
          h1 { font-size: 15pt; font-weight: bold; text-align: center; }
          h2, h3 { font-size: 13pt; font-weight: bold; }
          p { margin: 6px 0; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${contentHtml}
          <p style="text-align: right; font-style: italic; margin-top: 30px; font-size: 11pt;">
            Tài liệu được xuất từ hệ thống Anh Giáo AI - Tác giả Thầy PHẠM QUỐC ĐẠT.
          </p>
        </div>
      </body>
    </html>
  `;

  downloadWordFile(documentContent, fileName);
}

function downloadWordFile(content: string, fileName: string): void {
  const blob = new Blob(['\ufeff' + content], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function markdownToWordHtml(md: string): string {
  if (!md) return '';

  let html = md;

  // Xử lý tiêu đề Markdown
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Xử lý in đậm, in nghiêng
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Đổi công thức LaTeX $...$ sang định dạng nghiêng toán học
  html = html.replace(/\$\$(.*?)\$\$/gs, '<div style="text-align:center; font-style:italic; font-weight:bold; margin:8px 0;">$1</div>');
  html = html.replace(/\$(.*?)\$/g, '<span style="font-style:italic; font-weight:bold;">$1</span>');

  // Xử lý xuống dòng
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');

  return `<p>${html}</p>`;
}
