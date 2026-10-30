#!/usr/bin/env python3
"""Offline reviewed-record formatter. No research, model, upload or send calls."""

import argparse
from collections import Counter
import csv
from datetime import date
import hashlib
import json
from pathlib import Path
import re
import sys


SEND_FIELDS = ["email", "first_name", "last_name", "company_name", "website",
               "linkedin", "outreach_subject", "outreach_body"]
REVIEW_FIELDS = ["lead_id", "source_rows", "company_name", "email", "disposition",
                 "research_reasons", "subject", "body", "human_review", "hold_reasons"]
DEFAULT_BANNED = ["hope this finds you well", "impressed by", "love what you are building",
                  "revolutionize", "unlock", "game-changing", "synergy", "10x", "guaranteed"]
EMAIL_RE = re.compile(r"[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+")
UNRESOLVED = re.compile(r"\{\{|\}\}|\b(?:TODO|TBD)\b|\[(?:first.?name|company|name|E\d+)\]", re.I)


def digest(batch, record):
    payload = {k: batch[k] for k in ("client_id", "campaign_id", "brief_version")}
    payload["export_policy"] = batch.get("export_policy", {})
    payload["record"] = {k: v for k, v in record.items() if k != "human_review"}
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def parse_date(value):
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return None


def formula_like(value):
    return isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@"))


def review_cell(value):
    text = str(value)
    return "'" + text if formula_like(text) else text


def load_batch(path):
    batch = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(batch, dict) or batch.get("schema_version") != 1:
        raise ValueError("Expected schema_version 1 batch object")
    for field in ("client_id", "campaign_id", "brief_version"):
        if not nonempty(batch.get(field)):
            raise ValueError(f"Missing {field}")
    records = batch.get("records")
    if not isinstance(records, list) or any(not isinstance(r, dict) for r in records):
        raise ValueError("records must be a list of objects")
    ids = [r.get("lead_id") for r in records]
    if any(not nonempty(x) for x in ids) or len(set(ids)) != len(ids):
        raise ValueError("Every record needs a unique nonempty lead_id")
    for record in records:
        for field in ("contact", "research", "draft", "qc", "export_checks", "human_review"):
            if not isinstance(record.get(field, {}), dict):
                raise ValueError(f"{record['lead_id']}: {field} must be an object")
    policy = batch.get("export_policy", {})
    if not isinstance(policy, dict):
        raise ValueError("export_policy must be an object")
    for key, default in (("max_contact_check_age_days", 30), ("max_body_words", 90)):
        value = policy.get(key, default)
        if type(value) is not int or value < 1:
            raise ValueError(f"export_policy.{key} must be a positive integer")
    banned = policy.get("banned_phrases", DEFAULT_BANNED)
    if not isinstance(banned, list) or any(not nonempty(p) for p in banned):
        raise ValueError("banned_phrases must be a list of nonempty strings")
    return batch


