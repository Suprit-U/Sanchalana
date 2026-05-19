export interface DepartmentData {
  department: string;
  description: string;
  faculty_coordinators: string[];
  main_department_coordinators: MainDepartmentCoordinator[];
  events: Event[];
}

export interface MainDepartmentCoordinator {
  student_name: string;
  usn: string;
  semester: number;
  section: string;
  mobile_number: string;
}

export interface Event {
  sl_no: number;
  event_name: string;
  event_type: string;
  department: string;
  venue: string;
  date: string;
  description: string;
  registration_fees: number;
  team_size?: number;
  rules_and_regulations: string[];
  faculty_coordinators: FacultyCoordinator[];
  student_coordinators: StudentCoordinator[];
  featured?: boolean;
  poster_url?: string;
}

export interface FacultyCoordinator {
  name: string;
  phone: string;
}

export interface StudentCoordinator {
  name: string;
  phone: string;
}

export interface RegistrationStats {
  total: number;
  departmentBreakdown: {
    department: string;
    count: number;
    percent: number;
  }[];
}

import { supabase } from "@/integrations/supabase/client";

const departmentCache: Record<string, { data: DepartmentData, timestamp: number }> = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const getDepartmentData = async (departmentId: string): Promise<DepartmentData | null> => {
  try {
    const now = Date.now();
    if (departmentCache[departmentId] && (now - departmentCache[departmentId].timestamp) < CACHE_EXPIRY) {
      return departmentCache[departmentId].data;
    }
    
    const { data, error } = await supabase.storage
      .from('department-data')
      .download(`${departmentId}.json`);
    
    if (!error && data) {
      const text = await data.text();
      const parsedData: DepartmentData = JSON.parse(text);
      
      departmentCache[departmentId] = { data: parsedData, timestamp: now };
      return parsedData;
    }
    
    const response = await fetch(`/department_data/${departmentId}.json`);
    if (response.ok) {
      const staticData: DepartmentData = await response.json();
      
      await storeDepartmentData(departmentId, staticData);
      
      departmentCache[departmentId] = { data: staticData, timestamp: now };
      return staticData;
    }
    
    console.log(`No data found for ${departmentId}, generating fallback data`);
    const fallbackData = generateFallbackDepartmentData(departmentId);
    
    await storeDepartmentData(departmentId, fallbackData);
    
    departmentCache[departmentId] = { data: fallbackData, timestamp: now };
    return fallbackData;
  } catch (error) {
    console.error("Error fetching department data:", error);
    const fallbackData = generateFallbackDepartmentData(departmentId);
    return fallbackData;
  }
};

const generateFallbackDepartmentData = (departmentId: string): DepartmentData => {
  const { departmentConfig } = require('@/config/departments');
  const deptInfo = departmentConfig[departmentId] || { name: departmentId.toUpperCase() };
  
  return {
    department: deptInfo.name,
    description: `Welcome to the ${deptInfo.name} department! Discover our exciting events and meet our coordinators.`,
    faculty_coordinators: ["Dr. John Doe", "Prof. Jane Smith"],
    main_department_coordinators: [
      {
        student_name: "Student Coordinator",
        usn: "1XX21XX000",
        semester: 5,
        section: "A",
        mobile_number: "9876543210"
      }
    ],
    events: [
      {
        sl_no: 1,
        event_name: `${deptInfo.name} Showcase`,
        event_type: "Competition",
        department: deptInfo.name,
        venue: "Main Auditorium",
        date: "2025-05-15",
        description: `Show off your skills in this exciting ${deptInfo.name} event.`,
        registration_fees: 200,
        team_size: 2,
        rules_and_regulations: [
          "Maximum 2 participants per team",
          "Time limit: 30 minutes",
          "Bring your own equipment"
        ],
        faculty_coordinators: [{ name: "Dr. John Doe", phone: "9876543210" }],
        student_coordinators: [{ name: "Student Coordinator", phone: "9876543210" }],
        featured: true,
        poster_url: "/lovable-uploads/840c62b1-64dd-48d0-844c-7c0119ecad6e.png"
      }
    ]
  };
};

export const storeDepartmentData = async (departmentId: string, data: DepartmentData): Promise<boolean> => {
  try {
    console.log(`Storing department data for ${departmentId}:`, data);
    
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: "application/json" });
    
    departmentCache[departmentId] = { data, timestamp: Date.now() };
    
    const { error } = await supabase.storage
      .from('department-data')
      .upload(`${departmentId}.json`, blob, {
        upsert: true,
        contentType: 'application/json'
      });
    
    if (error) {
      console.error("Error uploading to Supabase storage:", error);
      localStorage.setItem(`department_${departmentId}`, jsonString);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("Error storing department data:", error);
    
    try {
      localStorage.setItem(`department_${departmentId}`, JSON.stringify(data));
    } catch (e) {
      console.error("Even localStorage failed:", e);
    }
    
    return false;
  }
};

