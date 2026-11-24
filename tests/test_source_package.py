"""Verify credential exclusion and redaction on synthetic temporary source trees."""
from pathlib import Path
import tempfile
import unittest
from scripts.source_package import selected_files, secret_findings, audit


class SourcePackageTests(unittest.TestCase):
    def test_env_credentials_builds_and_raw_exports_are_excluded(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            for name in ['README.md','frontend/app/page.tsx','frontend/.env.production',
                         'frontend/public/credentials.json','frontend/public/api_keys.json','frontend/.next/bundle.js',
                         'frontend/node_modules/lib/index.js','v0UpdatedFrontEnd/app/page.tsx',
                         '.env.local','backend/secrets/account.json','backend/example.py']:
                p=root/name; p.parent.mkdir(parents=True, exist_ok=True); p.write_text('fixture')
            names={p.relative_to(root).as_posix() for p in selected_files(root)}
            self.assertEqual(names, {'README.md','frontend/app/page.tsx','backend/example.py'})

    def test_tokens_in_source_are_blocked_without_values_in_diagnostics(self):
        token = 'gh' + 'p_' + 'A' * 36
        with tempfile.TemporaryDirectory() as t:
            root = Path(t); p=root/'README.md'; p.write_text('Synthetic token: '+token)
            found=audit(root, selected_files(root))
            self.assertEqual(found[0]['rule'], 'github-token')
            self.assertNotIn(token,str(found))
        literal = 'API_' + 'KEY = "' + 'B' * 32 + '"'
        self.assertTrue(secret_findings(literal.encode()))

    def test_symlink_outside_project_cannot_be_packaged(self):
        with tempfile.TemporaryDirectory() as t, tempfile.TemporaryDirectory() as out:
            root=Path(t); outside=Path(out)/'note.txt'; outside.write_text('fixture')
            (root/'README.md').symlink_to(outside)
            with self.assertRaises(ValueError): selected_files(root)
