import { EditUserForm } from "@/components/EditUserForm";

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Edit Team Member</h1>
        <p className="text-muted-foreground mt-1 font-bold">Modify account details and credentials.</p>
      </div>
      <EditUserForm userId={resolvedParams.id} />
    </div>
  );
}
