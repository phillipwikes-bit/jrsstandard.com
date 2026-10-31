"""Fabricated-file adversarial regression tests. No original source or participant data."""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
import warnings
import zipfile

TOOL = Path(__file__).resolve().parents[1] / "tools" / "check-original-source-candidate.py"
spec = importlib.util.spec_from_file_location("jrs_source_candidate", TOOL)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SourceCandidateAdmission(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="jrs-fabricated-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.path = self.root / "fictional-source.zip"
        self.write_zip([("source/fictional.py", "def sample(): return 1\n")])

    def write_zip(self, pairs):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            with zipfile.ZipFile(self.path, "w", compression=zipfile.ZIP_DEFLATED) as z:
                for name, content in pairs:
                    z.writestr(name, content)

    def admit(self, **kwargs):
        return module.admit_candidate(str(self.root), "fictional-source.zip", **kwargs)

    def rejected(self, code, **kwargs):
        with self.assertRaises(module.AdmissionError) as error:
            self.admit(**kwargs)
        self.assertEqual(error.exception.code, code)

    def test_01_valid_archive_hashed_but_not_authenticated(self):
        report = self.admit()
        self.assertEqual(report["status"], "CUSTODY_BYTES_STABLE_ONLY")
        self.assertEqual(report["archive_members_count"], 1)
        self.assertEqual(report["archive_members"][0]["relative_path"], "source/fictional.py")
        self.assertEqual(report["sha256"], hashlib.sha256(self.path.read_bytes()).hexdigest())
        self.assertEqual(report["original_decision_spellchecker_identity"], "NOT_AUTHENTICATED")

    def test_02_matching_expected_digest_is_not_authentication(self):
        digest = hashlib.sha256(self.path.read_bytes()).hexdigest()
        self.assertEqual(self.admit(expected_sha256=digest)["human_authorship_and_rights"], "NOT_DETERMINED")

    def test_03_mismatched_expected_digest_rejected(self):
        self.rejected("EXPECTED_DIGEST_MISMATCH", expected_sha256="0" * 64)

    def test_04_invalid_expected_digest_rejected(self):
        self.rejected("INVALID_EXPECTED_SHA256", expected_sha256="not-a-digest")

    def test_05_relative_root_rejected(self):
        with self.assertRaises(module.AdmissionError):
            module.admit_candidate("relative", "fictional-source.zip")

    def test_06_parent_traversal_rejected(self):
        with self.assertRaises(module.AdmissionError):
            module.admit_candidate(str(self.root), "../fictional-source.zip")

    def test_07_absolute_candidate_path_rejected(self):
        with self.assertRaises(module.AdmissionError):
            module.admit_candidate(str(self.root), str(self.path))

    def test_08_leaf_symlink_rejected(self):
        link = self.root / "shortcut.zip"
        link.symlink_to(self.path)
        with self.assertRaises(module.AdmissionError):
            module.admit_candidate(str(self.root), "shortcut.zip")

    def test_09_parent_symlink_rejected(self):
        (self.root / "alias").symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(module.AdmissionError):
            module.admit_candidate(str(self.root), "alias/fictional-source.zip")

    def test_10_hardlink_rejected(self):
        os.link(self.path, self.root / "hardlink.zip")
        self.rejected("NOT_SINGLE_LINK_REGULAR_FILE")

    def test_11_fifo_rejected_without_blocking(self):
        os.mkfifo(self.root / "named-pipe")
        with self.assertRaises(module.AdmissionError):
            module.admit_candidate(str(self.root), "named-pipe")

    def test_12_archive_path_traversal_rejected(self):
        self.write_zip([("../escape.txt", "fake")])
        self.rejected("UNSAFE_ARCHIVE_ENTRY")

    def test_13_archive_backslash_path_rejected(self):
        self.write_zip([("a\\b.txt", "fake")])
        self.rejected("UNSAFE_ARCHIVE_ENTRY")

    def test_14_archive_duplicate_case_collisions_rejected(self):
        self.write_zip([("SOURCE/a.txt", "a"), ("source/A.txt", "b")])
        self.rejected("DUPLICATE_OR_CASE_COLLIDING_ENTRY")

    def test_15_archive_symlink_entry_rejected(self):
        entry = zipfile.ZipInfo("source/link")
        entry.create_system = 3
        entry.external_attr = (stat.S_IFLNK | 0o777) << 16
        self.write_zip([(entry, "target")])
        self.rejected("NONREGULAR_ARCHIVE_ENTRY")

    def test_16_nested_archive_rejected(self):
        self.write_zip([("src/embedded.zip", b"not-verified")])
        self.rejected("NESTED_ARCHIVE_NOT_REVIEWED")

    def test_17_oversized_expansion_rejected(self):
        self.write_zip([("big.dat", b"0123456789" * 1024)])
        self.rejected("ARCHIVE_EXPANSION_LIMIT", max_total=100)

    def test_18_high_compression_ratio_rejected(self):
        self.write_zip([("huge.txt", "Z" * 200000)])
        self.rejected("ARCHIVE_COMPRESSION_RATIO")

    def test_19_input_size_cap_rejected(self):
        self.rejected("INPUT_SIZE_LIMIT", max_input=8)

    def test_20_in_place_mutation_even_with_restored_mtime_rejected(self):
        old = self.path.stat()
        def tamper(index):
            if index == 0:
                self.path.write_bytes(b"x" * old.st_size)
                os.utime(self.path, ns=(old.st_atime_ns, old.st_mtime_ns))
        with self.assertRaises(module.AdmissionError):
            self.admit(during_read=tamper)

    def test_21_atomic_path_substitution_rejected(self):
        previous = self.root / "old-source.zip"
        def tamper(index):
            if index == 0:
                self.path.rename(previous)
                self.path.write_bytes(previous.read_bytes())
        with self.assertRaises(module.AdmissionError):
            self.admit(during_read=tamper)

    def test_22_parent_directory_substitution_rejected(self):
        original = self.root / "inner"
        original.mkdir()
        nested = original / "inside.zip"
        nested.write_bytes(self.path.read_bytes())
        def tamper(index):
            if index == 0:
                original.rename(self.root / "inner_old")
                original.mkdir()
                (original / "inside.zip").write_bytes((self.root / "inner_old" / "inside.zip").read_bytes())
        with self.assertRaises(module.AdmissionError) as caught:
            module.admit_candidate(str(self.root), "inner/inside.zip", during_read=tamper)
        self.assertEqual(caught.exception.code, "PARENT_PATH_CHANGED")

    def test_23_file_kind_does_not_claim_source_equivalence(self):
        result = self.admit(kind="file")
        self.assertEqual(result["archive_members_count"], 0)
        self.assertEqual(result["original_build_lineage"], "NOT_VERIFIED")

    def test_24_corrupt_crc_rejected(self):
        with zipfile.ZipFile(self.path, "w", compression=zipfile.ZIP_STORED) as z:
            z.writestr("test.txt", "CRC-EXAMPLE-12345")
        contents = self.path.read_bytes().replace(b"CRC-EXAMPLE-12345", b"CRC-EXAMPLE-12344", 1)
        self.path.write_bytes(contents)
        self.rejected("ZIP_INTEGRITY_FAILURE")

    def test_25_zero_length_raw_candidate_allowed_but_unverified(self):
        self.path.write_bytes(b"")
        report = self.admit(kind="file")
        self.assertEqual(report["byte_count"], 0)
        self.assertEqual(report["status"], "CUSTODY_BYTES_STABLE_ONLY")

    def test_26_cli_failure_is_structured_with_no_file_content(self):
        process = subprocess.run(
            [sys.executable, str(TOOL), "--root", str(self.root),
             "--candidate", "fictional-source.zip", "--expected-sha256", "0" * 64],
            text=True, capture_output=True, timeout=5)
        self.assertEqual(process.returncode, 2)
        response = json.loads(process.stdout)
        self.assertEqual(response["status"], "REJECTED")
        self.assertEqual(response["code"], "EXPECTED_DIGEST_MISMATCH")
        self.assertNotIn("def sample", process.stdout + process.stderr)

    def test_27_cli_valid_output_never_says_verified_original(self):
        process = subprocess.run(
            [sys.executable, str(TOOL), "--root", str(self.root), "--candidate", "fictional-source.zip"],
            text=True, capture_output=True, timeout=5)
        self.assertEqual(process.returncode, 0, process.stderr)
        data = json.loads(process.stdout)
        self.assertEqual(data["original_decision_spellchecker_identity"], "NOT_AUTHENTICATED")
        self.assertEqual(data["software_performance"], "NOT_EVALUATED")

if __name__ == "__main__":
    unittest.main()