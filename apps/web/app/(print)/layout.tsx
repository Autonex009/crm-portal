import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  return <>{children}</>;
}
