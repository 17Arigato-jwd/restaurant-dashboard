"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from "@/components/ui/avatar";
import { Crown, Shield, Clock, ArrowLeft, Calendar } from "lucide-react";
import { authHeaders } from "@/lib/api";

interface RoleInfo {
  id: string;
  name: string;
  level: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatarUrl?: string;
  role?: RoleInfo;
  dishSpecialty?: string;
  weeklySchedule?: string;
  leaveStatus?: string;
}

interface Shift {
  id: string;
  userId: string;
  userName: string;
  day: string;
  startTime: string;
  endTime: string;
  roleLabel: string;
}

export default function TeamMemberPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      try {
        const [memberRes, shiftsRes] = await Promise.all([
          fetch(`/api/team/${id}`, { headers: authHeaders() }),
          fetch(`/api/shifts`, { headers: authHeaders() })
        ]);

        if (memberRes.ok) {
          setMember(await memberRes.json());
        }
        
        if (shiftsRes.ok) {
          const allShifts: Shift[] = await shiftsRes.json();
          setShifts(allShifts.filter(s => s.userId === id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberDetails();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading member details...</div>;
  }

  if (!member) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">Member not found</h2>
        <Button onClick={() => router.push('/account?tab=team')}>Back to Team</Button>
      </div>
    );
  }

  const getRoleIcon = (level: number) => {
    if (level === 1) return <Crown className="size-2.5 text-black" />;
    if (level === 2) return <Shield className="size-2.5 text-white" />;
    return <Clock className="size-2.5 text-white" />;
  };

  const getRoleBadgeColor = (level: number) => {
    if (level === 1) return "bg-yellow-400";
    if (level === 2) return "bg-blue-600";
    return "bg-gray-400";
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push('/account?tab=team')} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Team Management
      </Button>
      
      <Card className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-main/10 pb-6">
          <div className="flex items-center space-x-6">
            <Avatar className="size-20 shrink-0 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              {member.avatarUrl ? (
                <AvatarImage src={member.avatarUrl} alt={member.name} />
              ) : (
                <AvatarFallback className="bg-main text-main-foreground font-bold text-xl">
                  {member.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
              {member.role && (
                <AvatarBadge className={getRoleBadgeColor(member.role.level)}>
                  {getRoleIcon(member.role.level)}
                </AvatarBadge>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-heading mb-1">{member.name}</CardTitle>
              <CardDescription className="text-sm font-semibold">{member.email} • {member.role?.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border-2 border-black rounded-base shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">Dish Specialty</h5>
              <p className="font-semibold text-lg">{member.dishSpecialty || "Not specified"}</p>
            </div>
            <div className="p-4 border-2 border-black rounded-base shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">Weekly Schedule</h5>
              <p className="font-semibold text-lg">{member.weeklySchedule || "Not specified"}</p>
            </div>
            <div className="p-4 border-2 border-black rounded-base shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-amber-50">
              <h5 className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-1">Leave Status</h5>
              <p className="font-semibold text-lg text-amber-900">{member.leaveStatus || "Not applied"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Live Weekly Schedule
          </CardTitle>
          <CardDescription>Live shifts scheduled for {member.name}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b-2 border-black text-sm uppercase">
                <th className="p-4 font-bold border-r-2 border-black">Day</th>
                <th className="p-4 font-bold border-r-2 border-black">Shift Time</th>
                <th className="p-4 font-bold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {daysOfWeek.map(day => {
                const dayShifts = shifts.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                return (
                  <tr key={day} className="hover:bg-muted/20">
                    <td className="p-4 font-semibold border-r-2 border-black w-1/3">{day}</td>
                    <td className="p-4 border-r-2 border-black">
                      {dayShifts.length > 0 ? (
                        <div className="space-y-2">
                          {dayShifts.map(s => (
                            <div key={s.id} className="flex items-center text-sm font-mono bg-blue-50 px-2 py-1 rounded border-2 border-blue-200 w-max">
                              <Clock className="w-3 h-3 mr-2" /> {s.startTime} - {s.endTime}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">Off</span>
                      )}
                    </td>
                    <td className="p-4">
                      {dayShifts.length > 0 ? (
                        <div className="space-y-2">
                          {dayShifts.map(s => (
                            <div key={s.id} className="text-sm font-semibold">
                              {s.roleLabel}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

