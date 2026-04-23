# Field Officer Task Management - Workflow & Architecture

## 🔄 Field Officer Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIELD OFFICER LOGIN                           │
│                                                                   │
│  Email: ahmad.sutrisno@example.com                              │
│  Password: Ahmad123!@#                                          │
│  Role: field_officer (from auth.jwt() app_metadata)             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SIDEBAR MENU FILTERING                        │
│                                                                   │
│  ✅ "Penugasan Saya" - NEW FIELD OFFICER MENU                  │
│  ❌ "Dashboard" - Hidden (Admin only)                           │
│  ❌ "Manajemen Aset" - Hidden (Admin only)                      │
│  ❌ "Data Master" - Hidden (Admin only)                         │
│  ✅ "Lapor Kerusakan" - Visible (Public feature)                │
│  ✅ "Lacak Kerusakan" - Visible (Public feature)                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              FIELD OFFICER TASKS PAGE                            │
│         (src/pages/FieldOfficerTasksPage.jsx)                   │
│                                                                   │
│  ┌─ STATISTICS ─────────────────────────────────────┐          │
│  │  📊 Total: 5    📝 Pending: 1    ⚙️ In Progress: 2  │          │
│  │  ✅ Completed: 1    ❌ Cancelled: 1               │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                   │
│  ┌─ FILTERS & SEARCH ────────────────────────────────┐          │
│  │  [Filter by Status] [Search by task name]         │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                   │
│  ┌─ TASK LIST ───────────────────────────────────────┐          │
│  │  1. [🔧] Replace Water Pump - Assigned   📍 LOC1 │          │
│  │  2. [⚙️] Fix Pipe Leak - In Progress    📍 LOC2  │          │
│  │  3. [📋] Inspect Street Lights - Pending 📍 LOC3 │          │
│  │  ...                                              │          │
│  └────────────────────────┬────────────────────────┘          │
│                            │                                    │
│                   [Click to view details]                       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              TASK DETAIL MODAL                                   │
│                                                                   │
│  Task: Replace Water Pump                                        │
│  Status: Assigned                                                │
│  Location: Zone 1 - Main Street                                 │
│  Assigned Date: 2024-01-15                                       │
│  Due Date: 2024-01-20                                            │
│  Priority: High                                                  │
│                                                                   │
│  ┌─ UPDATE STATUS ───────────────────────────────┐             │
│  │  Current: [assigned ▼]  → [assigned]           │             │
│  │                            [in_progress]        │             │
│  │                            [completed]          │             │
│  │                            [cancelled]          │             │
│  └───────────────────────────────────────────────┘             │
│                                                                   │
│  ┌─ ADD FIELD NOTES ─────────────────────────────┐             │
│  │  [Textarea for officer observations]           │             │
│  │  "Pump needs replacement, valve intact..."     │             │
│  └───────────────────────────────────────────────┘             │
│                                                                   │
│  ┌─ UPLOAD PROGRESS PHOTO ───────────────────────┐             │
│  │  [📷 Choose File] [Preview Image]              │             │
│  │  Max: 10MB | Format: JPEG, PNG, GIF, WebP     │             │
│  └───────────────────────────────────────────────┘             │
│                                                                   │
│  ┌─ PROGRESS HISTORY ────────────────────────────┐             │
│  │  2024-01-15 10:30 → assigned by admin          │             │
│  │  2024-01-15 11:00 → in_progress by ahmad       │             │
│  │                     📸 Photo: pump_1.jpg        │             │
│  │                     📝 Notes: "Pump being...    │             │
│  │  2024-01-15 12:30 → in_progress by ahmad       │             │
│  │                     📸 Photo: pump_2.jpg        │             │
│  └───────────────────────────────────────────────┘             │
│                                                                   │
│               [✅ Update] [❌ Cancel]                            │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATA FLOW & STORAGE                                 │
│                                                                   │
│  1. FORM SUBMISSION                                              │
│     └─ Update Status: pending → in_progress                     │
│     └─ Field Notes: "Pump being replaced..."                    │
│     └─ Photo File: pump_1.jpg                                   │
│                                                                   │
│  2. SERVICE LAYER (fieldOfficerTaskService.js)                   │
│     └─ uploadProgressPhoto(taskId, file)                        │
│        ├─ Uploads to: maintenance-progress/TASK_ID/FILENAME     │
│        └─ Returns: signed URL                                   │
│     └─ updateTaskStatus(taskId, status, notes, photoUrl)        │
│        ├─ Inserts row in task_progress table                    │
│        └─ Updates maintenance_tasks (status, notes, timestamp)   │
│                                                                   │
│  3. DATABASE UPDATES                                             │
│     ├─ task_progress (NEW ROW INSERTED)                         │
│     │  ├─ id: UUID                                              │
│     │  ├─ task_id: Parent task UUID                             │
│     │  ├─ officer_id: Current user UUID                         │
│     │  ├─ status: in_progress                                   │
│     │  ├─ notes: "Pump being replaced..."                       │
│     │  ├─ photo_url: https://...maintenance-progress/.../...    │
│     │  └─ created_at: 2024-01-15 11:00:00 UTC                   │
│     │                                                             │
│     └─ maintenance_tasks (UPDATED)                               │
│        ├─ status: in_progress                                   │
│        ├─ notes: "Pump being replaced..."                       │
│        ├─ last_status_update: 2024-01-15 11:00:00               │
│        └─ last_officer_notes: "Pump being replaced..."          │
│                                                                   │
│  4. STORAGE (maintenance-progress bucket)                        │
│     └─ File: maintenance-progress/TASK_ID/FILE.jpg              │
│        ├─ Max size: 10MB                                        │
│        ├─ Formats: JPEG, PNG, GIF, WebP                         │
│        └─ Public access (for display)                           │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Sidebar.jsx (Role-based menu filtering)                         │
│       │                                                          │
│       ├─ if isFieldOfficer: show "Penugasan Saya"               │
│       └─ hide admin menus                                        │
│                                                                   │
│  App.jsx (Routing)                                               │
│       │                                                          │
│       └─ case 'officer-tasks':                                   │
│            └─ render <FieldOfficerTasksPage />                   │
│                                                                   │
│  FieldOfficerTasksPage.jsx (UI Component)                        │
│       │                                                          │
│       ├─ Load tasks via fieldOfficerTaskService.getOfficerTasks()│
│       ├─ Display task list & statistics                         │
│       ├─ Handle status updates                                  │
│       ├─ Handle photo upload                                    │
│       └─ Display progress history                               │
│                                                                   │
│  fieldOfficerTaskService.js (Service Layer)                      │
│       │                                                          │
│       ├─ getOfficerTasks(officerId)                              │
│       ├─ getTaskDetails(taskId, officerId)                       │
│       ├─ updateTaskStatus(...)                                  │
│       ├─ uploadProgressPhoto(taskId, file)                       │
│       ├─ getOfficerTaskStats(officerId)                          │
│       └─ getTaskProgressHistory(taskId)                          │
│                                                                   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ HTTP/RPC Calls
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│              SUPABASE BACKEND                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔐 Authentication (auth.users)                                  │
│     └─ role: field_officer (in app_metadata)                    │
│                                                                   │
│  📊 Tables (with RLS policies)                                   │
│     ├─ maintenance_tasks                                         │
│     │  ├─ id, title, description, location                      │
│     │  ├─ assigned_to (officer_id)                              │
│     │  ├─ status (pending → in_progress → completed)            │
│     │  ├─ notes, last_status_update, last_officer_notes         │
│     │  └─ RLS: Officers see own tasks, admins see all           │
│     │                                                             │
│     └─ task_progress (NEW - Progress History)                    │
│        ├─ id, task_id, officer_id                               │
│        ├─ status, notes, photo_url, created_at                  │
│        ├─ Tracks EVERY update (full audit trail)                │
│        └─ RLS: Officers see own progress, admins see all        │
│                                                                   │
│  🪣 Storage Buckets                                              │
│     └─ maintenance-progress/ (NEW)                               │
│        ├─ Stores progress photos                                │
│        ├─ Path: maintenance-progress/TASK_ID/FILENAME           │
│        ├─ Public access: yes                                    │
│        └─ Max file: 10MB each                                   │
│                                                                   │
│  🔒 RLS Policies                                                 │
│     ├─ Officers can view/insert their own progress              │
│     ├─ Admins can view all progress                             │
│     ├─ No delete access (audit trail protection)                │
│     └─ Storage policies: officers upload their own              │
│                                                                   │
│  ⚙️ Database Functions                                           │
│     └─ update_maintenance_task_status(task_id, status, notes)   │
│        ├─ Validates officer owns task                           │
│        ├─ Inserts progress record                               │
│        ├─ Updates task status                                   │
│        └─ Returns success/error JSON                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## 🔐 Security Model

