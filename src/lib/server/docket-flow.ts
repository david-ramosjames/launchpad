import type {
  AttorneyScoreSummary,
  TodayDeadline,
  TodayMeeting,
} from "@/types/today";

const FIRM_TIME_ZONE = "America/Chicago";
const PAGE_SIZE = 1000;
const SCORE_CACHE_MS = 5 * 60 * 1000;

function supabaseConfig() {
  const url = process.env.DOCKET_FLOW_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.DOCKET_FLOW_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Docket Flow is not configured. Set DOCKET_FLOW_SUPABASE_URL and DOCKET_FLOW_SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return { url, key };
}

async function selectAll<T>(table: string, query: string): Promise<T[]> {
  const { url, key } = supabaseConfig();
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Range-Unit": "items",
        Range: `${from}-${from + PAGE_SIZE - 1}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Docket Flow query on ${table} failed (${res.status})`);
    }
    const page = (await res.json()) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export function firmToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FIRM_TIME_ZONE }).format(new Date());
}

interface ContactRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
}

async function loadContacts(): Promise<ContactRow[]> {
  return selectAll<ContactRow>("contacts", "select=id,name,email,role");
}

// ---------------------------------------------------------------------------
// Today's calendar
// ---------------------------------------------------------------------------

interface EventRow {
  id: string;
  case_id: string | null;
  title: string | null;
  start_date_time: string | null;
  end_date_time: string | null;
  event_kind: string | null;
  zoom_link: string | null;
  completed: boolean | null;
  created_by_email: string | null;
  google_calendar_event_ids_by_email: Record<string, unknown> | null;
  extra_internal_contact_ids: string[] | null;
}

interface CaseRow {
  id: string;
  case_number: string | null;
  client_name: string | null;
  name: string | null;
}

export async function getTodaysSchedule(options: {
  email: string;
  includeEveryone: boolean;
}): Promise<{ date: string; meetings: TodayMeeting[]; deadlines: TodayDeadline[] }> {
  const date = firmToday();
  const email = options.email.toLowerCase();

  const [events, contacts] = await Promise.all([
    selectAll<EventRow>(
      "case_events",
      [
        "select=id,case_id,title,start_date_time,end_date_time,event_kind,zoom_link,completed,created_by_email,google_calendar_event_ids_by_email,extra_internal_contact_ids",
        `date=eq.${date}`,
        "included=not.is.false",
        "noise_flag=not.is.true",
        "order=start_date_time.asc.nullsfirst",
      ].join("&")
    ),
    loadContacts(),
  ]);

  const myContactIds = new Set(
    contacts.filter((c) => c.email?.toLowerCase().trim() === email).map((c) => c.id)
  );

  const isMine = (event: EventRow) => {
    const invited = Object.keys(event.google_calendar_event_ids_by_email ?? {}).some(
      (key) => key.toLowerCase() === email
    );
    if (invited) return true;
    if (event.created_by_email?.toLowerCase() === email) return true;
    return (event.extra_internal_contact_ids ?? []).some((id) => myContactIds.has(id));
  };

  const visible = options.includeEveryone ? events : events.filter(isMine);

  const caseIds = [...new Set(visible.map((e) => e.case_id).filter((id): id is string => !!id))];
  const cases = caseIds.length
    ? await selectAll<CaseRow>(
        "cases",
        `select=id,case_number,client_name,name&id=in.(${caseIds.join(",")})`
      )
    : [];
  const caseById = new Map(cases.map((c) => [c.id, c]));

  const meetings: TodayMeeting[] = [];
  const deadlines: TodayDeadline[] = [];

  for (const event of visible) {
    const linkedCase = event.case_id ? caseById.get(event.case_id) : undefined;
    const base = {
      id: event.id,
      title: event.title?.trim() || "Untitled event",
      caseNumber: linkedCase?.case_number ?? null,
      clientName: linkedCase?.client_name ?? linkedCase?.name ?? null,
      completed: Boolean(event.completed),
    };

    if (event.start_date_time) {
      meetings.push({
        ...base,
        start: event.start_date_time,
        end: event.end_date_time,
        zoomLink: event.zoom_link?.trim() || null,
      });
    } else {
      deadlines.push(base);
    }
  }

  meetings.sort((a, b) => a.start.localeCompare(b.start));
  return { date, meetings, deadlines };
}

// ---------------------------------------------------------------------------
// Attorney case scores (mirrors attorney-case-tracker/src/lib/attorney-score.ts)
// ---------------------------------------------------------------------------

const VALIDATION_DAYS = 90;
const COMPLETENESS_WEIGHT = 0.4;
const FRESHNESS_WEIGHT = 0.6;
const CLOSED_STAGES = new Set(["Disengaged", "Terminated", "Referred"]);
const EXCLUDED_ATTORNEY_NAMES = new Set(["referred"]);

interface TrackerEntryRow {
  id: string;
  case_id: string | null;
  case_stage: string | null;
  case_type: string | null;
  attorney_contact_id: string | null;
  liability: string | null;
  target_resolution_quarter: string | null;
  minimum_value: number | null;
  referral_fee: number | null;
  policy_limits: number | null;
  policy_info_source: string | null;
  liability_validated_at: string | null;
  target_resolution_quarter_validated_at: string | null;
  minimum_value_validated_at: string | null;
  policy_limits_validated_at: string | null;
}

