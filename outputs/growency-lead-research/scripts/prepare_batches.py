#!/usr/bin/env python3
"""Split a lead CSV into resumable input chunks. Offline; no AI or network calls."""

import argparse
import csv
import hashlib
import json
from pathlib import Path


def prepare(source, output_dir, mode='supplied-first', chunk_size=None):
    chunk_size = chunk_size if chunk_size is not None else (100 if mode == 'supplied-first' else 25)
    if type(chunk_size) is not int or chunk_size < 1:
        raise ValueError('chunk_size must be a positive integer')
    reserved = ['_research_row_id', '_research_input_record']
    # Read and validate before creating the output directory.
    with source.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        fields = reader.fieldnames
        if not fields or any(not f.strip() for f in fields) or len(fields) != len(set(fields)):
            raise ValueError('CSV needs unique nonempty column headers')
        if any(f in fields for f in reserved):
            raise ValueError('Input already contains reserved research tracking columns')
        rows = list(reader)
        if any(None in row or any(v is None for v in row.values()) for row in rows):
            raise ValueError('CSV contains a row with more or fewer fields than its header')
    output_dir.mkdir(parents=True, exist_ok=False)
    chunks = []
    for start in range(0, len(rows), chunk_size):
        name = f'chunk-{len(chunks) + 1:04d}.csv'
        current = rows[start:start + chunk_size]
        with (output_dir / name).open('w', encoding='utf-8-sig', newline='') as stream:
            writer = csv.DictWriter(stream, fieldnames=reserved + fields, quoting=csv.QUOTE_ALL)
            writer.writeheader()
            for offset, row in enumerate(current, start + 1):
                writer.writerow({**row, '_research_row_id': f'row-{offset:07d}', '_research_input_record': offset})
        chunks.append({'input': name, 'first_record': start + 1, 'last_record': start + len(current),
                       'rows': len(current), 'status': 'pending', 'output': None})
    manifest = {'schema_version': 1, 'input_file': str(source.resolve()),
                'input_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                'mode': mode, 'chunk_size': chunk_size, 'input_rows': len(rows),
                'completed_rows': 0, 'remaining_rows': len(rows), 'chunks': chunks,
                'scope': 'Input preparation only. No rows researched, qualified, drafted or sent.'}
    (output_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--output-dir', required=True, type=Path)
    parser.add_argument('--mode', choices=['supplied-first', 'web-light'], default='supplied-first')
    parser.add_argument('--chunk-size', type=int)
    args = parser.parse_args()
    try:
        manifest = prepare(args.input, args.output_dir, args.mode, args.chunk_size)
    except (OSError, ValueError, csv.Error) as exc:
        parser.exit(2, f'Error: {exc}\n')
    print(json.dumps({'input_rows': manifest['input_rows'], 'chunks': len(manifest['chunks']),
                      'chunk_size': manifest['chunk_size'], 'manifest': str(args.output_dir / 'manifest.json')}))


if __name__ == '__main__':
    main()
