# 🏥 Doctor's Office Scheduling App

A responsive, elegant, and intuitive web application for managing patient appointments in a doctor's office. Built with React, TailwindCSS, and modern web technologies.

## Features

### 📅 Interactive Calendar System
- **Day View**: Shows one day's schedule divided into 15-minute slots
- **Week View**: Displays the entire week (7 days) with scrollable time slots
- **Month View**: Overview of appointments per day
- Easy switching between views using segmented control buttons

### ⏰ Configurable Working Hours
- **Morning Shift**: 09:00 – 17:00
- **Evening Shift**: 14:00 – 21:00
- Toggle between shifts with a simple button interface
- Calendar automatically adjusts visible slots to match the chosen shift

### 🎯 Time Slot Management
- 15-minute interval time slots
- Available slots appear in light blue
- Booked slots appear in gray
- Click any slot to create or edit appointments

### 📝 Appointment Management
- Create new appointments with:
  - Patient name
  - Appointment type (Consultation, Follow-up, Checkup, Procedure, Emergency)
  - Notes or reason for visit
- Edit existing appointments
- Cancel appointments with confirmation

### 🧭 Navigation
- "Today" button to jump to the current day
- Date selector for navigating between dates
- Previous/Next navigation buttons
- View switcher (Daily / Weekly / Monthly)

### 📊 Sidebar Features
- Quick filtering by appointment type
- Summary of today's appointments
- List of all appointments for the selected day
- Responsive design with collapsible sidebar on mobile

### 📱 Responsive Design
- **Desktop**: Full grid-based layout with large calendar view
- **Tablet**: Weekly view emphasized, collapsible sidebar
- **Mobile**: Daily view optimized, tap-based navigation

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Zustand** - State management
- **date-fns** - Date manipulation utilities

## Getting Started

### Prerequisites
- Node.js 16+ and npm (or yarn/pnpm)

### Installation

1. Navigate to the project directory:
```bash
cd Gorica-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Select a View**: Use the Day/Week/Month buttons in the navigation bar
2. **Choose a Shift**: Toggle between Morning and Evening shifts
3. **Navigate Dates**: Use the date picker or Previous/Next buttons
4. **Create Appointment**: Click on any available time slot
5. **Edit Appointment**: Click on a booked slot to edit or cancel
6. **Filter Appointments**: Use the sidebar to filter by appointment type

## Project Structure

```
Gorica-calendar/
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── DayView.jsx
│   │   │   ├── WeekView.jsx
│   │   │   └── MonthView.jsx
│   │   ├── AppointmentModal.jsx
│   │   ├── Navigation.jsx
│   │   ├── ShiftToggle.jsx
│   │   └── Sidebar.jsx
│   ├── store/
│   │   └── useAppStore.js
│   ├── utils/
│   │   └── timeSlots.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Color Palette

- Primary Blue: `#1E90FF`
- Light Blue: `#E6F0FF`
- White: `#FFFFFF`
- Gray tones for booked slots and UI elements

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is for demonstration purposes.

