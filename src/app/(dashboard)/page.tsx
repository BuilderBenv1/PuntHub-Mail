export const dynamic = "force-dynamic";

import {
  getDashboardStats,
  getSubscriberGrowth,
  getRecentCampaignPerformance,
  getRecentActivity,
} from "./dashboard-actions";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const [stats, subscriberGrowth, campaignPerformance, recentActivity] =
    await Promise.all([
      getDashboardStats(),
      getSubscriberGrowth(),
      getRecentCampaignPerformance(),
      getRecentActivity(),
    ]);

  return (
    <DashboardClient
      stats={stats}
      subscriberGrowth={subscriberGrowth}
      campaignPerformance={campaignPerformance}
      recentActivity={recentActivity}
    />
  );
}
