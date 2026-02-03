# AI Assistant Frontend - ChatGPT Clone

A modern, beautiful Next.js frontend that integrates with the AI Assistant backend. Built to look and feel like ChatGPT with full RAG capabilities.

## 🎨 Features

- **🔐 Authentication** - Secure login and registration
- **💬 Chat Interface** - ChatGPT-like conversational UI
- **📄 Document Management** - Upload and manage documents
- **🎯 Session Management** - Multiple chat sessions
- **🌙 Dark Mode** - Beautiful dark/light themes
- **📱 Responsive** - Works on all devices
- **⚡ Real-time** - Instant message updates
- **🎨 Modern UI** - Clean, intuitive interface with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Markdown**: react-markdown
- **Code Highlighting**: react-syntax-highlighter
- **Icons**: Lucide React
- **Notifications**: react-hot-toast

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- Backend API running on `http://localhost:3000`

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## 📱 Pages & Routes

- `/` - Home (redirects to login or chat)
- `/login` - User login
- `/register` - User registration
- `/chat` - Main chat interface
- `/documents` - Document management

## 🎯 Key Features

### Authentication

- JWT-based authentication
- Persistent login state
- Secure token storage
- Auto-redirect on auth failure

### Chat Interface

- ChatGPT-like message display
- Markdown rendering
- Code syntax highlighting
- Source citations
- Loading states
- Error handling

### Document Management

- File upload (PDF, TXT, DOC, DOCX)
- Multiple file upload
- Document status tracking
- Delete documents
- Upload statistics

### Session Management

- Create new chat sessions
- Switch between sessions
- Delete sessions
- Clear chat history
- Session persistence

## 🎨 UI Components

### ChatMessage

Displays user and AI messages with:
- Markdown rendering
- Code syntax highlighting
- Copy code functionality
- Source citations

### ChatInput

Message input with:
- Auto-resizing textarea
- Send on Enter (Shift+Enter for new line)
- Loading state
- Disabled state

### Sidebar

Navigation sidebar with:
- New chat button
- Session list
- User profile
- Logout button
- Document navigation

### ProtectedRoute

Route protection wrapper:
- Auth verification
- Auto-redirect to login
- Loading state

## 🔧 Configuration

### API Integration

All API calls are centralized in `lib/api.ts`:

```typescript
// Auth
authApi.register()
authApi.login()
authApi.getProfile()

// Documents
documentsApi.upload()
documentsApi.uploadMultiple()
documentsApi.getAll()
documentsApi.delete()

// Chat
chatApi.ask()
chatApi.createSession()
chatApi.getSessions()
```

### State Management

Global state managed with Zustand in `lib/store.ts`:

- User authentication
- Chat messages
- Sessions
- Documents
- UI state (sidebar)

## 🎨 Styling

### Tailwind Configuration

- Custom color palette
- Dark mode support
- Responsive breakpoints
- Custom animations

### Custom Styles

- Markdown rendering
- Code blocks
- Scrollbars
- Loading animations

## 📦 Project Structure

```
frontend/
├── app/
│   ├── chat/
│   │   └── page.tsx           # Chat interface
│   ├── documents/
│   │   └── page.tsx           # Document management
│   ├── login/
│   │   └── page.tsx           # Login page
│   ├── register/
│   │   └── page.tsx           # Register page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/
│   ├── ChatMessage.tsx        # Message component
│   ├── ChatInput.tsx          # Input component
│   ├── Sidebar.tsx            # Navigation sidebar
│   └── ProtectedRoute.tsx     # Auth wrapper
├── lib/
│   ├── api.ts                 # API client
│   └── store.ts               # State management
└── public/                    # Static assets
```

## 🔒 Security

- JWT token storage
- Secure HTTP-only approach
- XSS protection
- CSRF prevention
- Input validation
- Error handling

## 🎯 Usage

### Login

1. Navigate to `/login`
2. Enter credentials (demo: `demo@example.com` / `demo123`)
3. Click "Sign in"

### Chat

1. After login, you're on `/chat`
2. Type a message
3. Press Enter or click Send
4. View AI response with sources

### Upload Documents

1. Navigate to `/documents`
2. Click "Upload" button
3. Select files (PDF, TXT, DOC, DOCX)
4. Wait for processing
5. Documents are added to knowledge base

### Manage Sessions

1. Click "New Chat" to start fresh
2. Select previous sessions from sidebar
3. Delete unwanted sessions
4. Clear history for a session

## 🐛 Troubleshooting

### Backend Connection Issues

- Ensure backend is running on `http://localhost:3000`
- Check `.env.local` configuration
- Verify CORS settings on backend

### Authentication Issues

- Clear browser localStorage
- Re-login
- Check token expiration

### Build Issues

```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api/v1` |

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - feel free to use this project for your applications.

## 🙏 Acknowledgments

- Next.js team
- Vercel
- Tailwind CSS
- All open-source contributors

---

**Built with ❤️ using Next.js and TypeScript**
