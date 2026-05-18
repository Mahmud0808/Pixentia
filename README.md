# ⚡ Pixentia Studio

**Pixentia Studio** is a complete, production-ready desktop application built with modern Electron architecture, Node.js, React 19, Vite, and Tailwind CSS. It is designed as a premium developer tool with clean separation of UI, logic, and backend services.

---

## 🚀 Key Features & Capabilities

### 1. Image → WebP Compressor Tool
* **Multi-Format Input:** Drag & drop or select JPG, PNG, JPEG, WEBP, BMP, TIFF, AVIF, SVG, and ICO files.
* **Granular Compression Control:** Premium interactive slider (1–100%) with real-time value display and persistent storage.
* **Advanced Output Management:** Download individual optimized WebP files or instantly bundle all processed assets into a single ZIP archive.
* **Visual Polish:** Dynamic file cards displaying preview thumbnails, original size, compressed size, and percentage change with intuitive green (reduced) and red (increased) indicators.

### 2. Universal Any File → Base64 Converter Tool
* **File Type Agnostic:** Accepts any file format (Images, Videos, PDFs, Documents, Audio, Fonts, Archives).
* **Smart Previews:** Shows high-fidelity image thumbnails for visual assets and appropriate professional file-type icons for documents, videos, and archives.
* **MIME-Qualified Output:** Generates fully qualified Data URI Base64 strings (`data:[mime];base64,...`).
* **Developer Ergonomics:** Provides a prominent "Copy Base64" button with visual clipboard confirmation, alongside collapsible textareas for manual inspection and selection.
* **Customizable Output Formatting:** Features dedicated settings to remove MIME qualifiers, apply custom template strings (e.g., `<img src="$base64" />`), and enable single-click batch copying of all processed strings.

### 3. Sequential Combined Mode (Compress + Base64 Pipeline)
* **Automated Workflow:** Integrates both tools into a seamless two-step pipeline.
* **Intelligent Execution:** Automatically detects image assets, compresses them to WebP using the selected quality threshold, and converts the resulting highly optimized WebP binary into a Base64 Data URI. Non-image files are intelligently routed directly to the Base64 encoder.

### 4. Animated GIF → Lossless Spritesheet Converter Tool
* **Native GIF Parsing:** Automatically extracts frame count, frame rate (FPS), total duration, and original frame dimensions instantly upon loading.
* **Aspect-Locked Dimension Synchronization:** Modify total spritesheet dimensions or individual frame sizes with real-time, two-way proportional synchronization. Ensures exact integer frame scaling for pixel-perfect game engine alignment.
* **Custom Grid Layout:** Real-time adjustment of horizontal grid columns count with custom app-themed stepper controls.
* **Lossless PNG Export:** Composites animated frames onto a transparent canvas and exports them as pristine, uncompressed PNG spritesheets preserving 100% original visual fidelity.
* **Intelligent Conflict Resolution:** Preserves original filenames while automatically appending Windows-style `(1)`, `(2)` conflict counters to prevent accidental overwrites.

### 5. Advanced Queue Management & Persistence
* **Non-Destructive Queuing:** Dragging and dropping additional files appends them to the active queue without overwriting existing items.
* **Automatic Duplicate Prevention:** Prevents identical file paths from being queued multiple times in the same session.
* **Persistent Preferences:** Automatically saves compression quality, custom output directory, theme selection (Light/Dark), and auto-ZIP preferences across application restarts using an IPC-backed JSON store service.

---

## 🏗️ Architecture & Tech Stack

```
pixentia/
├── electron/
│   ├── main.ts          # Main Process: Window management, IPC services, Sharp & Archiver engines
│   └── preload.ts       # Preload Script: Secure contextBridge exposure of electronAPI
├── src/
│   ├── components/      # Modular React UI Components (Header, DropZone, FileCard, SettingsModal)
│   ├── types/           # TypeScript Domain Models & IPC Interfaces
│   ├── App.tsx          # Core Application State & View Routing
│   ├── main.tsx         # React DOM Entry
│   └── index.css        # Tailwind CSS & Custom Component Layers
├── package.json         # Dependencies & Electron Builder Configuration
├── vite.config.ts       # Vite & Electron Plugin Build Pipeline
└── tailwind.config.js   # Design System & Dark Mode Configuration
```

* **Core Framework:** Electron JS (v41) & Node.js
* **Frontend:** React 19 & TypeScript
* **Build Tool:** Vite 5 + `vite-plugin-electron`
* **Styling & UI:** Tailwind CSS v3 + Lucide React Icons
* **Engines:** `sharp` (High-performance image processing), `archiver` (ZIP bundling), `fs-extra` (Filesystem operations)

---

## 🛠️ Installation & Running Locally

### Prerequisites
* **Node.js:** v20.19+ or v22.12+ (Recommended)
* **Git** (optional, for cloning)

### 1. Clone or Open the Project Directory
Navigate to the root directory where Pixentia is scaffolded:
```bash
cd Pixentia
```

### 2. Install Dependencies
Install all required NPM packages, including native modules and dev dependencies:
```bash
npm install
```

### 3. Run the Development Server
Launch the application in development mode with live hot-reloading for both the React frontend and Electron main process:
```bash
npm run dev
```

---

## 📦 Production Build Instructions

Pixentia comes pre-configured with `electron-builder` to generate standalone, production-grade executables and installers for Windows and macOS.

### Building for Windows (NSIS Installer & Portable EXE)
To build the Windows production binaries, run:
```bash
npm run build:electron
```
* **Output Location:** `dist-electron-build/`
* **Artifacts Generated:** `Pixentia Setup [version].exe` (Full Installer) and `Pixentia [version].exe` (Portable Executable).

### Building for macOS (DMG & ZIP)
To build for macOS (on a Mac environment), run:
```bash
npm run build:electron
```
* **Output Location:** `dist-electron-build/`
* **Artifacts Generated:** `Pixentia-[version].dmg` (Disk Image) and `Pixentia-[version]-mac.zip`.

> **Note on Native Dependencies:** `electron-builder` is explicitly configured to unpack `sharp` binaries (`asarUnpack`), ensuring pristine performance and compatibility in production packages without missing native binding errors.

---

## 🎨 Design System & Theme Support
Pixentia features first-class support for both **Dark Mode** (sleek `#121214` obsidian backgrounds with glassmorphism panels) and **Light Mode** (clean `#f8fafc` soft layouts). Themes can be toggled instantly from the top navigation bar and are persisted automatically.
