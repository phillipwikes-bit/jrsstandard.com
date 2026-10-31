#!/usr/bin/env python3
"""Offline admission of an unrecovered Decision Spellchecker source candidate.

The output establishes narrowly bounded file custody consistency, not historical
authenticity, software identity, valid human authorship, source equivalence,
licensable rights, or functional correctness. Never run this on participant data.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import stat
import sys
import unicodedata
import zipfile

CHUNK = 65536
DEFAULT_MAX_INPUT = 64 * 1024 * 1024
DEFAULT_MAX_TOTAL = 256 * 1024 * 1024
DEFAULT_MAX_MEMBERS = 4096
DEFAULT_MAX_RATIO = 200
DIR_FLAGS = os.O_RDONLY | getattr(os, "O_DIRECTORY", 0) | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_CLOEXEC", 0)
FILE_FLAGS = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_NONBLOCK", 0) | getattr(os, "O_CLOEXEC", 0)

class AdmissionError(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)

def components(path, absolute=False):
    if not isinstance(path, str) or not path or "\x00" in path:
        raise AdmissionError("INVALID_PATH")
    if absolute != path.startswith("/"):
        raise AdmissionError("PATH_MUST_BE_ABSOLUTE" if absolute else "RELATIVE_PATH_REQUIRED")
    raw = path.split("/")[1:] if absolute else path.split("/")
    if not raw or any(p in ("", ".", "..") for p in raw):
        raise AdmissionError("UNSAFE_PATH_COMPONENT")
    if any("\\" in p for p in raw):
        raise AdmissionError("UNSAFE_PATH_COMPONENT")
    return raw

def identity(s):
    return (s.st_dev, s.st_ino)

def signature(s):
    return (s.st_dev, s.st_ino, s.st_mode, s.st_nlink, s.st_size, s.st_mtime_ns, s.st_ctime_ns)

def open_parent(root, relative):
    root_parts = components(root, absolute=True)
    rel_parts = components(relative)
    visited = []
    fd = os.open("/", DIR_FLAGS)
    try:
        for part in root_parts + rel_parts[:-1]:
            next_fd = os.open(part, DIR_FLAGS, dir_fd=fd)
            os.close(fd)
            fd = next_fd
            visited.append((part, identity(os.fstat(fd))))
        return fd, visited, rel_parts[-1]
    except BaseException:
        os.close(fd)
        raise

def check_parent_stability(root, relpath, original):
    fd, visited, leaf = open_parent(root, relpath)
    try:
        if visited != original:
            raise AdmissionError("PARENT_PATH_CHANGED")
        return os.stat(leaf, dir_fd=fd, follow_symlinks=False)
    finally:
        os.close(fd)

def checked_member_name(name, seen):
    if not name or "\x00" in name or "\\" in name or name.startswith("/"):
        raise AdmissionError("UNSAFE_ARCHIVE_ENTRY")
    trimmed = name[:-1] if name.endswith("/") else name
    pieces = trimmed.split("/")
    if not trimmed or any(x in ("", ".", "..") or ":" in x for x in pieces):
        raise AdmissionError("UNSAFE_ARCHIVE_ENTRY")
    canonical = unicodedata.normalize("NFC", trimmed).casefold()
    if canonical in seen:
        raise AdmissionError("DUPLICATE_OR_CASE_COLLIDING_ENTRY")
    seen.add(canonical)
    return trimmed

def inspect_zip(fd, max_total, max_members):
    members = []
    total = 0
    seen = set()
    with os.fdopen(os.dup(fd), "rb") as file:
        try:
            with zipfile.ZipFile(file, "r") as archive:
                infos = archive.infolist()
                if len(infos) == 0 or len(infos) > max_members:
                    raise AdmissionError("ARCHIVE_MEMBER_COUNT_REJECTED")
                for info in infos:
                    path = checked_member_name(info.filename, seen)
                    mode = (info.external_attr >> 16) & 0xffff
                    kind = stat.S_IFMT(mode)
                    if kind == stat.S_IFLNK or (kind not in (0, stat.S_IFREG, stat.S_IFDIR)):
                        raise AdmissionError("NONREGULAR_ARCHIVE_ENTRY")
                    if info.flag_bits & 1:
                        raise AdmissionError("ENCRYPTED_ARCHIVE_ENTRY")
                    if info.is_dir():
                        if kind not in (0, stat.S_IFDIR):
                            raise AdmissionError("ARCHIVE_ENTRY_TYPE_CONFLICT")
                        continue
                    if kind == stat.S_IFDIR:
                        raise AdmissionError("ARCHIVE_ENTRY_TYPE_CONFLICT")
                    if path.lower().endswith((".zip", ".tar", ".tgz", ".tar.gz", ".7z")):
                        raise AdmissionError("NESTED_ARCHIVE_NOT_REVIEWED")
                    total += info.file_size
                    if info.file_size > max_total or total > max_total:
                        raise AdmissionError("ARCHIVE_EXPANSION_LIMIT")
                    if info.file_size and (not info.compress_size or info.file_size / info.compress_size > DEFAULT_MAX_RATIO):
                        raise AdmissionError("ARCHIVE_COMPRESSION_RATIO")
                    digest = hashlib.sha256()
                    count = 0
                    with archive.open(info, "r") as member:
                        while True:
                            part = member.read(CHUNK)
                            if not part:
                                break
                            count += len(part)
                            if count > info.file_size:
                                raise AdmissionError("ARCHIVE_SIZE_CONFLICT")
                            digest.update(part)
                    if count != info.file_size:
                        raise AdmissionError("ARCHIVE_SIZE_CONFLICT")
                    members.append({"relative_path": path, "size_bytes": count, "sha256": digest.hexdigest()})
        except (zipfile.BadZipFile, RuntimeError, EOFError, ValueError, OSError) as exc:
            raise AdmissionError("ZIP_INTEGRITY_FAILURE") from exc
    return members

def admit_candidate(root, relative, *, kind="zip", expected_sha256=None,
                    max_input=DEFAULT_MAX_INPUT, max_total=DEFAULT_MAX_TOTAL,
                    max_members=DEFAULT_MAX_MEMBERS, during_read=None):
    """The optional during_read callback exists solely for synthetic race tests."""
    if kind not in ("zip", "file"):
        raise AdmissionError("INVALID_CANDIDATE_KIND")
    if expected_sha256 is not None and (
        not isinstance(expected_sha256, str) or len(expected_sha256) != 64
        or any(c not in "0123456789abcdef" for c in expected_sha256)
    ):
        raise AdmissionError("INVALID_EXPECTED_SHA256")
    if not all(isinstance(x, int) and 0 < x <= 2**40 for x in (max_input, max_total, max_members)):
        raise AdmissionError("INVALID_LIMIT")
    try:
        parent, path_chain, leaf = open_parent(root, relative)
    except OSError as exc:
        raise AdmissionError("UNSAFE_OR_MISSING_DIRECTORY") from exc
    try:
        try:
            before_path = os.stat(leaf, dir_fd=parent, follow_symlinks=False)
            if not stat.S_ISREG(before_path.st_mode) or before_path.st_nlink != 1:
                raise AdmissionError("NOT_SINGLE_LINK_REGULAR_FILE")
            fd = os.open(leaf, FILE_FLAGS, dir_fd=parent)
        except OSError as exc:
            raise AdmissionError("UNSAFE_OR_MISSING_FILE") from exc
        try:
            before = os.fstat(fd)
            if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1:
                raise AdmissionError("NOT_SINGLE_LINK_REGULAR_FILE")
            if before.st_size > max_input:
                raise AdmissionError("INPUT_SIZE_LIMIT")
            if signature(before) != signature(before_path):
                raise AdmissionError("OPENED_FILE_CHANGED")
            h = hashlib.sha256()
            bytes_read = 0
            index = 0
            while True:
                part = os.pread(fd, min(CHUNK, max_input - bytes_read + 1), bytes_read)
                if not part:
                    break
                bytes_read += len(part)
                if bytes_read > max_input:
                    raise AdmissionError("INPUT_SIZE_LIMIT")
                h.update(part)
                if during_read is not None:
                    during_read(index)
                index += 1
            if bytes_read != before.st_size:
                raise AdmissionError("FILE_LENGTH_CHANGED")
            if kind == "zip":
                members = inspect_zip(fd, max_total, max_members)
            else:
                members = []
            if signature(os.fstat(fd)) != signature(before):
                raise AdmissionError("FILE_MODIFIED_DURING_READ")
            if signature(os.stat(leaf, dir_fd=parent, follow_symlinks=False)) != signature(before):
                raise AdmissionError("PATH_FILE_CHANGED")
            final_path = check_parent_stability(root, relative, path_chain)
            if signature(final_path) != signature(before):
                raise AdmissionError("PATH_FILE_CHANGED")
            digest = h.hexdigest()
            if expected_sha256 and digest != expected_sha256:
                raise AdmissionError("EXPECTED_DIGEST_MISMATCH")
            return {
                "schema": "jrs-original-source-candidate-custody-v1",
                "candidate_relative_path": relative,
                "kind": kind,
                "status": "CUSTODY_BYTES_STABLE_ONLY",
                "byte_count": bytes_read,
                "sha256": digest,
                "archive_members": members,
                "archive_members_count": len(members),
                "original_decision_spellchecker_identity": "NOT_AUTHENTICATED",
                "original_build_lineage": "NOT_VERIFIED",
                "software_performance": "NOT_EVALUATED",
                "human_authorship_and_rights": "NOT_DETERMINED",
                "permission": "OFFLINE_SYNTHETIC_OR_OWNER_AUTHORIZED_FILES_ONLY",
                "limitations": [
                    "An archive or file and its hashes cannot prove historical origin.",
                    "Metadata before/after catches observed changes, not every possible hostile race or privileged tampering.",
                    "Archives are inspected but never extracted or executed.",
                    "Nested archives are rejected rather than silently trusted.",
                    "No source equivalence, rights, operational effectiveness or release permission is inferred."
                ]
            }
        finally:
            os.close(fd)
    finally:
        os.close(parent)

def main(argv=None):
    parser = argparse.ArgumentParser(description="Offline, fail-closed original-source candidate intake")
    parser.add_argument("--root", required=True, help="Absolute directory with no symlink components")
    parser.add_argument("--candidate", required=True, help="Relative file path inside root")
    parser.add_argument("--kind", choices=["zip", "file"], default="zip")
    parser.add_argument("--expected-sha256")
    parser.add_argument("--max-input-bytes", type=int, default=DEFAULT_MAX_INPUT)
    args = parser.parse_args(argv)
    try:
        report = admit_candidate(args.root, args.candidate, kind=args.kind,
                                 expected_sha256=args.expected_sha256,
                                 max_input=args.max_input_bytes)
    except AdmissionError as exc:
        print(json.dumps({"schema":"jrs-original-source-candidate-custody-v1",
                          "status":"REJECTED", "code":exc.code,
                          "original_decision_spellchecker_identity":"NOT_AUTHENTICATED"}))
        return 2
    print(json.dumps(report, indent=2))
    return 0

if __name__ == "__main__":
    sys.exit(main())