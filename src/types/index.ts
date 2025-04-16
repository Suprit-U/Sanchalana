export interface Coordinator {
  id: string;
  department_id: string;
  name: string;
  phone_number: string;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  name: string;
  short_name: string;
  icon?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  department_id: string;
  team_size: number;
  venue?: string;
  conduction_venue?: string;
  date?: string;
  registration_fee: number;
  event_type: string;
  faculty_coordinators?: any;
  student_coordinators?: any;
  is_trending?: boolean;
  payment_qr_url?: string;
  image_url?: string;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  usn: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  team_id: string;
  team_members: {
    name: string;
    usn: string;
    phone: string;
  }[];
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationWithDetails extends Omit<Registration, 'payment_status'> {
  payment_status: string;
  event: Event;
  department?: Department;
}

export interface Admin {
  id: string;
  username: string;
  role: "main_admin" | "department_admin" | "event_admin";
  department_id?: string;
  event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  profile?: Profile;
}