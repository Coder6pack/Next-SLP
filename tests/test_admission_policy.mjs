import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { assertSlpAgentCreationAllowed } from "../patches/slp-delegation-policy.js";
import { resolvePaseoHome } from "../paseo/mcp/paseo-projects.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function makeAgentManager(agents) {
  return {
    getAgent(id) {
      return agents[id] ?? null;
    },
  };
}

describe("slp-delegation-policy", () => {
  let paseoHome;
  const agentManager = makeAgentManager({
    "sup-codex": { id: "sup-codex", provider: "codex-supervisor" },
    "sup-agy": { id: "sup-agy", provider: "agy-supervisor" },
    "lead-1": { id: "lead-1", provider: "agy-lead" },
    "peer-1": { id: "peer-1", provider: "agy-peer" },
  });

  before(async () => {
    paseoHome = await mkdtemp(join(tmpdir(), "slp-policy-test-"));
    const providers = await readFile(join(REPO_ROOT, "paseo", "providers.json"), "utf8");
    await writeFile(join(paseoHome, "config.json"), providers, "utf8");
  });

  after(async () => {
    if (paseoHome) {
      await rm(paseoHome, { recursive: true, force: true });
    }
  });

  it("blocks Peer from creating any agent", async () => {
    await assert.rejects(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: "peer-1",
        provider: "agy-peer",
        model: "gemini-4-neon",
        thinkingOptionId: "high",
      }),
      { code: "slp_delegation_denied", message: /Peer cannot create agents/ }
    );
  });

  it("allows Lead to create approved agy-peer pairs", async () => {
    for (const [model, thinkingOptionId] of [
      ["gemini-4-neon", "high"],
      ["gemini-4-neon", "xhigh"],
      ["gemini-4-hydrogen", "high"],
      ["gemini-4-hydrogen", "xhigh"],
    ]) {
      await assert.doesNotReject(
        assertSlpAgentCreationAllowed({
          agentManager,
          paseoHome,
          callerAgentId: "lead-1",
          provider: "agy-peer",
          model,
          thinkingOptionId,
          detached: false,
        })
      );
    }
  });

  it("blocks Lead from detached Peers, stale providers, other roles, and out-of-menu efforts", async () => {
    await assert.rejects(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: "lead-1",
        provider: "agy-peer",
        model: "gemini-4-neon",
        thinkingOptionId: "high",
        detached: true,
      }),
      { code: "slp_delegation_denied", message: /retain ownership/ }
    );

    for (const badProvider of ["pi-peer", "agy-lead", "agy-supervisor", "codex"]) {
      await assert.rejects(
        assertSlpAgentCreationAllowed({
          agentManager,
          paseoHome,
          callerAgentId: "lead-1",
          provider: badProvider,
          model: "gemini-4-neon",
          thinkingOptionId: "high",
        }),
        { code: "slp_delegation_denied", message: /approved Peer providers/ }
      );
    }

    await assert.rejects(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: "lead-1",
        provider: "agy-peer",
        model: "gemini-4-neon",
        thinkingOptionId: "low",
      }),
      { code: "slp_delegation_denied", message: /outside the configured role menu/ }
    );
  });

  it("enforces Supervisor caller boundaries and menu validation", async () => {
    await assert.doesNotReject(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: "sup-codex",
        provider: "agy-lead",
        model: "gemini-4-neon",
        thinkingOptionId: "high",
      })
    );

    await assert.doesNotReject(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: "sup-agy",
        provider: "codex-supervisor",
        model: "gpt-6.1-sol",
        thinkingOptionId: "medium",
      })
    );

    // Supervisor cannot directly spawn a Peer or arbitrary non-SLP provider.
    for (const disallowed of ["agy-peer", "codex", "pi-peer"]) {
      await assert.rejects(
        assertSlpAgentCreationAllowed({
          agentManager,
          paseoHome,
          callerAgentId: "sup-codex",
          provider: disallowed,
          model: "gemini-4-neon",
          thinkingOptionId: "high",
        }),
        { code: "slp_delegation_denied", message: /approved Lead or Supervisor providers/ }
      );
    }

    // Supervisor spawning another Supervisor must still match the configured menu.
    await assert.rejects(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: "sup-codex",
        provider: "agy-supervisor",
        model: "gemini-4-neon",
        thinkingOptionId: "xhigh",
      }),
      { code: "slp_delegation_denied", message: /outside the configured role menu/ }
    );
  });

  it("allows Human UI/CLI to start Supervisors with defaults while rejecting invalid overrides", async () => {
    await assert.doesNotReject(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: undefined,
        provider: "codex-supervisor",
        model: undefined,
        thinkingOptionId: undefined,
      })
    );

    await assert.rejects(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: undefined,
        provider: "agy-supervisor",
        model: "gemini-4-neon",
        thinkingOptionId: "ultra",
      }),
      { code: "slp_delegation_denied", message: /outside the configured role menu/ }
    );

    // Even Human-started Lead/Peer requires explicit model and thinkingOptionId.
    await assert.rejects(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: undefined,
        provider: "agy-lead",
        model: undefined,
        thinkingOptionId: undefined,
      }),
      { code: "slp_delegation_denied", message: /explicit model and thinkingOptionId/ }
    );
  });

  it("denies nonexistent callerAgentId and unreadable config.json", async () => {
    await assert.rejects(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome,
        callerAgentId: "ghost-id",
        provider: "agy-lead",
        model: "gemini-4-neon",
        thinkingOptionId: "high",
      }),
      { code: "slp_delegation_denied", message: /does not exist/ }
    );

    await assert.rejects(
      assertSlpAgentCreationAllowed({
        agentManager,
        paseoHome: join(paseoHome, "missing"),
        callerAgentId: "sup-codex",
        provider: "agy-lead",
        model: "gemini-4-neon",
        thinkingOptionId: "high",
      }),
      { code: "slp_delegation_denied", message: /cannot be read/ }
    );
  });
});

describe("paseo-projects helpers", () => {
  it("resolves PASEO_HOME from env or home default", () => {
    assert.equal(resolvePaseoHome({ PASEO_HOME: "/custom/paseo" }), "/custom/paseo");
    assert.match(resolvePaseoHome({}), /\.paseo$/);
  });
});
