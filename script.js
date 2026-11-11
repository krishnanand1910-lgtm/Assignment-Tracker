/**
 * ============================================================================
 * Daily Homework & Lab Assignment Submission Deadline Tracking System
 * File: script.js
 * 
 * Technology: Pure JavaScript (Vanilla JS - Beginner Friendly)
 * Description: Handles assignment creation, LocalStorage persistence,
 *              deadline urgency calculations, status updates, filtering,
 *              search, and responsive dashboard statistics.
 * ============================================================================
 */

// ============================================================================
// 1. GLOBAL VARIABLES & STATE
// ============================================================================

// Key used to store assignments in the browser's LocalStorage
const STORAGE_KEY = "homework_tracker_assignments";

// In-memory array that holds all assignment objects
let assignments = [];

// DOM Element References (Cached for easy reuse and better performance)
const assignmentsGrid = document.getElementById("assignmentsGrid");
const emptyState = document.getElementById("emptyState");
const resultsCount = document.getElementById("resultsCount");
const navDateText = document.getElementById("navDateText");

// Dashboard Stat Elements
const statTotalCount = document.getElementById("statTotalCount");
const statPendingCount = document.getElementById("statPendingCount");
const statProgressCount = document.getElementById("statProgressCount");
const statCompletedCount = document.getElementById("statCompletedCount");
const statOverdueCount = document.getElementById("statOverdueCount");

// Filter & Search Elements
const searchInput = document.getElementById("searchInput");
const filterSubject = document.getElementById("filterSubject");
const filterStatus = document.getElementById("filterStatus");
const filterPriority = document.getElementById("filterPriority");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");

// Modal & Form Elements
const assignmentModal = document.getElementById("assignmentModal");
const assignmentForm = document.getElementById("assignmentForm");
const modalTitle = document.getElementById("modalTitle");
const saveBtnText = document.getElementById("saveBtnText");
const assignmentIdInput = document.getElementById("assignmentId");
const subjectNameInput = document.getElementById("subjectName");
const assignmentTitleInput = document.getElementById("assignmentTitle");
const dueDateInput = document.getElementById("dueDate");
const submissionModeInput = document.getElementById("submissionMode");
const priorityInput = document.getElementById("priority");
const statusInput = document.getElementById("status");

// Buttons
const openAddModalBtn = document.getElementById("openAddModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelFormBtn = document.getElementById("cancelFormBtn");
const loadSampleDataBtn = document.getElementById("loadSampleDataBtn");
const emptyStateActionBtn = document.getElementById("emptyStateActionBtn");
const toastContainer = document.getElementById("toastContainer");


// ============================================================================
// 2. DATE & URGENCY HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to generate YYYY-MM-DD formatted date string relative to today.
 * E.g., offsetDays = 0 -> today, 1 -> tomorrow, -2 -> two days ago.
 */
function getDateWithOffset(offsetDays) {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date formatted nicely for the navbar.
 */
function getFormattedToday() {
  const options = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
  return new Date().toLocaleDateString(undefined, options);
}

/**
 * Calculates deadline urgency based on due date and status.
 * Returns urgency type, label text, and border styling class.
 * 
 * Color Codes & Categories:
 * - Overdue: Red / Crimson (Deadline has passed)
 * - Due Today: Red Alert (Remaining time is 0 days)
 * - Due Tomorrow: Amber / Orange (Remaining time is 1 day)
 * - Upcoming: Green (Remaining time is 2+ days)
 * - Completed: Calm Green (Student finished this task)
 */
function calculateUrgency(dueDateString, status) {
  // If the assignment is marked completed, urgency alert is relaxed
  if (status === "Completed") {
    return {
      type: "completed",
      badgeClass: "urgency-completed",
      borderClass: "is-completed",
      label: "Completed",
      daysLeft: null
    };
  }

  // Parse YYYY-MM-DD into local Date object (safely avoids timezone shifts)
  const parts = dueDateString.split("-");
  const dueYear = parseInt(parts[0], 10);
  const dueMonth = parseInt(parts[1], 10) - 1;
  const dueDay = parseInt(parts[2], 10);
  const dueDate = new Date(dueYear, dueMonth, dueDay);

  // Normalize today's date to midnight for an accurate day-level comparison
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Difference in milliseconds converted to whole days
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      type: "overdue",
      badgeClass: "urgency-overdue",
      borderClass: "border-overdue",
      label: overdueDays === 1 ? "Overdue (1 day late)" : `Overdue (${overdueDays} days late)`,
      daysLeft: diffDays
    };
  } else if (diffDays === 0) {
    return {
      type: "today",
      badgeClass: "urgency-today",
      borderClass: "border-today",
      label: "Due Today!",
      daysLeft: 0
    };
  } else if (diffDays === 1) {
    return {
      type: "tomorrow",
      badgeClass: "urgency-tomorrow",
      borderClass: "border-tomorrow",
      label: "Due Tomorrow",
      daysLeft: 1
    };
  } else {
    return {
      type: "upcoming",
      badgeClass: "urgency-upcoming",
      borderClass: "border-upcoming",
      label: `Upcoming (${diffDays} days left)`,
      daysLeft: diffDays
    };
  }
}

