import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Parses all <a href="..."> links in the HTML, creates tracked_links rows,
 * and replaces hrefs with tracking URLs.
 *
 * The {subscriber_id} placeholder in the tracking URL will be replaced
 * at send time with the actual subscriber ID.
 */
export async function rewriteLinksForTracking(
  html: string,
  campaignId: string | null,
  automationStepId: string | null,
  supabase: SupabaseClient
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Match all <a href="..."> links (both single and double quotes)
  const hrefRegex = /<a\s[^>]*href=["']([^"']+)["']/gi;

  // Collect all unique URLs that should be tracked
  const urlsToTrack = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1];
    // Skip mailto:, anchor links, unsubscribe token placeholders, and already-tracked URLs
    if (
      url.startsWith("mailto:") ||
      url.startsWith("#") ||
      url.includes("{unsubscribe_token}") ||
      url.startsWith(`${appUrl}/api/track/click`)
    ) {
      continue;
    }
    urlsToTrack.add(url);
  }

  if (urlsToTrack.size === 0) {
    return html;
  }

  // Create tracked_links rows for each unique URL and build a mapping
  const urlToTrackingUrl = new Map<string, string>();

  for (const originalUrl of Array.from(urlsToTrack)) {
    const insertData: Record<string, any> = {
      original_url: originalUrl,
      click_count: 0,
    };

    if (campaignId) {
      insertData.campaign_id = campaignId;
    }
    if (automationStepId) {
      insertData.automation_step_id = automationStepId;
    }

    const { data: trackedLink, error } = await supabase
      .from("tracked_links")
      .insert(insertData)
      .select("id")
      .single();

    if (error || !trackedLink) {
      console.error(`Failed to create tracked link for ${originalUrl}:`, error?.message);
      continue;
    }

    // {subscriber_id} placeholder will be replaced at send time
    const trackingUrl = `${appUrl}/api/track/click?lid=${trackedLink.id}&sid={subscriber_id}`;
    urlToTrackingUrl.set(originalUrl, trackingUrl);
  }

  // Replace all matching hrefs in the HTML
  let modifiedHtml = html;
  for (const [originalUrl, trackingUrl] of Array.from(urlToTrackingUrl.entries())) {
    // Escape special regex characters in the URL
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Replace in href attributes only (both single and double quotes)
    const replaceRegex = new RegExp(
      `(<a\\s[^>]*href=["'])${escapedUrl}(["'])`,
      "gi"
    );
    modifiedHtml = modifiedHtml.replace(replaceRegex, `$1${trackingUrl}$2`);
  }

  return modifiedHtml;
}
