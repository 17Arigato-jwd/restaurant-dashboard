import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-muted/20 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6 bg-background p-10 rounded-xl shadow-lg border">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Easy Restaurant SPA</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <Button className="w-full" variant="outline">Sign in with Google</Button>
          <Button className="w-full">Sign in with Email</Button>
        </div>
      </div>
    </div>
  );
}
