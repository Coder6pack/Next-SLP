import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_ROLE_BY_PROVIDER = new Map([
    ["codex-supervisor", "supervisor"],
    ["agy-supervisor", "supervisor"],
    ["agy-lead", "lead"],
    ["agy-peer", "peer"],
]);
const VALID_ROLES = new Set(["supervisor", "lead", "peer"]);

// Lightweight stat-validated cache so multiple checks within one create_agent
// request avoid redundant disk reads while immediately reflecting config edits.
const configCache = new Map();

function deny(message) {
    const error = new Error(`SLP delegation denied: ${message}`);
    error.code = "slp_delegation_denied";
    throw error;
}

async function loadPaseoConfig(paseoHome) {
    if (typeof paseoHome !== "string" || !paseoHome) {
        deny("daemon home is unavailable");
    }
    const configPath = join(paseoHome, "config.json");
    let fileStat;
    try {
        fileStat = await stat(configPath);
    }
    catch {
        configCache.delete(configPath);
        deny("the configured role menu cannot be read");
    }
    const cached = configCache.get(configPath);
    if (cached && cached.mtimeMs === fileStat.mtimeMs && cached.size === fileStat.size) {
        return cached.config;
    }
    let config;
    try {
        config = JSON.parse(await readFile(configPath, "utf8"));
    }
    catch {
        configCache.delete(configPath);
        deny("the configured role menu cannot be read");
    }
    configCache.set(configPath, { mtimeMs: fileStat.mtimeMs, size: fileStat.size, config });
    return config;
}

function resolveProviderRole(providerId, providersMap) {
    if (typeof providerId !== "string" || !providerId) {
        return null;
    }
    const declared = providersMap?.[providerId]?.env?.SLP_ROLE;
    if (typeof declared === "string" && VALID_ROLES.has(declared)) {
        return declared;
    }
    return DEFAULT_ROLE_BY_PROVIDER.get(providerId) ?? null;
}

// Local SLP admission policy. `<paseoHome>/config.json` is the single authority
// for provider role tags (`env.SLP_ROLE`) and permitted model/effort pairs.
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

    const mightInvolveSlp = DEFAULT_ROLE_BY_PROVIDER.has(caller?.provider)
        || DEFAULT_ROLE_BY_PROVIDER.has(provider);

    let config = null;
    try {
        config = await loadPaseoConfig(paseoHome);
    }
    catch (error) {
        if (mightInvolveSlp) {
            throw error;
        }
        return;
    }

    const providersMap = config.agents?.providers ?? {};
    const callerRole = caller ? resolveProviderRole(caller.provider, providersMap) : null;
    const targetRole = resolveProviderRole(provider, providersMap);

    if (callerRole === "peer") {
        deny("a Peer cannot create agents");
    }
    if (callerRole === "lead") {
        if (targetRole !== "peer") {
            deny("a Lead may create only approved Peer providers");
        }
        if (detached) {
            deny("a Lead must retain ownership of its Peer");
        }
    }
    if (callerRole === "supervisor") {
        if (targetRole !== "lead" && targetRole !== "supervisor") {
            deny("a Supervisor may create only approved Lead or Supervisor providers");
        }
    }
    if (caller && !callerRole && targetRole) {
        deny("a non-SLP agent cannot create SLP role agents");
    }
    if (!targetRole) {
        return;
    }

    const requireExplicitSelection = Boolean(caller) || targetRole !== "supervisor";
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

    const target = providersMap[provider];
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
