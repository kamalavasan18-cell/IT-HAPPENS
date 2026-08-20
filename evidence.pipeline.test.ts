import { describe, expect, it } from "vitest";
import { analyzeEvidence, getSampleInputs } from "../shared/evidence";

describe("evidence pipeline", () => {
  it("returns a stable report and fingerprint for identical inputs", () => {
    const { resume, job } = getSampleInputs();
    const first = analyzeEvidence(resume, job);
    const second = analyzeEvidence(resume, job);

    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first.score).toBe(second.score);
    expect(first.fields).toEqual(second.fields);
    expect(first.links).toEqual(second.links);
    expect(first.determinism).toMatchObject({ status: "VERIFIED", fieldDiffs: 0, evidenceDiffs: 0, scoreDiff: 0 });
  });

  it("extracts supported fields and links requirements to retained evidence", () => {
    const report = analyzeEvidence(
      "Alex Morgan\nalex@example.com\n\nSKILLS\nReact, TypeScript, SQL\n\nEXPERIENCE\nProduct engineer at Northstar",
      "We need React, TypeScript, SQL, and leadership.",
    );

    expect(report.fields.find(field => field.key === "name")?.status).toBe("FOUND");
    expect(report.fields.find(field => field.key === "email")?.value).toBe("alex@example.com");
    expect(report.links.find(link => link.requirement === "React")?.status).toBe("STRONG");
    expect(report.links.find(link => link.requirement === "Leadership")?.status).toBe("MISSING");
    expect(report.trust.unsupportedClaims).toBeGreaterThan(0);
  });

  it("reports limited parser health for very short or incomplete inputs instead of inventing results", () => {
    const report = analyzeEvidence("Alex", "Need React");

    expect(report.trust.parserHealth).toBe("LIMITED");
    expect(report.fields.find(field => field.key === "email")?.status).toBe("MISSING");
    expect(report.fields.find(field => field.key === "experience")?.status).toBe("MISSING");
  });
});