def hold_reasons(batch, record, email_counts, as_of):
    reasons = []
    contact = record.get("contact", {})
    research = record.get("research", {})
    draft = record.get("draft", {})
    qc = record.get("qc", {})
    checks = record.get("export_checks", {})
    human = record.get("human_review", {})
    policy = batch.get("export_policy", {})
    email = contact.get("email", "")
    if not isinstance(email, str) or not EMAIL_RE.fullmatch(email) or email != email.strip():
        reasons.append("missing or malformed email")
    elif email_counts[email.casefold()] > 1:
        reasons.append("duplicate email in batch; resolve every matching row")
    if not nonempty(contact.get("company_name")):
        reasons.append("missing company_name")
    rows = record.get("source_rows")
    if not isinstance(rows, list) or not rows or any(not nonempty(x) for x in rows):
        reasons.append("missing original source-row references")
    if research.get("disposition") != "qualified":
        reasons.append("research is not qualified")
    if research.get("identity_confidence") != "high":
        reasons.append("identity confidence is not high")

    evidence = research.get("evidence", [])
    if not isinstance(evidence, list) or any(not isinstance(e, dict) for e in evidence):
        evidence = []
        reasons.append("invalid evidence ledger")
    evidence_ids = [e.get("id") for e in evidence]
    if any(not nonempty(x) for x in evidence_ids) or len(set(evidence_ids)) != len(evidence_ids):
        reasons.append("missing or duplicate evidence IDs")
    evidence_map = {e["id"]: e for e in evidence if nonempty(e.get("id"))}

    def supported(ids):
        if not isinstance(ids, list) or not ids or any(not nonempty(i) for i in ids):
            return False
        for item in ids:
            e = evidence_map.get(item, {})
            observed = parse_date(e.get("observed_at"))
            if (e.get("verification") != "direct" or e.get("confidence") != "high"
                    or e.get("source_type") not in {"primary", "secondary", "provider", "supplied"}
                    or not nonempty(e.get("source_ref")) or not nonempty(e.get("claim"))
                    or not nonempty(e.get("reason")) or observed is None or observed > as_of):
                return False
        return True

    filters = research.get("hard_filters", [])
    if (not isinstance(filters, list) or not filters
            or any(not isinstance(f, dict) or not nonempty(f.get("rule"))
                   or f.get("status") != "pass" or not supported(f.get("evidence_ids")) for f in filters)):
        reasons.append("hard filters lack passed, directly checked high-confidence evidence")
    angle = research.get("best_angle", {})
    if (not isinstance(angle, dict) or not nonempty(angle.get("text"))
            or not supported(angle.get("evidence_ids"))):
        reasons.append("best angle lacks directly checked high-confidence evidence")
    claims = draft.get("claim_checks", [])
    if (not isinstance(claims, list) or not claims
            or any(not isinstance(c, dict) or not nonempty(c.get("claim"))
                   or not supported(c.get("evidence_ids")) for c in claims)):
        reasons.append("draft lacks supported factual-claim checks")

    subject, body = draft.get("subject", ""), draft.get("body", "")
    if not nonempty(subject) or not nonempty(body):
        reasons.append("missing subject or body")
    if isinstance(subject, str) and ("\n" in subject or "\r" in subject):
        reasons.append("subject contains a line break")
    copy = f"{subject}\n{body}"
    if UNRESOLVED.search(copy):
        reasons.append("unresolved placeholder or internal reference in copy")
    if isinstance(body, str) and len(body.split()) > policy.get("max_body_words", 90):
        reasons.append("body exceeds campaign word limit")
    normalized = " ".join(copy.casefold().split())
    for phrase in policy.get("banned_phrases", DEFAULT_BANNED):
        if re.search(r"(?<!\w)" + re.escape(" ".join(phrase.casefold().split())) + r"(?!\w)", normalized):
            reasons.append(f"banned phrase: {phrase}")
    if qc.get("status") != "pass" or qc.get("issues") != []:
        reasons.append("QC has not passed with no unresolved issues")
    if checks.get("contact_policy") != "pass" or not nonempty(checks.get("contact_check_ref")):
        reasons.append("contact verification policy/check reference missing")
    checked_at = parse_date(checks.get("checked_at"))
    max_age = policy.get("max_contact_check_age_days", 30)
    if checked_at is None or not 0 <= (as_of - checked_at).days <= max_age:
        reasons.append("contact/suppression check date missing, future or stale")
    if checks.get("suppression") != "clear" or not nonempty(checks.get("suppression_ref")):
        reasons.append("suppression check missing or not clear")
    if (human.get("status") != "approved" or not nonempty(human.get("reviewer"))
            or not nonempty(human.get("approval_ref"))):
        reasons.append("explicit human approval/reviewer/reference missing")
    reviewed_at = parse_date(human.get("reviewed_at"))
    if reviewed_at is None or reviewed_at > as_of:
        reasons.append("human review date missing or future")
    if human.get("fingerprint") != digest(batch, record):
        reasons.append("approval fingerprint missing or stale after record/policy changes")
    values = [contact.get(k, "") for k in SEND_FIELDS[:6]] + [subject, body]
    if any(not isinstance(v, str) for v in values):
        reasons.append("sending fields must be strings")
    if any(formula_like(v) for v in values):
        reasons.append("formula-like leading text in sending field; review without silently changing it")
    if any(isinstance(v, str) and "\x00" in v for v in values):
        reasons.append("NUL character in sending field")
    return reasons


def write_csv(path, fields, rows, escape=False):
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: review_cell(v) if escape else v for k, v in row.items()})


def export(batch, output_dir, as_of):
    email_counts = Counter(r.get("contact", {}).get("email", "").strip().casefold()
                           for r in batch["records"]
                           if isinstance(r.get("contact", {}).get("email", ""), str))
    sending, review, holds = [], [], []
    for record in batch["records"]:
        contact, research, draft = (record.get(k, {}) for k in ("contact", "research", "draft"))
        reasons = hold_reasons(batch, record, email_counts, as_of)
        if not reasons:
            row = {k: contact.get(k, "") for k in SEND_FIELDS[:6]}
            row.update(outreach_subject=draft["subject"], outreach_body=draft["body"])
            sending.append(row)
        else:
            holds.append({"lead_id": record["lead_id"], "reasons": reasons})
        review.append({"lead_id": record["lead_id"], "source_rows": json.dumps(record.get("source_rows", [])),
                       "company_name": contact.get("company_name", ""), "email": contact.get("email", ""),
                       "disposition": research.get("disposition", ""),
                       "research_reasons": json.dumps(research.get("reasons", []), ensure_ascii=False),
                       "subject": draft.get("subject", ""), "body": draft.get("body", ""),
                       "human_review": record.get("human_review", {}).get("status", "pending"),
                       "hold_reasons": "; ".join(reasons)})
    summary = {"client_id": batch["client_id"], "campaign_id": batch["campaign_id"],
               "as_of": as_of.isoformat(), "input_records": len(batch["records"]),
               "exported": len(sending), "held": len(holds), "holds": holds,
               "scope": "Offline formatting only; claims, deliverability and live import not verified."}
    output_dir.mkdir(parents=True, exist_ok=False)
    write_csv(output_dir / "instantly.csv", SEND_FIELDS, sending)
    write_csv(output_dir / "review.csv", REVIEW_FIELDS, review, escape=True)
    (output_dir / "export-summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    fingerprints = sub.add_parser("fingerprints", help="Calculate record versions; does not approve")
    fingerprints.add_argument("input", type=Path)
    formatter = sub.add_parser("export", help="Format eligible approved rows; never upload or send")
    formatter.add_argument("input", type=Path)
    formatter.add_argument("--output-dir", type=Path, required=True)
    formatter.add_argument("--as-of", type=date.fromisoformat, default=date.today())
    args = parser.parse_args()
    try:
        batch = load_batch(args.input)
        if args.command == "fingerprints":
            result = [{"lead_id": r["lead_id"], "fingerprint": digest(batch, r)} for r in batch["records"]]
        else:
            result = export(batch, args.output_dir, args.as_of)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except (OSError, ValueError, TypeError) as exc:
        parser.exit(2, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