```
FIELD OFFICER ACCESS:
├─ Can view ONLY their own assigned tasks
├─ Can update ONLY tasks assigned to them
├─ Can view their own progress history
├─ Cannot delete task progress (audit trail)
├─ Can upload photos only to their tasks
└─ Photos stored in: maintenance-progress/TASK_ID/...

ADMIN ACCESS:
├─ Can view ALL tasks
├─ Can view ALL progress history
├─ Can assign/reassign tasks
├─ Can view all officer progress
├─ Can monitor task completion
└─ Full audit trail access

RLS POLICY ENFORCEMENT:
├─ Middleware: auth.uid() verified before queries
├─ Database: Row-level security on select/insert/update
├─ Storage: Bucket policies enforce upload authorization
├─ Functions: SECURITY DEFINER with role checks
└─ Audit: Complete progress history in task_progress table
```

## 🧪 Data Flow Example

**Field Officer Updates Task Status:**

```
USER ACTION: Click "Mark as In Progress" button
       │
       ▼
React Form Handler (FieldOfficerTasksPage.jsx)
       │
       ├─ Collect: status="in_progress", notes="Starting work..."
       ├─ Upload: photo file via uploadProgressPhoto()
       │
       ▼
fieldOfficerTaskService.uploadProgressPhoto()
       │
       ├─ Call: supabase.storage.from('maintenance-progress').upload()
       ├─ Returns: photoUrl = "maintenance-progress/TASK_ID/FILE.jpg"
       │
       ▼
fieldOfficerTaskService.updateTaskStatus()
       │
       ├─ Call: supabase.rpc('update_maintenance_task_status', {
       │         p_task_id: UUID,
       │         p_status: 'in_progress',
       │         p_notes: 'Starting work...',
       │         p_photo_url: photoUrl
       │       })
       │
       ▼
Supabase RPC Function (PostgreSQL)
       │
       ├─ Verify: officer_id = auth.uid()
       ├─ Verify: task.assigned_to = auth.uid()
       │
       ├─ Execute:
       │   INSERT INTO task_progress (task_id, officer_id, status, notes, photo_url)
       │   VALUES (p_task_id, auth.uid(), 'in_progress', 'Starting work...', photoUrl)
       │
       │   UPDATE maintenance_tasks
       │   SET status = 'in_progress',
       │       notes = 'Starting work...',
       │       last_status_update = now(),
       │       last_officer_notes = 'Starting work...'
       │   WHERE id = p_task_id
       │
       ▼
DATABASE RESULT:
├─ ✅ New row in task_progress with full details
├─ ✅ maintenance_tasks updated with new status
├─ ✅ Photo in storage bucket
└─ ✅ Timestamps recorded

       ▼
Response returned to React
       │
       ▼
UI Updates:
├─ Task list shows new status "In Progress"
├─ Progress history shows new entry with photo
├─ Form closes/modal updates
└─ User sees confirmation
```

## 📈 Performance Considerations

```
INDEXES CREATED:
├─ task_progress_task_id_idx
│  └─ Fast lookup of all updates for a task
├─ task_progress_officer_id_idx
│  └─ Fast lookup of all tasks updated by officer
└─ task_progress_created_at_idx
   └─ Fast chronological queries

QUERY OPTIMIZATION:
├─ RLS filters at database level (not app level)
├─ Index on task_id for progress lookups
├─ Pagination recommended for large task lists
└─ Consider caching task stats client-side

STORAGE OPTIMIZATION:
├─ Photos up to 10MB (resize on upload recommended)
├─ Public bucket (no auth needed to view)
├─ Consider CDN for photo delivery
└─ Archive old photos to reduce costs
```