/**
 * Formats a YYYY-MM-DD string into a clean readable date: "Nov 15, 2026"
 */
function formatDisplayDate(dateString) {
  if (!dateString) return "No date";
  const parts = dateString.split("-");
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}


// ============================================================================
// 3. SAMPLE DATA GENERATOR
// ============================================================================

/**
 * Returns a realistic starter kit of assignments for college students.
 * Dates are dynamically generated relative to today so the demo is always fresh!
 */
function getInitialSampleData() {
  return [
    {
      id: 101,
      subject: "Operating Systems",
      title: "Lab 4: CPU Scheduling Algorithms (Round Robin & SJF in C)",
      dueDate: getDateWithOffset(0), // DUE TODAY (Red Alert)
      submissionMode: "Online",
      priority: "High",
      status: "In Progress"
    },
    {
      id: 102,
      subject: "Database Management Systems",
      title: "SQL Assignment 3: Complex Joins, Views & Stored Procedures",
      dueDate: getDateWithOffset(1), // DUE TOMORROW (Amber Alert)
      submissionMode: "Online",
      priority: "High",
      status: "Not Started"
    },
    {
      id: 103,
      subject: "Computer Networks",
      title: "Physical Lab Record: Socket Programming & Subnetting Topology",
      dueDate: getDateWithOffset(3), // UPCOMING (Green)
      submissionMode: "Physical Record",
      priority: "Medium",
      status: "In Progress"
    },
    {
      id: 104,
      subject: "Data Structures & Algorithms",
      title: "Homework 5: Binary Search Tree Balancing & AVL Rotations",
      dueDate: getDateWithOffset(-2), // OVERDUE
      submissionMode: "Physical Record",
      priority: "High",
      status: "Not Started"
    },
    {
      id: 105,
      subject: "Web Technologies",
      title: "Mini Project: Responsive Portfolio Website using HTML & CSS",
      dueDate: getDateWithOffset(6), // UPCOMING (Green)
      submissionMode: "Online",
      priority: "Low",
      status: "Completed"
    },
    {
      id: 106,
      subject: "Software Engineering",
      title: "UML Diagrams: Sequence & Activity Diagrams for Library System",
      dueDate: getDateWithOffset(10), // UPCOMING (Green)
      submissionMode: "Physical Record",
      priority: "Medium",
      status: "Not Started"
    }
  ];
}


// ============================================================================
// 4. LOCALSTORAGE FUNCTIONS
// ============================================================================

/**
 * Loads assignments from LocalStorage.
 * If empty, loads initial realistic sample data.
 */
function loadAssignments() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      assignments = JSON.parse(savedData);
    } catch (e) {
      console.error("Error parsing LocalStorage data, loading sample data:", e);
      assignments = getInitialSampleData();
      saveAssignments();
    }
  } else {
    // First time opening app: load sample assignments
    assignments = getInitialSampleData();
    saveAssignments();
  }
}

/**
 * Saves current assignments array into LocalStorage.
 */
function saveAssignments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}


// ============================================================================
// 5. DASHBOARD STATS CALCULATION
// ============================================================================

/**
 * Calculates and updates dashboard cards with current metrics:
 * Total, Pending (Not Started), In Progress, Completed, Overdue.
 */
function updateDashboardStats() {
  const total = assignments.length;
  let pendingCount = 0;
  let progressCount = 0;
  let completedCount = 0;
  let overdueCount = 0;

  for (let i = 0; i < assignments.length; i++) {
    const item = assignments[i];
    const urgency = calculateUrgency(item.dueDate, item.status);

    if (item.status === "Completed") {
      completedCount++;
    } else {
      if (item.status === "Not Started") {
        pendingCount++;
      } else if (item.status === "In Progress") {
        progressCount++;
      }

      // Check if overdue
      if (urgency.type === "overdue") {
        overdueCount++;
      }
    }
  }

  // Update DOM with smooth text
  statTotalCount.textContent = total;
  statPendingCount.textContent = pendingCount;
  statProgressCount.textContent = progressCount;
  statCompletedCount.textContent = completedCount;
  statOverdueCount.textContent = overdueCount;
}


