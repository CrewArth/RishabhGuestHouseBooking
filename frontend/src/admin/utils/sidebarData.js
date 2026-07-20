import { Home, Building2, DoorOpen, BookOpen, Bed, FileText, PersonStanding, Settings } from 'lucide-react';

export const mainSidebarData = [
  {
    id: 'MC_ADMIN_DASHBOARD',
    name: 'Dashboard',
    icon: Home,
    navigate: '/super-admin/dashboard',
  },
  {
    id: 'MC_GUEST_HOUSE',
    name: 'Guest House',
    icon: Building2,
    navigate: '/super-admin/guesthouses',
  },
  {
    id: 'MC_ROOM_MANAGEMENT',
    name: 'Room Management',
    icon: DoorOpen,
    navigate: '/super-admin/rooms',
  },
  {
    id: 'MC_BED_MANAGEMENT',
    name: 'Bed Management',
    icon: Bed,
    navigate: '/super-admin/beds',
  },
  {
    id: 'MC_BOOKING_MANAGEMENT',
    name: 'Booking Management',
    icon: BookOpen,
    navigate: '/super-admin/bookings',
  },
  {
    id: 'MC_LIST_USERS',
    name: 'Admin Management',
    icon: PersonStanding,
    navigate: '/super-admin/users',
  },
  {
    id: 'MC_AUDIT_LOGS',
    name: 'Audit Logs',
    icon: FileText,
    navigate: '/super-admin/audits',
  },
  {
    id: 'MC_SETTINGS',
    name: 'Settings',
    icon: Settings,
    navigate: '/super-admin/settings',
  },
];
