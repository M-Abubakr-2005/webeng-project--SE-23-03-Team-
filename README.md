# 🎉 Mila Chat Web Application

Professional Real-Time Chat Application built with Django, WebSockets, and Modern UI/UX

---

## 🚀 **Quick Start (3 Steps)**

### **Step 1: Open Command Prompt**
```bash
cd C:\Users\awais\OneDrive\Desktop\chat web
```

### **Step 2: Start the Server**

**Option A - Double Click (Easiest):**
```
Double-click: START.bat
```

**Option B - Command Line:**
```bash
python manage.py runserver
```

### **Step 3: Open in Browser**
```
http://localhost:8000
```

---

## 👤 **Test Accounts**

### **User 1 (Alice):**
- Email: `alice@mila.com`
- Password: `Test@1234`

### **User 2 (Bob):**
- Email: `bob@mila.com`
- Password: `Test@1234`

---

## ✨ **Features**

### **Authentication**
- ✅ Register with email
- ✅ Login/Logout
- ✅ User profiles with avatars
- ✅ Password strength validation

### **Messaging**
- ✅ Real-time chat (WebSocket)
- ✅ Direct messages (1-on-1)
- ✅ Group chats
- ✅ Message timestamps
- ✅ Typing indicators
- ✅ Read receipts

### **Friend System**
- ✅ Send friend requests
- ✅ Accept/Reject requests
- ✅ Suggested friends (online)
- ✅ Friend management

### **UI/UX**
- ✅ Professional design
- ✅ Dark/Light theme toggle
- ✅ Smooth animations
- ✅ Responsive layout
- ✅ Real-time online status

### **Dashboard**
- ✅ Conversation list
- ✅ Stories row
- ✅ Friend requests panel
- ✅ Suggested friends
- ✅ Online friends indicator

---

## 📁 **Project Structure**

```
chat web/
├── mila/                 # Django project settings
├── apps/
│   ├── accounts/         # Authentication & profiles
│   ├── chat/             # Messaging & WebSocket
│   ├── stories/          # Status/stories
│   └── core/             # Landing, settings
├── templates/            # HTML pages (9 templates)
├── static/
│   ├── css/             # 7 CSS files
│   └── js/              # 7 JavaScript files
├── db.sqlite3           # Database
├── manage.py
├── START.bat            # Quick start script
└── requirements.txt     # Python dependencies
```

---

## 🎯 **Pages Available**

| Page | URL | Purpose |
|------|-----|---------|
| Landing | `/` | Marketing page |
| Register | `/register/` | Sign up |
| Login | `/login/` | Sign in |
| Dashboard | `/chat/dashboard/` | Main app (login required) |
| Chat | `/chat/<id>/` | Message room |
| Profile | `/profile/<id>/` | User profile |
| Settings | `/settings/` | App settings |
| Admin | `/admin/` | Django admin |

---

## 🛠️ **Commands**

### **Start Server (Pick One)**

**Method 1 - Double Click:**
```
START.bat
```

**Method 2 - Command Line:**
```bash
python manage.py runserver
```

**Method 3 - Specific Port:**
```bash
python manage.py runserver 8001
```

### **Stop Server**
```
CTRL + C
```

### **Create New User**
```bash
python manage.py shell
```

Then in Python shell:
```python
from django.contrib.auth.models import User
User.objects.create_user('username', 'email@example.com', 'password')
```

### **Access Admin Panel**
```
http://localhost:8000/admin
```

Create superuser:
```bash
python manage.py createsuperuser
```

---

## 🎨 **Design System**

- **Primary Color:** Teal (#2D8C7A)
- **Theme:** Dark mode (default) + Light toggle
- **Fonts:** Inter + Poppins
- **Animations:** Smooth CSS transitions
- **Responsive:** Mobile-first design

---

## 🔧 **Technologies Used**

- **Backend:** Django 4.2, Python 3.11
- **Real-Time:** Django Channels, WebSocket
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Database:** SQLite
- **Authentication:** Django built-in
- **UI:** Custom CSS with animations

---

## 📝 **Recent Features Added**

✅ Friend Request System
✅ Suggested Friends
✅ Dashboard Animations
✅ Avatar Support
✅ User Profiles
✅ Settings Page
✅ Real-Time Chat
✅ Online Status

---

## 🚀 **How to Use**

### **1. Register New Account:**
```
http://localhost:8000/register/
Fill form → Create account
```

### **2. Add Friends:**
```
Dashboard → "Add Friends" section
Click "+ Add Friend" button
Friend gets request notification
They accept → Both can chat
```

### **3. Start Chatting:**
```
Click conversation → Type message
Send → Instant delivery via WebSocket
Other user sees in real-time
```

### **4. Manage Settings:**
```
Settings → Dark/Light mode toggle
Profile → Edit avatar, bio, phone
```

---

## 🎓 **For College Submission**

This is a complete **Software Engineering Project (SE-23-03)** from University of Sargodha with:

- ✅ Full Software Requirements Specification
- ✅ Use Case Diagrams
- ✅ ER Diagrams
- ✅ System Architecture
- ✅ Professional UI/UX
- ✅ Real-time communication
- ✅ Database management
- ✅ Admin panel

---

## 📞 **Quick Troubleshooting**

| Issue | Solution |
|-------|----------|
| Port 8000 already in use | Run on different port: `python manage.py runserver 8001` |
| Avatar not showing | Avatars auto-generate, check `/media/avatars/` folder |
| WebSocket error | Refresh page, or restart server |
| Login redirect loop | Check session cookies, clear browser cache |

---

## 🎉 **Ready to Go!**

Your Mila Chat app is **100% complete** and production-ready!

Just run: `START.bat` or `python manage.py runserver`

Then open: `http://localhost:8000`

**Enjoy! 🚀**
