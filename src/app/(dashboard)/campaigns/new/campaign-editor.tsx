"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  saveDraft,
  getRecipientCount,
  sendCampaignNow,
  scheduleCampaign,
  sendTestEmail,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { EmailBuilderRef } from "@/components/email-builder";

const EmailBuilderComponent = dynamic(
  () => import("@/components/email-builder").then((mod) => mod.EmailBuilderComponent),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/50"><p className="text-muted-foreground">Loading email builder...</p></div> }
);

type Tag = { id: string; name: string };
type Template = { id: string; name: string; subject: string | null; html_body: string; design_json?: any };

export function CampaignEditor({
  tags,
  templates,
  existingCampaign,
}: {
  tags: Tag[];
  templates: Template[];
  existingCampaign: any | null;
}) {
  const [campaignId, setCampaignId] = useState<string | null>(existingCampaign?.id || null);
  const [subject, setSubject] = useState(existingCampaign?.subject || "");
  const [previewText, setPreviewText] = useState(existingCampaign?.preview_text || "");
  const [fromName, setFromName] = useState(existingCampaign?.from_name || "PuntHub");
  const [fromEmail, setFromEmail] = useState(existingCampaign?.from_email || "help@punthub.co.uk");
  const [replyTo, setReplyTo] = useState(existingCampaign?.reply_to || "");
  const [htmlBody, setHtmlBody] = useState(existingCampaign?.html_body || "");
  const [designJson, setDesignJson] = useState<any>(existingCampaign?.design_json || null);
  const [includeTagIds, setIncludeTagIds] = useState<string[]>(existingCampaign?.tag_ids || []);
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>(existingCampaign?.exclude_tag_ids || []);
  const [recipientCount, setRecipientCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [editorMode, setEditorMode] = useState<string>(existingCampaign?.design_json ? "visual" : existingCampaign?.html_body ? "html" : "visual");
  const emailBuilderRef = useRef<EmailBuilderRef>(null);
  const router = useRouter();
  const { toast } = useToast();

  const updateRecipientCount = useCallback(async () => {
    const count = await getRecipientCount(includeTagIds, excludeTagIds);
    setRecipientCount(count);
  }, [includeTagIds, excludeTagIds]);

  useEffect(() => { updateRecipientCount(); }, [updateRecipientCount]);

  function toggleTag(tagId: string, list: "include" | "exclude") {
    if (list === "include") {
      setIncludeTagIds((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
      setExcludeTagIds((prev) => prev.filter((id) => id !== tagId));
    } else {
      setExcludeTagIds((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
      setIncludeTagIds((prev) => prev.filter((id) => id !== tagId));
    }
  }

  function handleLoadTemplate(templateId: string) {
    if (templateId === "none") return;
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setHtmlBody(template.html_body);
      if (template.design_json) {
        setDesignJson(template.design_json);
        setEditorMode("visual");
        emailBuilderRef.current?.loadDesign(template.design_json);
      } else {
        setEditorMode("html");
      }
      if (template.subject && !subject) setSubject(template.subject);
      toast({ title: `Loaded template: ${template.name}` });
    }
  }

  async function getHtmlFromEditor(): Promise<string> {
    if (editorMode === "visual" && emailBuilderRef.current) {
      const { html, design } = await emailBuilderRef.current.exportHtml();
      setHtmlBody(html);
      setDesignJson(design);
      return html;
    }
    return htmlBody;
  }

  async function handleSaveDraft(): Promise<string | null> {
    if (!subject.trim()) { toast({ title: "Subject is required", variant: "destructive" }); return null; }
    setSaving(true);

    const html = await getHtmlFromEditor();

    const formData = new FormData();
    if (campaignId) formData.set("id", campaignId);
    formData.set("subject", subject);
    formData.set("preview_text", previewText);
    formData.set("from_name", fromName);
    formData.set("from_email", fromEmail);
    formData.set("reply_to", replyTo);
    formData.set("html_body", html);
    formData.set("design_json", JSON.stringify(designJson));
    formData.set("tag_ids", JSON.stringify(includeTagIds));
    formData.set("exclude_tag_ids", JSON.stringify(excludeTagIds));
    const result = await saveDraft(formData);
    setSaving(false);
    if (result.error) { toast({ title: "Error", description: result.error, variant: "destructive" }); return null; }
    setCampaignId(result.id!);
    toast({ title: "Draft saved" });
    return result.id!;
  }

  async function handleSendNow() {
    const savedId = await handleSaveDraft();
    if (!savedId) return;
    setSending(true);
    const result = await sendCampaignNow(savedId);
    setSending(false);
    setSendConfirmOpen(false);
    if (result.error) { toast({ title: "Error", description: result.error, variant: "destructive" }); return; }
    toast({ title: "Campaign queued", description: `Sending to ${result.sent} recipients in batches` });
    router.push("/campaigns");
  }

  async function handleSchedule() {
    if (!scheduleDate) { toast({ title: "Pick a date and time", variant: "destructive" }); return; }
    const savedId = await handleSaveDraft();
    if (!savedId) return;
    setSending(true);
    const result = await scheduleCampaign(savedId, new Date(scheduleDate).toISOString());
    setSending(false);
    setScheduleOpen(false);
    if (result.error) { toast({ title: "Error", description: result.error, variant: "destructive" }); return; }
    toast({ title: "Campaign scheduled" });
    router.push("/campaigns");
  }

  async function handleSendTest() {
    const html = await getHtmlFromEditor();
    if (!testEmailAddr || !subject.trim() || !html.trim()) {
      toast({ title: "Need subject, HTML body, and test email", variant: "destructive" });
      return;
    }
    setTestSending(true);
    const result = await sendTestEmail({ to: testEmailAddr, subject: `[TEST] ${subject}`, html, from_name: fromName, from_email: fromEmail });
    setTestSending(false);
    if (result.error) { toast({ title: "Error", description: result.error, variant: "destructive" }); return; }
    toast({ title: "Test email sent!" });
    setTestEmailOpen(false);
  }

  async function handleShowPreview() {
    if (!showPreview) {
      const html = await getHtmlFromEditor();
      setHtmlBody(html);
    }
    setShowPreview(!showPreview);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 max-w-full overflow-hidden">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your email subject line" />
              </div>
              <div className="space-y-2">
                <Label>Preview Text</Label>
                <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Shows in email client preview" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reply-To (optional)</Label>
                <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="reply@example.com" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>List Targeting</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Include Lists</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id} variant={includeTagIds.includes(tag.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(tag.id, "include")}>{tag.name}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Exclude Lists</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id} variant={excludeTagIds.includes(tag.id) ? "destructive" : "outline"} className="cursor-pointer" onClick={() => toggleTag(tag.id, "exclude")}>{tag.name}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="text-center">
                <p className="text-2xl font-bold">{recipientCount}</p>
                <p className="text-sm text-muted-foreground">recipients</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {showPreview && (
            <Card className="sticky top-6">
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-4 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">From:</span> {fromName} &lt;{fromEmail}&gt;</p>
                  <p><span className="text-muted-foreground">Subject:</span> {subject}</p>
                  {previewText && <p><span className="text-muted-foreground">Preview:</span> {previewText}</p>}
                </div>
                <Separator className="mb-4" />
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: htmlBody }} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Email Body Editor - Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Body</CardTitle>
            {templates.length > 0 && (
              <Select onValueChange={handleLoadTemplate}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Load template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={editorMode} onValueChange={setEditorMode}>
            <TabsList className="mb-4">
              <TabsTrigger value="visual">Visual Builder</TabsTrigger>
              <TabsTrigger value="html">HTML Code</TabsTrigger>
            </TabsList>
            <TabsContent value="visual">
              <div className="border rounded-lg overflow-hidden">
                <EmailBuilderComponent
                  ref={emailBuilderRef}
                  initialDesign={designJson}
                  minHeight="600px"
                />
              </div>
            </TabsContent>
            <TabsContent value="html">
              <Textarea value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} placeholder="Paste your HTML email here..." className="min-h-[400px] font-mono text-sm" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>{saving ? "Saving..." : "Save Draft"}</Button>
        <Button variant="outline" onClick={handleShowPreview}>{showPreview ? "Hide Preview" : "Show Preview"}</Button>
        <Button variant="outline" onClick={() => setTestEmailOpen(true)} disabled={!subject.trim()}>Send Test</Button>
        <Button variant="outline" onClick={() => setScheduleOpen(true)} disabled={!subject.trim() || recipientCount === 0}>Schedule</Button>
        <Button onClick={() => setSendConfirmOpen(true)} disabled={!subject.trim() || recipientCount === 0}>Send Now</Button>
      </div>

      {/* Send test email dialog */}
      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Send a preview to yourself before sending to everyone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Send to</Label>
              <Input type="email" value={testEmailAddr} onChange={(e) => setTestEmailAddr(e.target.value)} placeholder="your@email.com" />
            </div>
            <p className="text-sm text-muted-foreground">Subject will be prefixed with [TEST]</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleSendTest} disabled={testSending || !testEmailAddr}>{testSending ? "Sending..." : "Send Test"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendConfirmOpen} onOpenChange={setSendConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send campaign now?</DialogTitle>
            <DialogDescription>This will send &quot;{subject}&quot; to <strong>{recipientCount}</strong> recipient{recipientCount !== 1 ? "s" : ""}. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSendNow} disabled={sending}>{sending ? "Sending..." : `Send to ${recipientCount} recipients`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule campaign</DialogTitle>
            <DialogDescription>Choose when to send &quot;{subject}&quot; to <strong>{recipientCount}</strong> recipients.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Send at</Label>
            <Input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={sending || !scheduleDate}>{sending ? "Scheduling..." : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