export const parseRegistrationCSV = async (file: File): Promise<RegistrationStats> => {
  const text = await file.text();
  const lines = text.split('\n');
  
  const validLines = lines.filter(line => line.trim() && line.split(',').length >= 2);
  
  if (validLines.length === 0) {
    throw new Error('No valid data in CSV file');
  }
  
  await deleteAllRegistrationData();
  
  const header = validLines[0].toLowerCase().split(',');
  
  const nameIndex = header.findIndex(col => col.includes('name') || col.includes('group leader'));
  const eventNameIndex = header.findIndex(col => col.includes('event name') || col.includes('event'));
  
  if (eventNameIndex === -1) {
    throw new Error('Event name column not found in CSV file');
  }
  
  const departmentCounts: Record<string, number> = {};
  let total = 0;

  for (let i = 1; i < validLines.length; i++) {
    const values = validLines[i].split(',');
    
    if (values.length <= eventNameIndex) continue;
    
    const eventName = values[eventNameIndex].trim();
    
    if (eventName) {
      const department = getDepartmentFromEventName(eventName);
      if (department) {
        departmentCounts[department] = (departmentCounts[department] || 0) + 1;
        total++;
      }
    }
  }

  const departmentBreakdown = Object.entries(departmentCounts).map(
    ([department, count]) => ({
      department,
      count,
      percent: Math.round((count / total) * 100)
    })
  );

  departmentBreakdown.sort((a, b) => b.count - a.count);
  
  localStorage.setItem('registrationCount', total.toString());
  
  localStorage.setItem('registrationStats', JSON.stringify({
    total,
    departmentBreakdown
  }));

  return {
    total,
    departmentBreakdown
  };
};

const getDepartmentFromEventName = (eventName: string): string => {
  const eventMap: Record<string, string> = {
    "Movie Mania": "CSE",
    "Code Sprint": "CSE",
    "Web Design": "CSE",
    "Tech Quiz": "CSE",
    
    "Circuit Challenge": "ECE", 
    "Robotics Rumble": "ECE",
    "Signal Processing": "ECE",
    "IoT Workshop": "ECE",
    
    "Data Dive": "ISE",
    "Network Security": "ISE",
    "Database Design": "ISE",
    
    "AI Workshop": "AI & ML",
    "Neural Networks": "AI & ML",
    "Machine Learning": "AI & ML",
    "Computer Vision": "AI & ML",
    
    "Data Analysis": "DS",
    "Big Data": "DS",
    "Data Visualization": "DS",
    
    "Bridge Building": "Civil",
    "CAD Design": "Civil",
    "Structural Analysis": "Civil",
    
    "Math Olympiad": "Math",
    "Statistical Analysis": "Math",
    
    "Business Case Study": "MBA",
    "Marketing Strategy": "MBA",
    "Entrepreneurship": "MBA",
    
    "Chemical Experiments": "Chem",
    "Material Science": "Chem",
    
    "Physics Demonstration": "Phy",
    "Quantum Mechanics": "Phy",
    
    "Commerce Quiz": "SVFC",
    "Business Administration": "SVFC",
    "Computer Applications": "SVFC"
  };
  
  return eventMap[eventName] || "Others";
};

export const addToUploadHistory = (fileName: string, fileSize: number): void => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
  const fileSizeFormatted = (fileSize / 1024).toFixed(2) + ' KB';
  
  const historyItem = {
    name: fileName,
    date: formattedDate,
    size: fileSizeFormatted
  };
  
  const existingHistory = getUploadHistory();
  
  existingHistory.unshift(historyItem);
  
  const trimmedHistory = existingHistory.slice(0, 10);
  
  localStorage.setItem('uploadHistory', JSON.stringify(trimmedHistory));
};

export const getUploadHistory = (): {name: string; date: string; size: string}[] => {
  const storedHistory = localStorage.getItem('uploadHistory');
  return storedHistory ? JSON.parse(storedHistory) : [];
};

export const getRegistrationCount = (): number => {
  const storedCount = localStorage.getItem('registrationCount');
  return storedCount ? parseInt(storedCount, 10) : 100 + Math.floor(Math.random() * 400);
};

export const deleteAllRegistrationData = async () => {
  localStorage.removeItem('registrationCount');
  localStorage.removeItem('registrationStats');
  return true;
};
