import { getActiveEmployees } from "@/lib/queries";
import LoginPage from "./login-form";

export default async function Page() {
  const employees = await getActiveEmployees();
  return <LoginPage employees={employees} />;
}
