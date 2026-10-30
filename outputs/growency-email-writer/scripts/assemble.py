"""Assemble fixed email copy around generated openings without model calls."""
import argparse
import json
import re
from pathlib import Path


INFRATEX_GREETINGS = ('Hey', 'Hi', 'Hello')
INFRATEX_SIGN_OFFS = ('Best regards,', 'Kind regards,', 'Best,', 'Thanks,', 'Cheers,')


POSTINGMACHINE_BODY = "At Posting Machine, we run founders’ and businesses’ LinkedIn. We have generated over 2 million impressions for our clients, including multiple YC ones."
POSTINGMACHINE_CTA = "Give us 12 minutes on a call next week to persuade you. You’ll be getting inbounds like crazy within weeks."
POSTINGMACHINE_GREETINGS = ('Hey', 'Hi', 'Hello')
POSTINGMACHINE_SIGN_OFFS = ('Best regards,', 'Kind regards,', 'Best,', 'Thanks,', 'Cheers,')


def assemble_postingmachine(row, variants, index):
    result = dict(row)
    subject = str(row.get('subject') or '').strip().lower()
    result['subject'] = subject
    opening = str(row.get('opening') or '').strip()
    if not subject:
        return {**result, 'status': 'needs_subject'}, index
    if not opening:
        return {**result, 'status': 'needs_hook'}, index
    if len(variants) != 1 or variants[0].get('body') != POSTINGMACHINE_BODY or variants[0].get('cta') != POSTINGMACHINE_CTA:
        return {**result, 'status': 'revise_postingmachine_fixed_copy'}, index
    style = row.get('style')
    frame = str(row.get('frame') or '')
    allowed = {'firm': {'firm-weak', 'firm-founder', 'firm-developing', 'firm-strong', 'firm-direct'},
               'gentle': {'gentle-favourite', 'gentle-enthusiastic', 'gentle-feature', 'gentle-developing'}}
    if style not in allowed or frame not in allowed[style]:
        return {**result, 'status': 'needs_style_or_frame'}, index
    presence = str(row.get('presence') or 'Unverified').lower()
    required = {'firm-weak': 'limited', 'firm-developing': 'developing', 'firm-strong': 'established', 'gentle-developing': 'developing'}
    if frame in required and (presence != required[frame] or row.get('presence_verified') is not True):
        return {**result, 'status': 'needs_activity_evidence'}, index
    if frame == 'gentle-favourite' and row.get('yc_confirmed') is not True:
        return {**result, 'status': 'needs_yc_evidence'}, index
    activity_claim = re.search(r"aren[’']t posting|not posting much|started posting|consistent LinkedIn|solid LinkedIn presence|been watching", opening, re.I)
    if activity_claim and row.get('presence_verified') is not True:
        return {**result, 'status': 'needs_activity_evidence'}, index
    name = str(row.get('name') or 'there').strip() or 'there'
    greeting = POSTINGMACHINE_GREETINGS[index % 3]
    closing = POSTINGMACHINE_SIGN_OFFS[index % 5]
    email = f'{greeting} {name},\n\n' + '\n\n'.join([opening, POSTINGMACHINE_BODY, POSTINGMACHINE_CTA, closing])
    if '\u2014' in email or '\u2014' in subject:
        return {**result, 'status': 'revise_em_dash'}, index
    if re.search(r'\[[^\]]+\]|\{\{[^}]+\}\}', email):
        return {**result, 'status': 'needs_hook'}, index
    return {**result, 'opening': opening, 'variant': 1, 'email': email, 'status': 'draft', 'greeting': greeting, 'sign_off': closing}, index + 1


def format_postingmachine_followup(body, lead_index, step, name='there'):
    if step not in (1, 2):
        raise ValueError('Use follow-up step 1 or 2')
    text = str(body).strip()
    text = re.sub(r'^(?:Hey|Hi|Hello) [^,\n]+,\s*\n+', '', text, count=1)
    if not text or '\u2014' in text:
        raise ValueError('Follow-up needs usable copy without an em dash')
    greeting = POSTINGMACHINE_GREETINGS[(lead_index + step) % 3]
    closing = POSTINGMACHINE_SIGN_OFFS[(lead_index + step) % 5]
    return f'{greeting} {name or "there"},\n\n{text}\n\n{closing}'


