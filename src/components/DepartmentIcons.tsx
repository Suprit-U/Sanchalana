import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Department } from '@/types';
import { Loader2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode,
  faMicrochip,
  faIndustry,
  faBrain,
  faDatabase,
  faCogs,
  faBuilding,
  faChartLine,
  faCalculator,
  faVial,
  faBolt,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons';

export default function DepartmentIcons() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        setDepartments(data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const normalizeName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/gi, '');

  const getIconData = (department: Department) => {
    const normalized = normalizeName(department.short_name || department.name);

    const iconMap: Record<string, { bgColor: string; icon: any }> = {
      'cse': { bgColor: '#4285F4', icon: faCode },
      'ece': { bgColor: '#EA4335', icon: faMicrochip },
      'ise': { bgColor: '#34A853', icon: faIndustry },
      'aiml': { bgColor: '#A142F4', icon: faBrain },
      'ds': { bgColor: '#00BCD4', icon: faDatabase },
      'mech': { bgColor: '#FFA000', icon: faCogs },
      'civil': { bgColor: '#9E9E9E', icon: faBuilding },
      'mba': { bgColor: '#F44336', icon: faChartLine },
      'math': { bgColor: '#8667F2', icon: faCalculator },
      'chem': { bgColor: '#00C853', icon: faVial },
      'phy': { bgColor: '#2196F3', icon: faBolt },
      'svfc': { bgColor: '#FFC107', icon: faLightbulb },
    };

    return iconMap[normalized] || { bgColor: '#757575', icon: faLightbulb };
  };

  return (
    <div className="py-8 w-full">
      <h2 className="text-2xl font-bold mb-6">Explore Departments</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {departments.map((department) => {
          const { bgColor, icon } = getIconData(department);
          return (
            <Link
              key={department.id}
              to={`/departments/${department.id}`}
              className="group flex flex-col items-center text-center"
            >
              <div
                className="rounded-full p-6 mb-3 flex items-center justify-center
                  transition-all duration-300 group-hover:shadow-lg 
                  group-hover:scale-110 group-hover:opacity-90"
                style={{
                  backgroundColor: bgColor,
                  width: '80px',
                  height: '80px',
                }}
              >
                <FontAwesomeIcon icon={icon} className="text-white text-2xl" />
              </div>
              <span className="font-medium text-sm mt-2">{department.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