// ============================================================================
// 6. SUBJECT FILTER POPULATION
// ============================================================================

/**
 * Extracts all unique subject names from assignments and updates the filter dropdown.
 */
function populateSubjectFilter() {
  const currentSelection = filterSubject.value;
  const subjectsSet = new Set();

  assignments.forEach(function (item) {
    if (item.subject && item.subject.trim() !== "") {
      subjectsSet.add(item.subject.trim());
    }
  });

  const subjectsList = Array.from(subjectsSet).sort();

  // Reset dropdown options
  filterSubject.innerHTML = '<option value="all">All Subjects</option>';

  subjectsList.forEach(function (subject) {
    const opt = document.createElement("option");
    opt.value = subject;
    opt.textContent = subject;
    filterSubject.appendChild(opt);
  });

  // Restore previous selection if it still exists
  if (subjectsList.includes(currentSelection)) {
    filterSubject.value = currentSelection;
  } else {
    filterSubject.value = "all";
  }
}


// ============================================================================
// 7. ASSIGNMENT RENDERING & DOM MANIPULATION
// ============================================================================

/**
 * Filters assignments according to active search and dropdown values,
 * sorts them by due date, and generates HTML cards.
 */
function renderAssignments() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedSubject = filterSubject.value;
  const selectedStatus = filterStatus.value;
  const selectedPriority = filterPriority.value;

  // 1. Filter the list
  const filtered = assignments.filter(function (item) {
    // Search match (title or subject)
    const matchesSearch =
      searchTerm === "" ||
      item.title.toLowerCase().includes(searchTerm) ||
      item.subject.toLowerCase().includes(searchTerm);

    // Subject filter
    const matchesSubject = selectedSubject === "all" || item.subject === selectedSubject;

    // Priority filter
    const matchesPriority = selectedPriority === "all" || item.priority === selectedPriority;

    // Status / Urgency filter
    let matchesStatus = true;
    const urgency = calculateUrgency(item.dueDate, item.status);

    if (selectedStatus === "all") {
      matchesStatus = true;
    } else if (selectedStatus === "overdue") {
      matchesStatus = urgency.type === "overdue" && item.status !== "Completed";
    } else {
      matchesStatus = item.status === selectedStatus;
    }

    return matchesSearch && matchesSubject && matchesPriority && matchesStatus;
  });

  // 2. Sort by due date (nearest first)
  filtered.sort(function (a, b) {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // 3. Update Result Count Text
  if (filtered.length === assignments.length) {
    resultsCount.textContent = `Showing all ${assignments.length} assignments`;
  } else {
    resultsCount.textContent = `Showing ${filtered.length} of ${assignments.length} assignments`;
  }

  // 4. Handle Empty State
  if (filtered.length === 0) {
    assignmentsGrid.innerHTML = "";
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  // 5. Render Cards
  let cardsHtml = "";

  filtered.forEach(function (assignment) {
    const urgency = calculateUrgency(assignment.dueDate, assignment.status);
    const isCompleted = assignment.status === "Completed";

    // Priority badge class
    let priorityClass = "priority-medium";
    if (assignment.priority === "High") priorityClass = "priority-high";
    if (assignment.priority === "Low") priorityClass = "priority-low";

    // Submission mode icon
    const isOnline = assignment.submissionMode === "Online";
    const modeIcon = isOnline
      ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
      : `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

    // Status select color class
    let statusSelectClass = "select-notstarted";
    if (assignment.status === "In Progress") statusSelectClass = "select-progress";
    if (assignment.status === "Completed") statusSelectClass = "select-completed";

    cardsHtml += `
      <div class="assignment-card ${urgency.borderClass} ${isCompleted ? 'is-completed' : ''}" data-id="${assignment.id}">
        
        <!-- Header Tags -->
        <div class="card-header-tags">
          <span class="subject-badge" title="${escapeHtml(assignment.subject)}">
            ${escapeHtml(assignment.subject)}
          </span>
          <div class="card-top-right-tags">
            <span class="mode-badge" title="Submission Mode">
              ${modeIcon}
              <span>${escapeHtml(assignment.submissionMode)}</span>
            </span>
            <span class="priority-badge ${priorityClass}">
              ${assignment.priority}
            </span>
          </div>
        </div>

        <!-- Assignment Title & Due Date -->
        <div class="card-body">
          <h3 class="assignment-title" title="${escapeHtml(assignment.title)}">
            ${escapeHtml(assignment.title)}
          </h3>

          <div class="due-date-row">
            <div class="due-date-info">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Due: <strong>${formatDisplayDate(assignment.dueDate)}</strong></span>
            </div>

            <!-- Color-Coded Urgency Indicator -->
            <span class="urgency-badge ${urgency.badgeClass}">
              ${urgency.label}
            </span>
          </div>
        </div>

        <!-- Footer: Status Switcher & Action Buttons -->
        <div class="card-footer">
          <div class="status-control">
            <label for="status-select-${assignment.id}">Status:</label>
            <select 
              id="status-select-${assignment.id}" 
              class="status-select ${statusSelectClass}" 
              onchange="handleQuickStatusChange(${assignment.id}, this.value)"
              title="Change assignment status"
            >
              <option value="Not Started" ${assignment.status === "Not Started" ? "selected" : ""}>Not Started</option>
              <option value="In Progress" ${assignment.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option value="Completed" ${assignment.status === "Completed" ? "selected" : ""}>Completed</option>
            </select>
          </div>

          <div class="card-actions">
            <!-- Edit Button -->
            <button 
              type="button" 
              class="action-btn edit-btn" 
              onclick="openEditAssignmentModal(${assignment.id})" 
              title="Edit assignment"
              aria-label="Edit assignment"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>

            <!-- Delete Button -->
            <button 
              type="button" 
              class="action-btn delete-btn" 
              onclick="handleDeleteAssignment(${assignment.id})" 
              title="Delete assignment"
              aria-label="Delete assignment"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>

      </div>
    `;
  });

  assignmentsGrid.innerHTML = cardsHtml;
}

/**
 * Escapes HTML characters to prevent XSS issues when displaying user input.
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================================
// 8. MODAL & FORM MANAGEMENT (ADD & EDIT)
// ============================================================================

/**
 * Opens modal configured to ADD a brand new assignment.
 */
function openAddAssignmentModal() {
  // Clear form fields
  assignmentForm.reset();
  assignmentIdInput.value = "";

  // Set default due date to tomorrow for convenience
  dueDateInput.value = getDateWithOffset(1);
  submissionModeInput.value = "Online";
  priorityInput.value = "Medium";
  statusInput.value = "Not Started";

  // Update modal titles
  modalTitle.textContent = "Add New Assignment";
  saveBtnText.textContent = "Save Assignment";

  // Display modal
  assignmentModal.classList.add("active");
  assignmentModal.setAttribute("aria-hidden", "false");
  subjectNameInput.focus();
}

/**
 * Opens modal configured to EDIT an existing assignment.
 */
function openEditAssignmentModal(id) {
  // Find assignment by ID
  const item = assignments.find(function (a) {
    return a.id === id;
  });

  if (!item) {
    showToast("Assignment not found!", "danger");
    return;
  }

  // Populate form with existing data
  assignmentIdInput.value = item.id;
  subjectNameInput.value = item.subject;
  assignmentTitleInput.value = item.title;
  dueDateInput.value = item.dueDate;
  submissionModeInput.value = item.submissionMode;
  priorityInput.value = item.priority;
  statusInput.value = item.status;

  // Update modal titles
  modalTitle.textContent = "Edit Assignment";
  saveBtnText.textContent = "Update Assignment";

  // Display modal
  assignmentModal.classList.add("active");
  assignmentModal.setAttribute("aria-hidden", "false");
  assignmentTitleInput.focus();
}

/**
 * Closes the Add / Edit modal.
 */
function closeAssignmentModal() {
  assignmentModal.classList.remove("active");
  assignmentModal.setAttribute("aria-hidden", "true");
  assignmentForm.reset();
}

/**
 * Handles form submission for both Creating and Updating assignments.
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const id = assignmentIdInput.value;
  const subject = subjectNameInput.value.trim();
  const title = assignmentTitleInput.value.trim();
  const dueDate = dueDateInput.value;
  const submissionMode = submissionModeInput.value;
  const priority = priorityInput.value;
  const status = statusInput.value;

  // Basic validation check
  if (!subject || !title || !dueDate) {
    showToast("Please fill in all required fields.", "danger");
    return;
  }

  if (id) {
    // Mode: EDIT existing assignment
    const targetIndex = assignments.findIndex(function (a) {
      return a.id === Number(id);
    });

    if (targetIndex !== -1) {
      assignments[targetIndex].subject = subject;
      assignments[targetIndex].title = title;
      assignments[targetIndex].dueDate = dueDate;
      assignments[targetIndex].submissionMode = submissionMode;
      assignments[targetIndex].priority = priority;
      assignments[targetIndex].status = status;

      saveAssignments();
      populateSubjectFilter();
      updateDashboardStats();
      renderAssignments();
      closeAssignmentModal();
      showToast("Assignment updated successfully!", "success");
    }
  } else {
    // Mode: ADD new assignment
    const newAssignment = {
      id: Date.now(), // Generate unique numeric ID based on timestamp
      subject: subject,
      title: title,
      dueDate: dueDate,
      submissionMode: submissionMode,
      priority: priority,
      status: status
    };

    assignments.push(newAssignment);
    saveAssignments();
    populateSubjectFilter();
    updateDashboardStats();
    renderAssignments();
    closeAssignmentModal();
    showToast("New assignment added successfully!", "success");
  }
}


// ============================================================================
// 9. QUICK STATUS SWITCHER & DELETE ACTIONS
// ============================================================================

/**
 * Updates status when student changes dropdown on the assignment card.
 */
function handleQuickStatusChange(id, newStatus) {
  const item = assignments.find(function (a) {
    return a.id === id;
  });

  if (item) {
    item.status = newStatus;
    saveAssignments();
    updateDashboardStats();
    renderAssignments();

    if (newStatus === "Completed") {
      showToast(`Great job! Completed: "${item.title}"`, "success");
    } else {
      showToast(`Status updated to "${newStatus}"`, "info");
    }
  }
}

/**
 * Deletes an assignment after user confirmation.
 */
function handleDeleteAssignment(id) {
  const item = assignments.find(function (a) {
    return a.id === id;
  });

  const confirmMsg = item
    ? `Are you sure you want to delete assignment:\n"${item.title}"?`
    : "Are you sure you want to delete this assignment?";

  if (window.confirm(confirmMsg)) {
    assignments = assignments.filter(function (a) {
      return a.id !== id;
    });

    saveAssignments();
    populateSubjectFilter();
    updateDashboardStats();
    renderAssignments();
    showToast("Assignment deleted.", "danger");
  }
}


// ============================================================================
// 10. FILTER & SEARCH HANDLERS
// ============================================================================

/**
 * Clears all active filters and restores full assignment list.
 */
function resetAllFilters() {
  searchInput.value = "";
  filterSubject.value = "all";
  filterStatus.value = "all";
  filterPriority.value = "all";
  renderAssignments();
  showToast("Filters cleared.", "info");
}


// ============================================================================
// 11. TOAST NOTIFICATION SYSTEM
// ============================================================================

/**
 * Displays a non-intrusive floating toast message for feedback.
 * Types: 'success', 'danger', 'info'
 */
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Automatically fade out and remove after 3 seconds
  setTimeout(function () {
    toast.style.opacity = "0";
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}


// ============================================================================
// 12. INITIALIZATION & EVENT LISTENERS
// ============================================================================

function initializeApp() {
  // Set current date in navbar
  if (navDateText) {
    navDateText.textContent = getFormattedToday();
  }

  // Load assignments from LocalStorage (or sample data on first run)
  loadAssignments();

  // Populate dynamic subjects dropdown
  populateSubjectFilter();

  // Calculate and display dashboard counters
  updateDashboardStats();

  // Render cards
  renderAssignments();

  // Event Listeners for Filters
  searchInput.addEventListener("input", renderAssignments);
  filterSubject.addEventListener("change", renderAssignments);
  filterStatus.addEventListener("change", renderAssignments);
  filterPriority.addEventListener("change", renderAssignments);
  resetFiltersBtn.addEventListener("click", resetAllFilters);

  // Modal Open/Close Events
  openAddModalBtn.addEventListener("click", openAddAssignmentModal);
  closeModalBtn.addEventListener("click", closeAssignmentModal);
  cancelFormBtn.addEventListener("click", closeAssignmentModal);
  emptyStateActionBtn.addEventListener("click", openAddAssignmentModal);

  // Close modal when clicking outside the dialog window
  assignmentModal.addEventListener("click", function (e) {
    if (e.target === assignmentModal) {
      closeAssignmentModal();
    }
  });

  // Close modal on Escape key press
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && assignmentModal.classList.contains("active")) {
      closeAssignmentModal();
    }
  });

  // Form Submission Event
  assignmentForm.addEventListener("submit", handleFormSubmit);

  // Load Sample Data Button Event
  loadSampleDataBtn.addEventListener("click", function () {
    if (window.confirm("Reload default sample college assignments? This will replace current items.")) {
      assignments = getInitialSampleData();
      saveAssignments();
      populateSubjectFilter();
      updateDashboardStats();
      renderAssignments();
      showToast("Sample assignment data loaded!", "success");
    }
  });
}

// Run initialize when DOM content is fully loaded
document.addEventListener("DOMContentLoaded", initializeApp);
