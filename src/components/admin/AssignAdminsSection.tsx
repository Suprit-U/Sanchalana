
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { departmentConfig } from "@/config/departments";

interface AdminUser {
  email: string;
  full_name: string;
  department_id: string | null;
  is_super_admin: boolean;
}

export function AssignAdminsSection() {
  const { toast } = useToast();

  const [departments, setDepartments] = useState<{ code: string, name: string }[]>([]);
  const [adminsByDept, setAdminsByDept] = useState<Record<string, AdminUser[]>>({});
  const [newAdmin, setNewAdmin] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get departments and load admins
    const result = Object.keys(departmentConfig).map((code) => ({
      code,
      name: departmentConfig[code as keyof typeof departmentConfig]?.name || code.toUpperCase(),
    }));
    setDepartments(result);
    fetchAdmins();
    // eslint-disable-next-line
  }, []);

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*");

    if (error) {
      toast({
        title: "Failed to load admins",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    const byDept: Record<string, AdminUser[]> = {};
    data.forEach((row: AdminUser) => {
      if (row.department_id) {
        if (!byDept[row.department_id]) byDept[row.department_id] = [];
        byDept[row.department_id].push(row);
      }
    });
    setAdminsByDept(byDept);
  };

  // Fix the ON CONFLICT error: simple insert, no onConflict, values matches supabase requirements.
  const handleAddAdmin = async (dept: string) => {
    const email = newAdmin[dept]?.trim();
    if (!email) {
      toast({
        title: "Enter an email",
        description: "Please enter the admin's email address.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    // Does user already exist as admin for this department?
    const exists = (adminsByDept[dept] || []).some((a) => a.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      toast({
        title: "Already Admin",
        description: `${email} is already an admin for ${departmentConfig[dept as keyof typeof departmentConfig]?.name || dept}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Only insert a single object, no onConflict
    const { error } = await supabase
      .from("admin_users")
      .insert({
        email,
        full_name: "",
        department_id: dept,
        is_super_admin: false,
      });

    if (error) {
      toast({
        title: "Failed to assign admin",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Department Admin Added",
        description: `Assigned ${email} as admin for ${departmentConfig[dept as keyof typeof departmentConfig]?.name || dept}`,
      });
      setNewAdmin((prev) => ({ ...prev, [dept]: "" }));
      fetchAdmins();
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="rounded-lg shadow-lg border-0 bg-[#191A22]">
      <CardHeader className="bg-gradient-to-r from-[#2D203D] to-[#282343] rounded-t-lg border-b border-[#312744]">
        <CardTitle className="text-white">Assign Department Admins</CardTitle>
        <CardDescription className="text-gray-300">
          Add or view department admins. Enter the email address to assign as admin for a department.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {departments.map((dept) => (
            <div
              key={dept.code}
              className="bg-[#23243A] rounded-lg p-6 shadow-md border border-[#2E2941] my-2"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-primary" style={{ color: "#9b87f5" }}>{dept.name}</h3>
                  <div className="text-xs text-gray-400 mt-1">Department code: <span className="font-mono bg-[#231D37] text-gray-300 px-1 py-0.5 rounded">{dept.code}</span></div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 mt-4 md:mt-0">
                  <Input
                    id={`admin-input-${dept.code}`}
                    type="email"
                    placeholder="Enter Admin Email"
                    value={newAdmin[dept.code] || ""}
                    onChange={e => setNewAdmin(prev => ({ ...prev, [dept.code]: e.target.value }))}
                    className="w-full md:w-64 bg-[#1A1C29] border-[#302B44] text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-purple-600"
                    disabled={isSubmitting}
                  />
                  <Button
                    onClick={() => handleAddAdmin(dept.code)}
                    disabled={isSubmitting || !newAdmin[dept.code]?.trim()}
                    className="bg-gradient-to-r from-[#9b87f5] to-[#eeaeee] hover:from-[#ae97fa] hover:to-[#ffd6fc] text-[#1A1F2C] font-semibold px-5 transition shadow-md border-0"
                  >
                    Assign Admin
                  </Button>
                </div>
              </div>
              {(adminsByDept[dept.code] && adminsByDept[dept.code].length > 0) && (
                <div className="mt-4 pt-3 border-t border-[#312744]">
                  <div className="font-medium text-sm text-gray-300 mb-2">Current Admins:</div>
                  <ul className="space-y-1">
                    {adminsByDept[dept.code].map((a, idx) => (
                      <li
                        key={a.email + idx}
                        className="flex items-center gap-2 text-gray-200 bg-[#181A24] px-3 py-2 rounded-md border border-[#23243A]"
                      >
                        <span className="text-white">{a.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
