"""cards.json -> .apkg with the official `anki` package (decision D16).

A persistent build collection keeps the note types (and their internal ids) across builds, so Anki recognizes
them on every re-import and updates notes by GUID instead of creating duplicates. Verified 2026-11-10 with
anki 26.9.4: re-import updates edited notes, keeps scheduling, review counts and suspension, and adds no
note types. Deck options are not exported; imported decks use the Default preset.

Usage: build_apkg.py --cards cards.json --collection build.anki2 --out study.apkg
Prints one JSON summary line on stdout.
"""

import argparse
import json
import os
import shutil
import sys
import time

from anki.collection import Collection, ExportAnkiPackageOptions

FIELDS = ["StableId", "Front", "Back", "Source"]
REMOVED_TAG = "study-engine::removed"
KEEP_BACKUPS = 10

CSS = """
.card { font-family: -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; font-size: 20px;
        line-height: 1.55; text-align: left; color: #1f1f1f; background: #fbfaf7; padding: 4px 8px; }
.nightMode.card, .card.nightMode { color: #e8e6e1; background: #1e1e1e; }
pre { white-space: pre-wrap; font-size: 15px; background: rgba(127,127,127,.12); padding: 10px 12px; border-radius: 6px; }
code { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
ul { padding-left: 1.2em; margin: .4em 0; } li { margin: .25em 0; }
.math { margin: .6em 0; }
.se-hint { margin-top: 1em; font-size: 14px; opacity: .6; }
.se-source { margin-top: 1.2em; font-size: 13px; opacity: .55; }
hr#answer { margin: 1em 0; opacity: .4; }
"""

NOTE_TYPES = {
    "StudyEngine Basic v1": (
        '<div class="se-front">{{Front}}</div>',
        '{{FrontSide}}<hr id=answer><div class="se-back">{{Back}}</div><div class="se-source">{{Source}}</div>',
    ),
    "StudyEngine Formula v1": (
        '<div class="se-front se-formula">{{Front}}</div>',
        '{{FrontSide}}<hr id=answer><div class="se-back">{{Back}}</div><div class="se-source">{{Source}}</div>',
    ),
    "StudyEngine Explain v1": (
        '<div class="se-front">{{Front}}</div><div class="se-hint">먼저 소리 내어 설명해 본 뒤 뒤집기</div>',
        '{{FrontSide}}<hr id=answer><div class="se-back se-points">{{Back}}</div><div class="se-source">{{Source}}</div>',
    ),
}


def ensure_note_types(col):
    """Create missing note types once. Existing ones are never modified (that would be a schema change)."""
    out = {}
    for name, (qfmt, afmt) in NOTE_TYPES.items():
        nt = col.models.by_name(name)
        if not nt:
            mm = col.models
            nt = mm.new(name)
            for field in FIELDS:
                mm.add_field(nt, mm.new_field(field))
            tmpl = mm.new_template("Card 1")
            tmpl["qfmt"], tmpl["afmt"] = qfmt, afmt
            mm.add_template(nt, tmpl)
            nt["css"] = CSS
            mm.add(nt)
            nt = col.models.by_name(name)
        out[name] = nt
    return out


def backup(collection_path):
    if not os.path.exists(collection_path):
        return
    folder = os.path.join(os.path.dirname(collection_path), "backups")
    os.makedirs(folder, mode=0o700, exist_ok=True)
    shutil.copy2(collection_path, os.path.join(folder, time.strftime("build-%Y%m%d-%H%M%S.anki2")))
    olds = sorted(f for f in os.listdir(folder) if f.startswith("build-"))
    for f in olds[:-KEEP_BACKUPS]:
        os.remove(os.path.join(folder, f))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cards", required=True)
    ap.add_argument("--collection", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    with open(args.cards, encoding="utf-8") as fh:
        data = json.load(fh)
    os.makedirs(os.path.dirname(args.collection), mode=0o700, exist_ok=True)
    backup(args.collection)

    index_path = os.path.join(os.path.dirname(args.collection), "index.json")
    index = {}
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as fh:
            index = json.load(fh)  # guid -> sourceId

    col = Collection(args.collection)
    try:
        types = ensure_note_types(col)
        existing = {guid: nid for nid, guid in col.db.all("select id, guid from notes")}
        counts = {"new": 0, "updated": 0, "unchanged": 0, "removed": 0, "restored": 0, "type_conflict": 0}
        current = set()

        for item in data["notes"]:
            guid = item["guid"]
            current.add(guid)
            index[guid] = item["sourceId"]
            nt = types[item["noteType"]]
            did = col.decks.id(item["deck"])
            tags = sorted(set(item["tags"]))
            if guid in existing:
                note = col.get_note(existing[guid])
                if note.mid != nt["id"]:
                    counts["type_conflict"] += 1
                    continue
                restored = REMOVED_TAG in note.tags
                changed = restored or any(note[f] != item["fields"][f] for f in FIELDS) or sorted(note.tags) != tags
                if changed:
                    for f in FIELDS:
                        note[f] = item["fields"][f]
                    note.tags = tags
                    col.update_note(note)
                for card in note.cards():
                    if card.did != did:
                        card.did = did
                        col.update_card(card)
                        changed = True
                counts["restored" if restored else ("updated" if changed else "unchanged")] += 1
            else:
                note = col.new_note(nt)
                note.guid = guid
                for f in FIELDS:
                    note[f] = item["fields"][f]
                note.tags = tags
                col.add_note(note, did)
                counts["new"] += 1

        # Cards gone from a source that is part of this build are tagged, never deleted (D6).
        built_sources = set(data["sources"])
        for guid, nid in existing.items():
            if guid in current or index.get(guid) not in built_sources:
                continue
            note = col.get_note(nid)
            if REMOVED_TAG not in note.tags:
                note.tags = note.tags + [REMOVED_TAG]
                col.update_note(note)
                counts["removed"] += 1

        col.export_anki_package(
            out_path=args.out,
            options=ExportAnkiPackageOptions(with_scheduling=False, with_deck_configs=False, with_media=True, legacy=False),
            limit=None,
        )
        counts["total_notes"] = col.note_count()
    finally:
        col.close()

    with open(index_path, "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, indent=1)
    print(json.dumps(counts))


if __name__ == "__main__":
    sys.exit(main())
