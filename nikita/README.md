# Nikita Itkar — Portfolio & Web Utility Suite 🚀

A modern, high-performance developer portfolio and client-side web utility suite built with **React 19**, **Vite**, and modern web APIs. Designed for **Nikita Itkar** (Computer Science & Engineering Student), showcasing front-end engineering expertise, academic projects, real-time computer vision AR filters, and a privacy-first document processing suite.

---

## 🌟 Key Highlights

- **Clean & Responsive UI/UX**: Designed with modern typography, fluid layouts, glassmorphism, and micro-interactions.
- **Privacy-First Architecture**: All photo filtering, AR face tracking, and document conversions run **100% client-side** inside the browser—zero data is sent to external servers.
- **Fast Build & Hot Reload**: Powered by Vite 8 for instant server startup and hot module replacement.

---

## 🧩 Features & Architecture

### 1. 💼 Developer Portfolio
- **Hero & About**: Professional introduction, career objective, and verified profile data.
- **Technical Skills**: Structured breakdown of Web Design & Front-End (HTML5, CSS3, JS ES6+), Programming Languages (Java, C, C++), Database Management (MySQL, JDBC), and Development Tools (Git, GitHub, VS Code, Eclipse, IntelliJ).
- **Academic & Mini Projects**: Comprehensive project showcases with tech stacks, architecture points, and GitHub repository links.
- **Education & Certifications**: Detailed academic milestones and certified course achievements.
- **Contact & Social Connect**: Direct contact form and verified profiles on LinkedIn, GitHub, and Instagram.

### 2. 📸 Interactive AR Photo Studio
- **Face Landmark Tracking**: Powered by `@mediapipe/tasks-vision` for real-time facial landmark detection.
- **20+ Studio & AR Filters**:
  - **Aesthetic Vibes**: Film Grain, Golden Hour, Cyberpunk Neon, Vintage B&W, Emerald Mist, Sunset Glow, and more.
  - **Snapchat-Style AR Overlays**: Puppy Dog, Cute Kitty, Angel Sparkle Crown, Floating Hearts, Thug Shades, Playful Bunny, Rainbow Wave, and Retro 90s Camcorder.
- **Webcam Controls**: Camera flipping (front/back), snapshot capture, canvas freeze preview, and one-click high-resolution image downloads.

### 3. 📄 Client-Side Document & PDF Suite
A full-featured PDF and document manipulation toolkit running completely in-memory:
- **PDF & Resume Viewer**: Multi-page rendering with canvas scaling, zoom in/out, and page stepping via `pdfjs-dist`.
- **PDF to DOCX Converter**: Extracts layout text and structured paragraphs into `.docx` files via `docx`.
- **DOCX to PDF Converter**: Parses Word documents with `mammoth` and renders formatted PDFs using `jspdf`.
- **In-Browser DOCX Editor**: Rich document editing canvas with real-time text formatting and Word document export.
- **PDF Page Tools**: Rotate, reorder, extract, or remove pages using `pdf-lib`.
- **Merge & Split**: Combine multiple PDFs into a unified file or extract specific page ranges.
- **Image & PDF Converters**: Convert multiple JPG/PNG images to a single PDF, or render PDF pages as downloadable images.

---

## 🛠️ Tech Stack & Dependencies

| Category | Technologies |
|---|---|
| **Core Framework** | React 19, React DOM 19 |
| **Build Tool & Bundler** | Vite 8, `@vitejs/plugin-react` |
| **Icons** | Lucide React |
| **Computer Vision / AR** | `@mediapipe/tasks-vision` |
| **PDF Processing** | `pdfjs-dist`, `pdf-lib`, `jspdf` |
| **Word / DOCX Processing**| `docx`, `mammoth` |
| **Package Manager** | `pnpm` / `npm` |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and `pnpm` (or `npm`) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/itkarnikita80-cpu/nikitaitkar-portfolio1.git
   cd nikitaitkar-portfolio1
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start the local development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:5173](http://localhost:5173) to preview the live application.

---

## 📦 Build & Production

To create an optimized production build:

```bash
pnpm build
# or
npm run build
```

The compiled assets will be generated in the `dist/` directory.

To preview the production build locally:
```bash
pnpm preview
# or
npm run preview
```

---

## 📁 Project Structure

```text
├── public/                 # Static assets (portraits, icons, public models)
├── src/
│   ├── components/         # Reusable React components
│   │   ├── About.jsx       # About & background section
│   │   ├── Certifications.jsx # Verified certifications
│   │   ├── Contact.jsx     # Contact form & details
│   │   ├── DocumentTools.jsx # PDF & DOCX utility suite
│   │   ├── Education.jsx   # Academic background
│   │   ├── Footer.jsx      # Footer with quick links & credits
│   │   ├── Hero.jsx        # Landing hero banner
│   │   ├── Navbar.jsx      # Navigation header with smooth scrolling
│   │   ├── PhotoStudio.jsx # Real-time camera & AR filter studio
│   │   ├── Projects.jsx    # Academic & software projects
│   │   ├── Skills.jsx      # Categorized technical skills
│   │   └── SocialIcons.jsx # Verified social media links
│   ├── data/
│   │   └── resumeData.js   # Single source of truth for resume info
│   ├── utils/
│   │   ├── arEffects.js    # Canvas AR filter drawing algorithms
│   │   ├── documentUtils.js# Client-side PDF/DOCX conversion logic
│   │   └── useFaceLandmarker.js # MediaPipe face tracking hook
│   ├── App.jsx             # Main application orchestrator
│   ├── index.css           # Design tokens, typography & animations
│   └── main.jsx            # React root entry point
├── index.html              # HTML template & metadata
├── package.json            # Project manifest & dependencies
└── vite.config.js          # Vite build configuration
```

---

## 🔒 Privacy & Permissions

- **Camera Access**: Used solely for the real-time AR Photo Studio. Video frames are analyzed locally in GPU memory and never transmitted over any network.
- **Document Processing**: All file parsing, conversions, and downloads occur within the user's browser sandbox using Web Workers and WebAssembly.

---

## 👩‍💻 Author

**Nikita Itkar**
- **GitHub**: [@itkarnikita80-cpu](https://github.com/itkarnikita80-cpu)
- **LinkedIn**: [nikita-itkar-148344384](https://www.linkedin.com/in/nikita-itkar-148344384)
- **Instagram**: [@nikiiiiiiii_7788](https://www.instagram.com/nikiiiiiiii_7788)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
