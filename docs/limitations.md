# Giới hạn của bộ cấu hình

- **Phạm vi đóng gói:** Không chứa credential, baseline `~/.codex/config.toml`,
  trạng thái phiên chạy hay incident thật trong `supervisor_notebook.md`.
- **Phụ thuộc phiên bản:** Kiểm chứng trên Paseo `0.11.2` và Antigravity CLI
  `1.5.13`. Patch server có thể mất khi nâng cấp npm/Paseo và cần kiểm tra lại
  bằng `python3 scripts/slp.py doctor` / `git apply --check`.
- **Không phải sandbox bảo mật tuyệt đối:** Admission policy kiểm soát các entry
  point tạo agent của Paseo, và `antigravity/hooks/slp-guard.mjs` (`PreToolUse`)
  chặn cứng native subagent/swarm/workflow, ghi `~/shared` và `git push` trong
  Antigravity khi `SLP_ROLE` được đặt. Tuy nhiên, tiến trình vẫn chạy với
  `--dangerously-skip-permissions` / `danger-full-access` nên các lớp này là
  guardrail vận hành chống drift/nhầm lẫn, không thay thế OS sandbox hay
  container isolation trước mã độc chủ đích.
- **Ngưỡng auto-compact 300.000 tokens:** Chỉ áp dụng cấu hình cứng cho
  `codex-supervisor`; context thực tế của model vẫn là giới hạn trên. Các role
  Antigravity dựa vào quy tắc context hygiene trong prompt và hành vi compact
  của runtime.
- **Phân quyền `shared/`:** Antigravity được chặn ghi `~/shared` bằng
  `slp-guard.mjs` (cho phép Supervisor append `supervisor_notebook.md`), còn
  Codex Supervisor vẫn dựa vào quy ước instruction (hoặc cần bổ sung hook tương
  đương nếu muốn khóa ở tầng CLI).
- **Phạm vi kiểm thử tự động:** Bộ test trong `tests/` (chạy cả trong GitHub
  Actions CI) kiểm chứng consistency toàn repo, `scripts/slp.py render` &
  `check-live`, `codex-room`/`codex-room-sync` (cô lập concurrent + chống đệ quy
  + dọn runtime cũ), mọi nhánh của `slp-delegation-policy.js`, và mọi luật của
  `slp-guard.mjs`. Chưa chạy E2E inference trực tiếp qua tài khoản LLM thật
  trong CI.
