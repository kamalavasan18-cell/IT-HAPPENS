# Evidence OS Architecture

## Product principle

Evidence OS is designed around a single rule: **a candidate-facing or recruiter-facing claim is only emitted when it can be traced to deterministic, retained resume evidence.** The system does not use an LLM to parse or infer resume fields. Resume contents are treated as data, not executable instructions.

## Shared pipeline

The web application and the command-line interface both call `server/evidence/pipeline.ts`.

```text
Input bytes or text
  -> format detection and deterministic extraction
  -> fixed-section segmentation
  -> ten-field parser with evidence spans
  -> requirement parsing and evidence-only matching
  -> deterministic score and stable ranking
  -> report, trust metrics, and output fingerprint
```

## Requirement mapping

| Requirement | Implementation | Verification |
|---|---|---|
| Home and analysis flow | Public workspace supports resume upload, JD file upload or pasted JD text, and an explicit Analyze action | Browser smoke test and typed API contract |
| Browser upload handling | Files are size-limited, type-checked, encoded in the browser, and analyzed through the common tRPC procedure | Invalid-type and missing-input tests |
| PDF/DOCX/text extraction | Common extraction interface with explicit `UNPARSEABLE` results | Unit tests using text, DOCX and malformed input fixtures |
| Fixed segmentation | Versioned allowlist and normalized heading matcher | Section tests |
| Ten fields and exact evidence | Rule-based field extractors return status, value, evidence, section and reason | Field and evidence tests |
| JD matching and fit score | Requirement tokens are matched only to extracted field values and evidence | Matching and scoring tests |
| Evidence Graph | Requirement-to-field link records returned by the pipeline and rendered in the workspace | UI visual verification |
| Why Not 100 | Each requirement is classified as strong, weak, missing or ambiguous based on the same link records | Matching tests |
| Trust Center | Derived coverage, unsupported-claim count, missing/ambiguous fields, source fingerprint and parser health | Pipeline tests |
| Candidate War Room | Batch analysis uses the same scoring function and stable name/fingerprint tie-breakers | Batch ranking test |
| Determinism Verifier | Re-runs the same analysis and computes field/evidence/score/order differences | Repeated-run test |
| CLI parity | `resume-agent` accepts one file, a batch directory, or verification mode and returns the same report structure | CLI integration tests |
| Machine-readable failure states | `NOT_FOUND`, `UNKNOWN`, `AMBIGUOUS`, and `UNPARSEABLE` each carry plain-language reasons | Error-status unit tests |
| Hostile inputs | Detects unsafe file states and prompt-injection-like content without following it | Hostile-content, malformed-file, image-only-PDF and unsupported-section tests |
| Sample fixtures | Clean, messy and missing-field sample resumes plus a JD fixture exercise the same pipeline as production inputs | Fixture-driven test suite |
| Test and report obligations | Vitest covers requested pipeline cases and `REPORT.md` records only measured test and runtime results | Test run and report review |

## Determinism contract

The pipeline uses only fixed normalizers, regular expressions, sorted token sets, fixed weight constants, and stable tie-breakers. Every analysis includes a canonical fingerprint. Repeated runs with identical text and JD inputs must produce identical structured outputs.

## Boundaries and limitations

This prototype handles text-based PDF and DOCX input. Image-only scanned PDFs are reported as `UNPARSEABLE` with a diagnostic reason rather than attempting OCR or inventing a result. The browser sends compact file payloads for analysis only; source documents are not persisted by the prototype.