def assemble(row, variants, index, client=None, service_by_icp=None):
    if client == 'postingmachine':
        return assemble_postingmachine(row, variants, index)
    result = dict(row)
    if 'subject' in result:
        result['subject'] = str(result['subject'] or '').lower()
    opening = str(row.get('opening') or '').strip()
    if not variants:
        return {**result, 'status': 'company_copy_pending'}, index
    variant_index = 0 if client == 'infratex' else (index // 2) % len(variants)
    if client == 'infratex':
        services = service_by_icp or {}
        icp = str(row.get('icp') or '').strip()
        service = services.get(icp)
        if not service:
            return {**result, 'status': 'needs_icp'}, index
        subject = result.get('subject', '')
        prefixes = ('helping you ', 'let us automate your ')
        if not any(subject.startswith(prefix) and subject[len(prefix):].strip() for prefix in prefixes):
            return {**result, 'status': 'needs_subject'}, index
        selector = row.get('template', variants[index % len(variants)].get('id'))
        if type(selector) is int and 1 <= selector <= len(variants):
            variant_index = selector - 1
        elif isinstance(selector, str):
            matches = [i for i, v in enumerate(variants) if v.get('id') == selector]
            if not matches:
                return {**result, 'status': 'invalid_template'}, index
            variant_index = matches[0]
        else:
            return {**result, 'status': 'invalid_template'}, index
        variant = variants[variant_index]
        template = variant.get('opening_template')
        help_template = variant.get('help_template')
        if not template or not help_template:
            return {**result, 'status': 'company_copy_pending'}, index
        fields = row.get('fields')
        required = list(dict.fromkeys(re.findall(r'\[([^\[\]]+)\]', template + help_template)))
        if not isinstance(fields, dict):
            return {**result, 'status': 'needs_hook', 'missing_fields': required}, index
        missing = [key for key in required if not isinstance(fields.get(key), str) or not fields[key].strip() or '\n' in fields[key] or '\r' in fields[key] or '[' in fields[key] or ']' in fields[key]]
        if missing:
            return {**result, 'status': 'needs_hook', 'missing_fields': missing}, index
        opening = re.sub(r'\[([^\[\]]+)\]', lambda match: fields[match[1]].strip(), template)
        help_paragraph = re.sub(r'\[([^\[\]]+)\]', lambda match: fields[match[1]].strip(), help_template)
        result['opening'] = opening
        result['template'] = variants[variant_index]['id']
        result['icp'] = icp
    if not opening:
        return {**result, 'status': 'needs_hook'}, index
    variant = variants[variant_index]
    name = str(row.get('name') or 'there').strip() or 'there'
    cta = variant.get('cta') or 'You got 12 minutes this week for a quick call?'
    greeting = 'Hey'
    paragraphs = [opening, service, help_paragraph] if client == 'infratex' else [opening, variant['body']]
    if client == 'infratex':
        greeting = INFRATEX_GREETINGS[index % len(INFRATEX_GREETINGS)]
        proof = variant.get('proof')
        if not proof or not variant.get('cta'):
            return {**result, 'status': 'company_copy_pending'}, index
        paragraphs.append(proof)
    paragraphs.append(cta)
    if client == 'infratex':
        sign_off = INFRATEX_SIGN_OFFS[index % len(INFRATEX_SIGN_OFFS)]
        paragraphs.append(f'{sign_off}\nChinmay')
    email = f"{greeting} {name},\n\n" + '\n\n'.join(paragraphs)
    if '\u2014' in email or '\u2014' in result.get('subject', ''):
        return {**result, 'status': 'revise_em_dash'}, index
    return {**result, 'variant': variant_index + 1, 'email': email, 'status': 'draft'}, index + 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--client', required=True)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--start', type=int, default=0)
    parser.add_argument('--copy', type=Path, default=Path(__file__).resolve().parents[1] / 'references/company-copy.json')
    args = parser.parse_args()
    if args.start < 0 or args.input.resolve() == args.output.resolve():
        parser.error('Use a nonnegative start and different input/output paths')
    copy = json.loads(args.copy.read_text(encoding='utf-8'))
    if args.client not in copy:
        parser.error('Client missing from copy config')
    index, rows, pending = args.start, 0, 0
    with args.input.open(encoding='utf-8') as source, args.output.open('w', encoding='utf-8') as target:
        for line_number, line in enumerate(source, 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
                if not isinstance(row, dict):
                    raise ValueError('Row must be an object')
                result, index = assemble(row, copy[args.client], index, client=args.client,
                                         service_by_icp=copy.get('infratex_service_by_icp'))
            except (ValueError, TypeError) as error:
                result = {'line': line_number, 'status': 'invalid_row', 'error': str(error)}
            target.write(json.dumps(result, ensure_ascii=False) + '\n')
            rows += 1
            pending += result['status'] != 'draft'
    print(json.dumps({'rows': rows, 'drafted': rows - pending, 'pending': pending, 'next_start': index}))


if __name__ == '__main__':
    main()
