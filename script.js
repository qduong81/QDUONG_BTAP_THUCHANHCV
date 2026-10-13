"use strict";

// Dữ liệu khởi tạo. Được phép chỉnh sửa hoặc thêm thuộc tính nếu cần.
const items = [
  {
    "id": 1,
    "title": "Viết báo cáo HTML",
    "dueDate": "2026-10-20",
    "priority": "Cao",
    "status": "pending"
  },
  {
    "id": 2,
    "title": "Ôn Flexbox",
    "dueDate": "2026-10-23",
    "priority": "Trung bình",
    "status": "pending"
  },
  {
    "id": 3,
    "title": "Làm bài DOM",
    "dueDate": "2026-10-19",
    "priority": "Cao",
    "status": "done"
  },
  {
    "id": 4,
    "title": "Đọc tài liệu CSS",
    "dueDate": "2026-10-25",
    "priority": "Thấp",
    "status": "pending"
  },
  {
    "id": 5,
    "title": "Thiết kế trang cá nhân",
    "dueDate": "2026-10-21",
    "priority": "Trung bình",
    "status": "done"
  }
];

// ---------- Tham chiếu phần tử DOM ----------
const form        = document.querySelector("#task-form");
const titleInput  = document.querySelector("#task-title");
const dueInput    = document.querySelector("#task-due");
const prioInput   = document.querySelector("#task-priority");
const formError   = document.querySelector("#form-error");
const searchInput = document.querySelector("#search-input");
const statusSel   = document.querySelector("#status-filter");
const listEl      = document.querySelector("#task-list");
const emptyEl     = document.querySelector("#empty-state");
const summaryEl   = document.querySelector("#task-summary");

// ---------- Hàm tiện ích ----------
// ID mới = ID lớn nhất hiện có + 1 (không trùng kể cả sau khi xóa)
function getNextId() {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

// "2026-10-20" -> "20/10/2026"
function formatDate(iso) {
  if (!iso) return "Không có hạn";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// "Trung bình" -> "trung-binh" (dùng làm tên class CSS)
function priorityClass(priority) {
  return priority
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-");
}

// Công việc chưa xong và đã quá hạn (so với ngày hôm nay)
function isOverdue(item) {
  if (item.status === "done" || !item.dueDate) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return item.dueDate < today;
}

// Tạo phần tử với class và nội dung chữ (dùng textContent nên an toàn với HTML)
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// ---------- C3: Lấy danh sách sau khi tìm kiếm + lọc trạng thái ----------
function getVisibleItems() {
  const keyword = searchInput.value.trim().toLowerCase(); // không phân biệt hoa/thường
  const status = statusSel.value;

  return items.filter((item) => {
    const matchTitle = item.title.toLowerCase().includes(keyword);
    const matchStatus = status === "all" || item.status === status;
    return matchTitle && matchStatus;
  });
}

// ---------- C1: Hiển thị dữ liệu từ mảng lên DOM ----------
function renderTasks() {
  const visible = getVisibleItems();
  listEl.innerHTML = "";

  visible.forEach((item) => {
    const done = item.status === "done";
    const pClass = priorityClass(item.priority);

    const li = createEl("li", `task-item prio-${pClass}${done ? " is-done" : ""}`);
    li.dataset.id = item.id;

    // Phần thông tin
    const main = createEl("div", "task-main");
    main.append(createEl("h3", "task-title", item.title));

    const meta = createEl("div", "task-meta");
    meta.append(
      createEl("span", "", `Hạn: ${formatDate(item.dueDate)}`),
      createEl("span", `badge badge-${pClass}`, `Ưu tiên ${item.priority}`),
      createEl("span", `badge ${done ? "badge-done" : "badge-pending"}`, done ? "Đã hoàn thành" : "Chưa hoàn thành")
    );
    if (isOverdue(item)) meta.append(createEl("span", "badge badge-overdue", "Quá hạn"));
    main.append(meta);

    // Phần nút thao tác
    const actions = createEl("div", "task-actions");
    const toggleBtn = createEl("button", "btn btn-ghost", done ? "Hoàn tác" : "Hoàn thành");
    toggleBtn.type = "button";
    toggleBtn.dataset.action = "toggle";
    const deleteBtn = createEl("button", "btn btn-danger", "Xóa");
    deleteBtn.type = "button";
    deleteBtn.dataset.action = "delete";
    actions.append(toggleBtn, deleteBtn);

    li.append(main, actions);
    listEl.append(li);
  });

  // Thông báo khi danh sách rỗng
  if (visible.length === 0) {
    emptyEl.hidden = false;
    emptyEl.textContent = items.length === 0
      ? "Chưa có công việc nào. Hãy thêm công việc đầu tiên ở form phía trên."
      : "Không tìm thấy công việc phù hợp với bộ lọc hiện tại.";
  } else {
    emptyEl.hidden = true;
  }

  // Thống kê nhanh
  const doneCount = items.filter((i) => i.status === "done").length;
  summaryEl.textContent =
    `Hiển thị ${visible.length}/${items.length} công việc · ${doneCount} đã xong · ${items.length - doneCount} chưa xong`;
}

// ---------- C2: Đọc form, kiểm tra dữ liệu và thêm bản ghi ----------
function showError(message) {
  formError.textContent = message;
  titleInput.classList.toggle("invalid", Boolean(message));
}

function handleAddTask(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (title === "") {
    showError("Vui lòng nhập tên công việc.");
    titleInput.focus();
    return;
  }

  items.push({
    id: getNextId(),
    title: title,
    dueDate: dueInput.value, // chuỗi rỗng nếu không chọn hạn
    priority: prioInput.value,
    status: "pending"
  });

  // Xóa nội dung form sau khi thêm thành công
  form.reset();
  showError("");
  titleInput.focus();

  // Hiển thị ngay (không tải lại trang). Nếu bộ lọc đang ẩn công việc mới thì
  // đưa bộ lọc về mặc định để người dùng thấy ngay công việc vừa thêm.
  searchInput.value = "";
  if (statusSel.value === "done") statusSel.value = "all";
  renderTasks();
}

// ---------- C4: Cập nhật trạng thái / xóa theo ID ----------
function handleListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.closest(".task-item").dataset.id);

  if (button.dataset.action === "toggle") {
    const item = items.find((i) => i.id === id);
    if (item) item.status = item.status === "done" ? "pending" : "done";
  } else if (button.dataset.action === "delete") {
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) items.splice(index, 1);
  }

  renderTasks();
}

// ---------- Gắn sự kiện ----------
form.addEventListener("submit", handleAddTask);
titleInput.addEventListener("input", () => { if (titleInput.value.trim() !== "") showError(""); });
searchInput.addEventListener("input", renderTasks);
statusSel.addEventListener("change", renderTasks);
listEl.addEventListener("click", handleListClick); // event delegation cho nút Hoàn thành / Xóa

// Hiển thị lần đầu khi mở trang
renderTasks();