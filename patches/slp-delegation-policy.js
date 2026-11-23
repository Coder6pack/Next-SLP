import { readFile } from "node:fs/promises";
import { join } from "node:path";

const SUPERVISOR_PROVIDERS = new Set(["codex-supervisor", "agy-supervisor"]);
const LEAD_PROVIDERS = new Set(["agy-lead"]);
const PEER_PROVIDERS = new Set(["agy-peer"]);
const ALL_SLP_PROVIDERS = new Set([
    ...SUPERVISOR_PROVIDERS,
    ...LEAD_PROVIDERS,
    ...PEER_PROVIDERS,
]);

function deny(message) {
    const error = new Error(`SLP delegation denied: ${message}`);
    error.code = "slp_delegation_denied";
    throw error;
}

// Local SLP admission policy. Each role provider's configured model catalog in
// `<paseoHome>/config.json` is the single authority for permitted model/effort pairs.
export async function assertSlpAgentCreationAllowed({
    agentManager,
    paseoHome,
    callerAgentId,
    provider,
    model,
    thinkingOptionId,
    detached = false,
}) {
    let caller = null;
    if (callerAgentId) {
        caller = agentManager.getAgent(callerAgentId);
        if (!caller) deny("caller agent does not exist");
    }
    if (PEER_PROVIDERS.has(caller?.provider)) {
        deny("a Peer cannot create agents");
    }
    if (LEAD_PROVIDERS.has(caller?.provider)) {
        if (!PEER_PROVIDERS.has(provider)) {
            deny("a Lead may create only approved Peer providers");
        }
        if (detached) {
            deny("a Lead must retain ownership of its Peer");
        }
    }
    if (SUPERVISOR_PROVIDERS.has(caller?.provider)) {
        if (!LEAD_PROVIDERS.has(provider) && !SUPERVISOR_PROVIDERS.has(provider)) {
            deny("a Supervisor may create only approved Lead or Supervisor providers");
        }
    }
    if (!ALL_SLP_PROVIDERS.has(provider)) {
        return;
    }

    const requireExplicitSelection = Boolean(caller) || !SUPERVISOR_PROVIDERS.has(provider);
    const hasModel = typeof model === "string" && model.length > 0;
    const hasThinking = typeof thinkingOptionId === "string" && thinkingOptionId.length > 0;
    if (requireExplicitSelection && (!hasModel || !hasThinking)) {
        deny("SLP role creation requires an explicit model and thinkingOptionId");
    }
    if (model !== undefined && !hasModel) {
        deny("model must be a non-empty string when provided");
    }
    if (thinkingOptionId !== undefined && !hasThinking) {
        deny("thinkingOptionId must be a non-empty string when provided");
    }

    if (typeof paseoHome !== "string" || !paseoHome) {
        deny("daemon home is unavailable");
    }
    let config;
    try {
        config = JSON.parse(await readFile(join(paseoHome, "config.json"), "utf8"));
    }
    catch {
        deny("the configured role menu cannot be read");
    }
    const target = config.agents?.providers?.[provider];
    if (!target || target.enabled === false || !Array.isArray(target.models) || target.models.length === 0) {
        deny("the role provider or its configured menu is unavailable");
    }

    const choice = hasModel
        ? target.models.find((entry) => entry.id === model)
        : target.models.find((entry) => entry.isDefault) ?? target.models[0];
    if (!choice) {
        deny("model/effort is outside the configured role menu");
    }
    if (hasThinking) {
        if (!Array.isArray(choice.thinkingOptions) || !choice.thinkingOptions.some((option) => option.id === thinkingOptionId)) {
            deny("model/effort is outside the configured role menu");
        }
    }
}
