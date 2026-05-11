import DashboardPage from "@/src/app/dashboard/page";

type Props = {
  searchParams: Promise<{ debug?: string }>;
};

export default async function SchoolDashboardPage(props: Props) {
  return DashboardPage(props);
}
