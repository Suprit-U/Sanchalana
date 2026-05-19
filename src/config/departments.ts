
import { Brain, ChartLine, Database, Factory, Lightbulb, Microscope, Calculator, Code, Cpu, Building2, Wrench } from "lucide-react";

export const departmentConfig = {
  'aiml': { 
    name: 'AI & ML',
    bgColor: '#A142F4',
    icon: Brain,
    jsonFile: 'aiml.json'
  },
  'chem': { 
    name: 'Chemistry',
    bgColor: '#00C853',
    icon: Microscope,
    jsonFile: 'chem.json'
  },
  'civil': { 
    name: 'Civil & Mechanical',
    bgColor: '#FFC107',
    icon: Building2,
    jsonFile: 'civil.json'
  },
  'cse': { 
    name: 'Computer Science',
    bgColor: '#4285F4',
    icon: Code,
    jsonFile: 'cse.json'
  },
  'ds': { 
    name: 'Data Science',
    bgColor: '#00BCD4',
    icon: Database,
    jsonFile: 'ds.json'
  },
  'ece': { 
    name: 'Electronics & Communication',
    bgColor: '#EA4335',
    icon: Cpu,
    jsonFile: 'ece.json'
  },
  'ise': { 
    name: 'Information Science',
    bgColor: '#34A853',
    icon: Factory,
    jsonFile: 'ise.json'
  },
  'math': { 
    name: 'Mathematics',
    bgColor: '#8667F2',
    icon: Calculator,
    jsonFile: 'math.json'
  },
  'mba': { 
    name: 'MBA',
    bgColor: '#F44336',
    icon: ChartLine,
    jsonFile: 'mba.json'
  },
  'phy': { 
    name: 'Physics',
    bgColor: '#2196F3',
    icon: Wrench,
    jsonFile: 'phy.json'
  },
  'svfc': { 
    name: 'SVFC',
    bgColor: '#FFC107',
    icon: Lightbulb,
    jsonFile: 'svfc.json'
  }
};
