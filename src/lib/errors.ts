import { AppError, ErrorType } from '../types';

export const ERROR_MESSAGES: Record<ErrorType, { message: string; userHelp: string }> = {
  EMPTY_INPUT: {
    message: 'Nội dung câu hỏi đang trống.',
    userHelp: 'Em hãy nhập câu hỏi hoặc chọn tải ảnh bài tập lên trước khi nhấn Gửi nhé.',
  },
  NO_API_KEY: {
    message: 'Chưa cấu hình Google AI API Key.',
    userHelp: 'Vui lòng nhấn vào "Cài đặt" (hoặc dòng chữ đỏ trên thanh tiêu đề) để nhập API Key miễn phí từ Google AI Studio.',
  },
  INVALID_API_KEY: {
    message: 'API Key không hợp lệ hoặc đã hết hạn.',
    userHelp: 'Em hãy kiểm tra lại khóa API tại Google AI Studio (aistudio.google.com/api-keys) và cập nhật trong phần Cài đặt.',
  },
  PERMISSION_DENIED: {
    message: 'API Key không có quyền truy cập mô hình này.',
    userHelp: 'Google đã nhận API Key nhưng chưa cấp quyền cho mô hình đang chọn. Vui lòng kiểm tra quyền hoặc chọn mô hình khác trong Cài đặt.',
  },
  MODEL_OVERLOADED: {
    message: 'Mô hình AI đang tạm thời quá tải (503 High Demand).',
    userHelp: 'Hệ thống đang tự động chuyển sang mô hình dự phòng để tiếp tục bài học. Em vui lòng đợi trong giây lát.',
  },
  MODEL_NOT_FOUND: {
    message: 'Mô hình AI được chọn hiện không khả dụng (404 Not Found).',
    userHelp: 'Hệ thống đã tự động chuyển sang mô hình ổn định tiếp theo trong chuỗi dự phòng.',
  },
  RATE_LIMIT: {
    message: 'Đã hết hạn mức hoặc vượt tần suất gọi API (429 Rate Limit).',
    userHelp: 'Hệ thống đang tự động thử xoay sang API Key tiếp theo. Em cũng có thể nhập thêm key dự phòng trong phần Cài đặt.',
  },
  NETWORK_ERROR: {
    message: 'Lỗi kết nối mạng.',
    userHelp: 'Không thể kết nối đến máy chủ Google AI. Em vui lòng kiểm tra đường truyền Wi-Fi / 4G và thử lại.',
  },
  IMAGE_TOO_LARGE: {
    message: 'Kích thước ảnh vượt quá giới hạn.',
    userHelp: 'Em vui lòng chọn ảnh dung lượng nhỏ hơn để đảm bảo tốc độ xử lý nhanh nhất.',
  },
  UNSUPPORTED_IMAGE: {
    message: 'Định dạng hình ảnh không được hỗ trợ.',
    userHelp: 'Hệ thống hỗ trợ các tệp ảnh JPG, PNG, WEBP, GIF. Em vui lòng chọn lại ảnh nhé.',
  },
  SERVER_ERROR: {
    message: 'Quá trình xử lý câu hỏi gặp sự cố.',
    userHelp: 'Đã xảy ra lỗi trong quá trình xử lý. Em có thể bấm "Thử lại câu hỏi này" hoặc đổi sang câu hỏi khác.',
  },
  SHEETS_ERROR: {
    message: 'Không thể ghi nhật ký học tập vào Google Sheets.',
    userHelp: 'Đường dẫn Google Sheets Web App không phản hồi, tuy nhiên bài học vẫn diễn ra bình thường.',
  },
};

export function parseApiError(error: unknown): AppError {
  const errStr = String(error instanceof Error ? error.message : error || '');
  const serialized = JSON.stringify(error) || '';
  const combined = (errStr + ' ' + serialized).toLowerCase();

  let type: ErrorType = 'SERVER_ERROR';

  // 1. Quota & Rate Limit (429)
  if (
    combined.includes('429') ||
    combined.includes('resource_exhausted') ||
    combined.includes('quota') ||
    combined.includes('rate limit')
  ) {
    type = 'RATE_LIMIT';
  }
  // 2. Model Overloaded (503 / 500 / 504 / high demand)
  // Theo api.md: 500 INTERNAL được phép chuyển model (fallback)
  else if (
    combined.includes('503') ||
    combined.includes('unavailable') ||
    combined.includes('high demand') ||
    combined.includes('overloaded') ||
    combined.includes('temporarily unavailable') ||
    combined.includes('try again later') ||
    combined.includes('504') ||
    combined.includes('deadline_exceeded') ||
    combined.includes('internal server error') ||
    /\b500\b/.test(combined)
  ) {
    type = 'MODEL_OVERLOADED';
  }
  // 3. Permission Denied (403)
  else if (combined.includes('403') || combined.includes('permission_denied') || combined.includes('permission denied')) {
    type = 'PERMISSION_DENIED';
  }
  // 4. Invalid API Key / Auth (401)
  else if (
    combined.includes('api_key_invalid') ||
    combined.includes('api key not valid') ||
    combined.includes('unauthenticated') ||
    combined.includes('401') ||
    combined.includes('invalid api key')
  ) {
    type = 'INVALID_API_KEY';
  }
  // 5. Model Not Found (404)
  else if (combined.includes('404') || combined.includes('not_found') || combined.includes('not found')) {
    type = 'MODEL_NOT_FOUND';
  }
  // 6. Network Error
  else if (
    combined.includes('fetch') ||
    combined.includes('network') ||
    combined.includes('failed to fetch') ||
    combined.includes('econnrefused')
  ) {
    type = 'NETWORK_ERROR';
  }
  // 7. Abort / Cancel
  else if (combined.includes('abort') || combined.includes('canceled') || combined.includes('cancelled')) {
    return {
      type: 'SERVER_ERROR',
      message: 'Yêu cầu đã được dừng bởi người dùng.',
      userHelp: 'Em đã bấm nút dừng tạo câu trả lời.',
      details: errStr,
    };
  }

  const base = ERROR_MESSAGES[type];
  return {
    type,
    message: base.message,
    userHelp: base.userHelp,
    details: errStr,
  };
}
