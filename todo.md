# Project TODO

- [x] Map every requested Evidence OS requirement to a deterministic feature and test.
- [ ] Implement a shared deterministic text extraction interface for plain text, PDF, and DOCX resume inputs.
- [ ] Implement fixed section segmentation with a versioned allowlist and hostile-content isolation.
- [ ] Implement deterministic extraction for the 10 required evidence-backed candidate fields.
- [ ] Implement explicit field statuses, machine-readable errors, and human-readable diagnostic reasons.
- [ ] Implement deterministic JD requirement extraction, matching, scoring, and stable candidate ranking.
- [ ] Implement real reproducibility verification through a second pipeline run and output diff.
- [ ] Implement a CLI that uses the same pipeline as the web application.
- [ ] Implement tRPC analysis procedures and safe browser-upload input handling.
- [ ] Build a polished recruiter-grade analysis workspace with JD input, candidate input, and analysis controls.
- [ ] Build candidate ranking, evidence graph, Why Not 100, Trust Center, and determinism views.
- [ ] Add three resume fixtures plus JD fixtures for clean, messy, and missing-field test scenarios.
- [ ] Write and run automated tests for extraction, segmentation, all field statuses, evidence, matching, reproducibility, malformed files, hostile content, and batch ranking.
- [ ] Create REPORT.md with verified implementation details, test results, limitations, and exact run instructions.
- [ ] Run type checks, automated tests, and visual verification; fix all discovered issues.
- [ ] Save the completed prototype as a project checkpoint.
