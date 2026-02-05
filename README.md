# VORNAC Frontend

A modern frontend application built with React, Vite, and Tailwind CSS.

## 🚀 Features

- **Fast Development**: Powered by Vite for lightning-fast HMR and build performance.
- **Responsive Design**: Styled with Tailwind CSS for a mobile-first, utility-first approach.
- **Routing**: Client-side routing using React Router DOM.
- **API Integration**: Configured with Axios for efficient HTTP requests.

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vornac-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## 💻 Usage

### Development Server
Start the development server with hot reload:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Build for Production
Build the application for production:
```bash
npm run build
```
The output will be in the `dist` directory.

### Preview Production Build
Preview the production build locally:
```bash
npm run preview
```

## 📂 Project Structure

```
src/
├── api/          # API client and service definitions
├── pages/        # Application page components
├── App.jsx       # Main application component
├── main.jsx      # Entry point
├── Navbar.jsx    # Navigation component
└── index.css     # Global styles and Tailwind directives
```

## 📄 License

[MIT](LICENSE)
