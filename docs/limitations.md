# Giới hạn của snapshot

- Nguồn: cấu hình và script trên máy nguồn khi đóng gói; không chứa trạng thái
  phiên chạy, credential hay baseline Codex. Model có thể phụ thuộc tài khoản.
- Paseo 0.11.2; Antigravity CLI 1.5.13. Patch dựng lại từ bản gốc lưu trước khi
  sửa và code đang cài, cần kiểm tra với đúng build trước khi dùng.
- Patch có thể mất khi nâng cấp npm/Paseo. Đây không phải plugin upstream được
  bảo đảm tương thích. Repo không phân phối toàn bộ server hoặc binary.
- Guard kiểm tra quyền tạo và menu từ config. Nó không phải sandbox, không
  ngăn một process full-access gọi CLI ngoài Paseo, và không bảo đảm khóa mọi
  thay đổi model sau khi tạo.
- Codex Supervisor đặt auto-compact 300.000 tokens. Context thực tế của model
  vẫn là giới hạn trên; không tự nâng context của model nhỏ hơn ngưỡng này.
- Chưa có cấu hình 300k đã xác minh cho các role Antigravity. Không đưa biến
  override không có bằng chứng hiệu lực vào bản đóng gói.
- Browser tools tắt global trong fragment. Quyền các tool khác lấy đúng từ
  snapshot; không suy ra tổng số tool bằng cách đếm chuỗi disabledTools.
- Shared docs là phân quyền qua instruction, không phải quyền filesystem.
  Notebook chỉ có mẫu; incident thật được giữ ngoài repo.
- Instructions gốc được giữ lại, gồm các đề cập dự phòng về provider khác.
  Những đề cập đó không bật provider ngoài bốn provider SLP trong fragment;
  khi có xung đột, đối chiếu menu thực và hỏi Human, không tự mở rộng quyền.
- Hai launcher còn hỗ trợ tên role lead/peer như bản nguồn, nhưng repo chỉ cung
  cấp overlay Codex Supervisor. Không dùng chúng để tạo Codex Lead/Peer mà
  không có một thay đổi cấu hình được Human phê duyệt.
- Chỉ kiểm tra cấu trúc, parse config, nguồn snapshot và khả năng áp patch;
  việc đóng gói không đồng nghĩa đã test E2E trên máy mới hoặc chạy inference.