interface ResultRow {
  tracker_entry_id: string | null;
  disbursed_status: string | null;
  disburse_date: string | null;
}

const filled = (value: string | null | undefined) => Boolean(value?.trim());

/** Stored stage values vary ("Settlement", "DISENGAGED", …); mirrors the tracker's normalizeStage. */
function normalizeStage(value: string | null): string {
  const v = value?.toLowerCase();
  if (v === "lit" || v === "litigation" || v === "litigated") return "Lit";
  if (v === "txt" || v === "treatment") return "Txt";
  if (v === "dmd" || v === "demand") return "Dmd";
  if (v === "settled" || v === "settlement" || v === "set") return "Settled";
  if (v === "disengaged" || v === "disengaging") return "Disengaged";
  if (v === "referred") return "Referred";
  if (v === "terminated" || v === "closed") return "Terminated";
  return "Onboarding";
}

function isFresh(validatedAt: string | null, now: number) {
  if (!validatedAt) return false;
  const time = Date.parse(validatedAt);
  if (Number.isNaN(time)) return false;
  return (now - time) / 86_400_000 < VALIDATION_DAYS;
}

function scoreEntry(entry: TrackerEntryRow, caseType: string | null, now: number) {
  const completeness = [
    filled(caseType),
    filled(entry.liability),
    filled(entry.target_resolution_quarter),
    entry.minimum_value != null,
    entry.referral_fee != null,
    entry.policy_limits != null,
    filled(entry.policy_info_source),
  ];
  const completenessPercent = Math.round(
    (completeness.filter(Boolean).length / completeness.length) * 100
  );

  const liability = entry.liability?.trim() ?? "";
  const liabilityFresh =
    (liability !== "" && liability !== "Pending") ||
    (liability !== "" && isFresh(entry.liability_validated_at, now));

  const freshness = [
    liabilityFresh,
    filled(entry.target_resolution_quarter) &&
      isFresh(entry.target_resolution_quarter_validated_at, now),
    entry.minimum_value != null && isFresh(entry.minimum_value_validated_at, now),
    entry.policy_limits != null && isFresh(entry.policy_limits_validated_at, now),
  ];
  const freshnessPercent = Math.round(
    (freshness.filter(Boolean).length / freshness.length) * 100
  );

  return {
    percent: Math.round(
      completenessPercent * COMPLETENESS_WEIGHT + freshnessPercent * FRESHNESS_WEIGHT
    ),
    completenessPercent,
    freshnessPercent,
    outdated: freshness.some((ok) => !ok),
  };
}

let scoreCache: { at: number; data: AttorneyScoreSummary[] } | null = null;

export async function getAttorneyScores(): Promise<AttorneyScoreSummary[]> {
  if (scoreCache && Date.now() - scoreCache.at < SCORE_CACHE_MS) return scoreCache.data;

  const [entries, results, cases, contacts] = await Promise.all([
    selectAll<TrackerEntryRow>(
      "case_tracker_entries",
      "select=id,case_id,case_stage,case_type,attorney_contact_id,liability,target_resolution_quarter,minimum_value,referral_fee,policy_limits,policy_info_source,liability_validated_at,target_resolution_quarter_validated_at,minimum_value_validated_at,policy_limits_validated_at"
    ),
    selectAll<ResultRow>(
      "case_tracker_results",
      "select=tracker_entry_id,disbursed_status,disburse_date"
    ),
    selectAll<{ id: string; case_type: string | null }>("cases", "select=id,case_type"),
    loadContacts(),
  ]);

  const resultByEntry = new Map(results.map((r) => [r.tracker_entry_id, r]));
  const caseTypeById = new Map(cases.map((c) => [c.id, c.case_type]));
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const now = Date.now();

  const byAttorney = new Map<string, ReturnType<typeof scoreEntry>[]>();

  for (const entry of entries) {
    const stage = normalizeStage(entry.case_stage);
    if (CLOSED_STAGES.has(stage)) continue;
    const result = resultByEntry.get(entry.id);
    const fullyDisbursed = result?.disbursed_status === "Yes" && filled(result.disburse_date);
    if (stage === "Settled" && fullyDisbursed) continue;

    const attorney = entry.attorney_contact_id
      ? contactById.get(entry.attorney_contact_id)
      : undefined;
    const name = attorney?.name?.trim();
    if (!attorney || !name || EXCLUDED_ATTORNEY_NAMES.has(name.toLowerCase())) continue;

    const caseType =
      entry.case_id && caseTypeById.has(entry.case_id)
        ? caseTypeById.get(entry.case_id) ?? null
        : entry.case_type;

    const list = byAttorney.get(attorney.id) ?? [];
    list.push(scoreEntry(entry, caseType, now));
    byAttorney.set(attorney.id, list);
  }

  const average = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;

  const data = [...byAttorney.entries()]
    .map(([attorneyId, scores]) => ({
      attorneyId,
      name: contactById.get(attorneyId)?.name?.trim() ?? "Unknown",
      caseCount: scores.length,
      averageScore: average(scores.map((s) => s.percent)),
      averageCompleteness: average(scores.map((s) => s.completenessPercent)),
      averageFreshness: average(scores.map((s) => s.freshnessPercent)),
      casesNeedingUpdate: scores.filter((s) => s.outdated).length,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  scoreCache = { at: Date.now(), data };
  return data;
}
