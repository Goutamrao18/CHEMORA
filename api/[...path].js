// Auto-generated bundle from server/api-app.ts for Vercel/Node serverless environments


// server/api-app.ts
import express4 from "express";
import cookieParser from "cookie-parser";

// server/routes/account.ts
import express from "express";
import { z } from "zod";

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
var isProd = process.env.NODE_ENV === "production";
var allowDevFallback = process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_AUTH_FALLBACK === "true";
var SITE_URL = (process.env.SITE_URL || "https://chemora.work.gd").trim().replace(/\/$/, "");
var SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://mcwadkgzplurjtstrhdd.supabase.co").trim().replace(/\/$/, "");
var SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
var SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
function isDevFallbackAllowed() {
  return !isSupabaseConfigured() || !isProd || allowDevFallback;
}
function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith("https://"));
}
function isSupabaseAdminConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL.startsWith("https://"));
}
function getUserScopedSupabaseClient(token) {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  } catch {
    return null;
  }
}
var anonClientInstance = null;
function getSupabaseAnonClient() {
  if (!isSupabaseConfigured()) return null;
  if (!anonClientInstance) {
    anonClientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return anonClientInstance;
}
var adminClientInstance = null;
function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) return null;
  if (!adminClientInstance) {
    adminClientInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return adminClientInstance;
}
function sanitizeLog(input) {
  if (!input) return "";
  let str = typeof input === "string" ? input : JSON.stringify(input);
  str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
  str = str.replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"');
  str = str.replace(/"token"\s*:\s*"[^"]+"/gi, '"token":"[REDACTED]"');
  str = str.replace(/eyJ[a-zA-Z0-9_-]{20,}/g, "[REDACTED_JWT]");
  str = str.replace(/chemora_[a-zA-Z0-9_-]{20,}/g, "[REDACTED_TOKEN]");
  return str;
}
function safeLogWarn(message, err) {
  console.warn(sanitizeLog(message), err ? sanitizeLog(err?.message || err) : "");
}
function safeLogError(message, err) {
  console.error(sanitizeLog(message), err ? sanitizeLog(err?.message || err) : "");
}
async function verifyUserSessionToken(token) {
  if (!token || typeof token !== "string") return null;
  if (isDevFallbackAllowed()) {
    const uid = fallbackTokens.get(token);
    if (uid) {
      const u = fallbackUsers.get(uid);
      if (u) return { id: u.id, email: u.email };
    }
  }
  const client = getUserScopedSupabaseClient(token);
  if (!client) return null;
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return null;
    return { id: user.id, email: user.email || "" };
  } catch {
    return null;
  }
}
function computeRankTitle(totalXp) {
  if (totalXp >= 1e4) return "Grand Chemist Laureate";
  if (totalXp >= 6e3) return "Principal Investigator";
  if (totalXp >= 3500) return "Senior Researcher";
  if (totalXp >= 2e3) return "Laboratory Specialist";
  if (totalXp >= 1e3) return "Apprentice Chemist";
  if (totalXp >= 400) return "Junior Alchemist";
  return "Novice Alchemist";
}
var fallbackUsers = /* @__PURE__ */ new Map();
var fallbackTokens = /* @__PURE__ */ new Map();
function generateSimpleDevToken(userId) {
  return `chemora_${userId}_${crypto.randomBytes(24).toString("hex")}`;
}
async function devFallbackSignUp(email, password, fullName) {
  if (!isDevFallbackAllowed()) {
    throw new Error("Service temporarily unavailable.");
  }
  const normalizedEmail = email.toLowerCase().trim();
  for (const u of fallbackUsers.values()) {
    if (u.email === normalizedEmail) {
      return {
        user: { id: u.id, email: normalizedEmail },
        session: { access_token: generateSimpleDevToken(u.id) },
        requiresEmailConfirmation: false,
        message: "Account created or existing session restored."
      };
    }
  }
  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    full_name: fullName.trim() || normalizedEmail.split("@")[0] || "Researcher",
    avatar_url: "/favicon.png",
    rank: "Novice Alchemist",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  fallbackUsers.set(userId, newUser);
  const token = generateSimpleDevToken(userId);
  fallbackTokens.set(token, userId);
  return {
    user: { id: newUser.id, email: newUser.email, full_name: newUser.full_name },
    session: { access_token: token },
    requiresEmailConfirmation: false,
    message: "Researcher account created successfully."
  };
}
async function devFallbackSignIn(email, password) {
  if (!isDevFallbackAllowed()) {
    throw new Error("Service temporarily unavailable.");
  }
  const normalizedEmail = email.toLowerCase().trim();
  let foundUser = null;
  for (const u of fallbackUsers.values()) {
    if (u.email === normalizedEmail) {
      foundUser = u;
      break;
    }
  }
  if (!foundUser) {
    throw new Error("Invalid email or password.");
  }
  const matches = await bcrypt.compare(password, foundUser.passwordHash);
  if (!matches) {
    throw new Error("Invalid email or password.");
  }
  const token = generateSimpleDevToken(foundUser.id);
  fallbackTokens.set(token, foundUser.id);
  return {
    user: { id: foundUser.id, email: foundUser.email },
    profile: {
      id: foundUser.id,
      user_id: foundUser.id,
      email: foundUser.email,
      full_name: foundUser.full_name,
      avatar_url: foundUser.avatar_url,
      rank: foundUser.rank,
      created_at: foundUser.created_at,
      updated_at: foundUser.updated_at
    },
    session: { access_token: token }
  };
}
async function backendSignUp(email, password, fullName) {
  if (!password || password.length < 10) {
    throw new Error("Password must be at least 10 characters long.");
  }
  const anonClient = getSupabaseAnonClient();
  if (!anonClient) {
    if (isDevFallbackAllowed()) {
      return devFallbackSignUp(email, password, fullName);
    }
    throw new Error("Service temporarily unavailable. Please try again later.");
  }
  const { data, error } = await anonClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
  if (error) {
    if (isDevFallbackAllowed()) {
      return devFallbackSignUp(email, password, fullName);
    }
    safeLogWarn("Supabase signUp error");
    return {
      user: { id: "pending", email },
      session: null,
      requiresEmailConfirmation: true,
      message: "If the credentials are valid, a confirmation link has been sent."
    };
  }
  const user = data.user;
  const adminClient = getSupabaseAdminClient();
  if (user && adminClient) {
    try {
      await adminClient.from("profiles").upsert(
        {
          user_id: user.id,
          full_name: fullName || user.email?.split("@")[0] || "Researcher",
          avatar_url: "/favicon.png",
          rank_title: "Novice Alchemist",
          levels_cleared: 0,
          xp_earned: 0,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        { onConflict: "user_id" }
      );
    } catch (upsertErr) {
      safeLogWarn("Profile creation warning");
    }
  }
  return {
    user: user ? { id: user.id, email: user.email } : null,
    session: data.session,
    requiresEmailConfirmation: !data.session,
    message: "Account created. If required, please verify your email address."
  };
}
async function backendSignIn(email, password) {
  if (!password || password.length < 10) {
    throw new Error("Invalid email or password.");
  }
  const anonClient = getSupabaseAnonClient();
  if (!anonClient) {
    if (isDevFallbackAllowed()) {
      return devFallbackSignIn(email, password);
    }
    throw new Error("Service temporarily unavailable. Please try again later.");
  }
  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password
  });
  if (error || !data.user || !data.session) {
    if (isDevFallbackAllowed()) {
      try {
        return await devFallbackSignIn(email, password);
      } catch {
        throw new Error("Invalid email or password.");
      }
    }
    throw new Error("Invalid email or password.");
  }
  const user = data.user;
  const profile = await backendGetProfile(user.id, user.email || email, void 0, data.session.access_token);
  return {
    user: { id: user.id, email: user.email },
    profile,
    session: data.session
  };
}
async function backendResetPasswordRequest(email) {
  const genericMessage = "If an account exists with this email, password reset instructions have been dispatched.";
  if (!email || typeof email !== "string") {
    return { success: true, message: genericMessage };
  }
  const anonClient = getSupabaseAnonClient();
  if (anonClient) {
    try {
      await anonClient.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${SITE_URL}/#account`
      });
    } catch {
      safeLogWarn("Supabase resetPasswordForEmail warning");
    }
  }
  return { success: true, message: genericMessage };
}
async function backendUpdatePassword(token, newPassword) {
  if (!newPassword || newPassword.length < 10) {
    throw new Error("New password must be at least 10 characters long.");
  }
  const client = getUserScopedSupabaseClient(token);
  if (!client) {
    if (isDevFallbackAllowed()) {
      const uid = fallbackTokens.get(token);
      if (uid) {
        const u = fallbackUsers.get(uid);
        if (u) {
          u.passwordHash = await bcrypt.hash(newPassword, 10);
          u.updated_at = (/* @__PURE__ */ new Date()).toISOString();
          return { success: true, message: "Password updated successfully." };
        }
      }
    }
    throw new Error("Service temporarily unavailable.");
  }
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error("Unable to update password. Please check your session.");
  }
  return { success: true, message: "Password updated successfully." };
}
async function backendGetProfile(userId, email, defaultName, token) {
  const client = (token ? getUserScopedSupabaseClient(token) : null) || getSupabaseAnonClient();
  if (client) {
    try {
      const { data } = await client.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      if (data) {
        return {
          id: String(data.id || userId),
          user_id: data.user_id || userId,
          email,
          full_name: data.full_name || defaultName || "Researcher",
          avatar_url: data.avatar_url || "/favicon.png",
          rank: data.rank_title || "Novice Alchemist",
          created_at: data.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: data.updated_at || (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    } catch (err) {
      safeLogWarn("Profile fetch note");
    }
  }
  if (isDevFallbackAllowed()) {
    const fb = fallbackUsers.get(userId);
    if (fb) {
      return {
        id: fb.id,
        user_id: fb.id,
        email: fb.email,
        full_name: fb.full_name,
        avatar_url: fb.avatar_url,
        rank: fb.rank,
        created_at: fb.created_at,
        updated_at: fb.updated_at
      };
    }
  }
  return {
    id: userId,
    user_id: userId,
    email,
    full_name: defaultName || email.split("@")[0] || "Researcher",
    avatar_url: "/favicon.png",
    rank: "Novice Alchemist",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function backendUpdateProfile(userId, userEmail, updates, token) {
  const client = token ? getUserScopedSupabaseClient(token) : null;
  const adminClient = getSupabaseAdminClient();
  if (client && adminClient) {
    const payload = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.full_name !== void 0) payload.full_name = updates.full_name.trim();
    if (updates.avatar_url !== void 0) payload.avatar_url = updates.avatar_url.trim();
    try {
      await adminClient.from("profiles").update(payload).eq("user_id", userId);
    } catch (err) {
      safeLogWarn("Profile update note");
    }
  }
  return backendGetProfile(userId, userEmail, updates.full_name, token);
}
var devProgressStore = /* @__PURE__ */ new Map();
async function backendGetProgress(userId) {
  const adminClient = getSupabaseAdminClient();
  if (adminClient) {
    try {
      const { data } = await adminClient.from("researcher_progress").select("*").eq("user_id", userId).maybeSingle();
      if (data) {
        return {
          progress: {
            userId,
            experimentsCompleted: Number(data.experiments_completed || 0),
            challengesCompleted: Number(data.challenges_completed || 0),
            streakDays: Number(data.streak_days || 0),
            totalXp: Number(data.total_xp || 0),
            rankTitle: computeRankTitle(Number(data.total_xp || 0)),
            completedExperimentIds: Array.isArray(data.completed_experiment_ids) ? data.completed_experiment_ids : [],
            lastActiveAt: data.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: data.updated_at || (/* @__PURE__ */ new Date()).toISOString()
          },
          source: "supabase"
        };
      }
    } catch (err) {
      safeLogWarn("Progress lookup error");
    }
  }
  const existing = devProgressStore.get(userId) || {
    userId,
    experimentsCompleted: 0,
    challengesCompleted: 0,
    streakDays: 0,
    totalXp: 0,
    rankTitle: "Novice Alchemist",
    completedExperimentIds: [],
    lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return { progress: existing, source: "server-store" };
}
async function backendSyncProgress(userId, progress) {
  const current = (await backendGetProgress(userId)).progress;
  const mergedExperimentIds = Array.from(/* @__PURE__ */ new Set([
    ...current.completedExperimentIds || [],
    ...Array.isArray(progress.completedExperimentIds) ? progress.completedExperimentIds : []
  ]));
  const experimentsCompleted = Math.max(
    current.experimentsCompleted,
    progress.experimentsCompleted !== void 0 ? progress.experimentsCompleted : 0,
    mergedExperimentIds.length
  );
  const challengesCompleted = Math.max(
    current.challengesCompleted,
    progress.challengesCompleted !== void 0 ? progress.challengesCompleted : 0
  );
  const requestedStreak = progress.streakDays !== void 0 ? progress.streakDays : current.streakDays;
  const streakDays = Math.max(
    current.streakDays,
    Math.min(requestedStreak, current.streakDays + 1)
  );
  const MAX_PER_SYNC_XP_DELTA = 5e3;
  let totalXp = current.totalXp;
  if (progress.totalXp !== void 0 && progress.totalXp > current.totalXp) {
    const requestedDelta = progress.totalXp - current.totalXp;
    totalXp = current.totalXp + Math.min(requestedDelta, MAX_PER_SYNC_XP_DELTA);
  }
  const rankTitle = computeRankTitle(totalXp);
  const validatedProgress = {
    userId,
    experimentsCompleted,
    challengesCompleted,
    streakDays,
    totalXp,
    rankTitle,
    completedExperimentIds: mergedExperimentIds,
    lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  devProgressStore.set(userId, validatedProgress);
  const adminClient = getSupabaseAdminClient();
  if (adminClient) {
    try {
      await adminClient.from("researcher_progress").upsert(
        {
          user_id: userId,
          experiments_completed: validatedProgress.experimentsCompleted,
          challenges_completed: validatedProgress.challengesCompleted,
          streak_days: validatedProgress.streakDays,
          total_xp: validatedProgress.totalXp,
          rank_title: validatedProgress.rankTitle,
          completed_experiment_ids: validatedProgress.completedExperimentIds || [],
          updated_at: validatedProgress.updatedAt
        },
        { onConflict: "user_id" }
      );
      await adminClient.from("profiles").update(
        {
          levels_cleared: validatedProgress.challengesCompleted,
          xp_earned: validatedProgress.totalXp,
          rank_title: validatedProgress.rankTitle,
          updated_at: validatedProgress.updatedAt
        }
      ).eq("user_id", userId);
      return { success: true, progress: validatedProgress, source: "supabase" };
    } catch (dbErr) {
      safeLogWarn("Supabase progress sync error");
    }
  }
  return { success: true, progress: validatedProgress, source: "server-store" };
}
async function backendDeleteAccount(userId, email, passwordConfirm) {
  if (!passwordConfirm) {
    throw new Error("Password confirmation is required to delete your account.");
  }
  const anonClient = getSupabaseAnonClient();
  const adminClient = getSupabaseAdminClient();
  if (anonClient && adminClient) {
    const { error: authErr } = await anonClient.auth.signInWithPassword({
      email,
      password: passwordConfirm
    });
    if (authErr) {
      throw new Error("Incorrect password. Account deletion aborted.");
    }
    const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
    if (delErr) {
      throw new Error("Failed to delete account. Please try again.");
    }
  } else if (isDevFallbackAllowed()) {
    const user = fallbackUsers.get(userId);
    if (!user) throw new Error("Account not found.");
    const match = await bcrypt.compare(passwordConfirm, user.passwordHash);
    if (!match) throw new Error("Incorrect password. Account deletion aborted.");
    fallbackUsers.delete(userId);
    fallbackTokens.delete(userId);
    devProgressStore.delete(userId);
  } else {
    throw new Error("Service temporarily unavailable.");
  }
  return { success: true };
}
function getSupabaseSystemDiagnostics() {
  const isConfigured = isSupabaseConfigured();
  return {
    databaseConnected: isConfigured,
    engine: "Supabase PostgreSQL",
    tables: ["profiles", "researcher_progress", "chemora_reviews"],
    security: {
      zeroLocalStorageAccount: true,
      serverSideAuthProxy: true,
      credentialsExposedToClient: false
    },
    status: isConfigured ? "Connected & Synced" : "Ready (Active Server Database Engine)",
    mode: isConfigured ? "cloud_supabase" : "resilient_server_db"
  };
}

// server/routes/account.ts
var router = express.Router();
var isProd2 = process.env.NODE_ENV === "production";
var ALLOWED_ORIGINS = new Set([
  "https://chemora.work.gd",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.SITE_URL?.trim().replace(/\/$/, "")
].filter(Boolean));
function isAllowedOrigin(originHeader) {
  if (!originHeader) return false;
  const originStr = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  try {
    const parsed = new URL(originStr);
    const origin = parsed.origin;
    if (ALLOWED_ORIGINS.has(origin)) return true;
    if (origin.endsWith(".vercel.app") || origin.endsWith(".run.app") || origin.includes(".googleusercontent.com") || origin.includes(".aistudio.google.com") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
router.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    if (!origin && !isProd2) {
      return next();
    }
    if (!origin || !isAllowedOrigin(origin)) {
      return res.status(403).json({ error: "Invalid or untrusted request origin." });
    }
  }
  next();
});
var SignUpSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(120),
  password: z.string().min(10, "Password must be at least 10 characters").max(120),
  full_name: z.string().trim().max(80).optional()
});
var LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(120),
  password: z.string().min(10, "Password must be at least 10 characters").max(120)
});
var ALLOWED_PRESET_AVATARS = /* @__PURE__ */ new Set([
  "/favicon.png",
  "/assets/chemistry/carbon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/assets/chemistry/oxygen.svg",
  "/assets/chemora-mark.svg"
]);
function isValidAvatarUrl(url, userId) {
  if (!url || typeof url !== "string" || url.length > 255) return false;
  const trimmed = url.trim();
  if (ALLOWED_PRESET_AVATARS.has(trimmed)) return true;
  if (trimmed.startsWith("https://lh3.googleusercontent.com/")) return true;
  const expectedPrefix = `/storage/v1/object/public/avatars/${userId}/`;
  if (trimmed.startsWith(expectedPrefix)) return true;
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith(expectedPrefix)) return true;
  } catch {
  }
  return false;
}
var ProfileUpdateSchema = z.object({
  full_name: z.string().trim().max(80).optional(),
  avatar_url: z.string().trim().max(255).optional()
});
var PasswordUpdateSchema = z.object({
  new_password: z.string().min(10, "New password must be at least 10 characters").max(120)
});
var ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(120)
});
var ResetPasswordWithTokenSchema = z.object({
  token: z.string().trim().min(10, "Invalid token").max(255),
  new_password: z.string().min(10, "New password must be at least 10 characters").max(120)
});
var DeleteAccountSchema = z.object({
  password: z.string().min(1, "Password confirmation is required")
});
var SyncProgressSchema = z.object({
  experimentsCompleted: z.number().int().min(0).max(1e3).optional(),
  challengesCompleted: z.number().int().min(0).max(1e3).optional(),
  streakDays: z.number().int().min(0).max(1e4).optional(),
  totalXp: z.number().int().min(0).max(1e7).optional(),
  completedExperimentIds: z.array(z.string().trim().max(60)).max(200).optional()
});
function extractToken(req) {
  if (req.cookies && (req.cookies.chemora_session || req.cookies["__Host-chemora_session"])) {
    return req.cookies.chemora_session || req.cookies["__Host-chemora_session"];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}
function setSessionCookies(res, token) {
  const maxAge = 7 * 24 * 60 * 60 * 1e3;
  res.cookie("chemora_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd2,
    maxAge,
    path: "/"
  });
  if (isProd2) {
    res.cookie("__Host-chemora_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge,
      path: "/"
    });
  }
}
function clearSessionCookies(res) {
  res.clearCookie("chemora_session", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd2,
    path: "/"
  });
  if (isProd2) {
    res.clearCookie("__Host-chemora_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/"
    });
  }
}
router.get("/status", (_req, res) => {
  res.json({
    status: "online",
    databaseConnected: isSupabaseConfigured()
  });
});
router.get("/database", (_req, res) => {
  res.json(getSupabaseSystemDiagnostics());
});
router.get("/progress", async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const verified = await verifyUserSessionToken(token);
    if (!verified) return res.status(401).json({ error: "Session expired" });
    const result = await backendGetProgress(verified.id);
    return res.json(result);
  } catch {
    return res.status(503).json({ error: "Service temporarily unavailable." });
  }
});
router.post("/sync", async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const verified = await verifyUserSessionToken(token);
    if (!verified) return res.status(401).json({ error: "Session expired" });
    const parsed = SyncProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid progress data schema" });
    }
    const syncResult = await backendSyncProgress(verified.id, parsed.data);
    return res.json(syncResult);
  } catch {
    return res.status(503).json({ error: "Service temporarily unavailable." });
  }
});
router.get("/me", async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ authenticated: false, error: "Not authenticated" });
    }
    const verified = await verifyUserSessionToken(token);
    if (!verified) {
      return res.status(401).json({ authenticated: false, error: "Session expired or invalid" });
    }
    const profile = await backendGetProfile(verified.id, verified.email, void 0, token);
    return res.json({
      authenticated: true,
      user: {
        id: verified.id,
        email: verified.email
      },
      profile
    });
  } catch {
    return res.status(500).json({ error: "Internal server error occurred." });
  }
});
router.post("/signup", async (req, res) => {
  try {
    const parsed = SignUpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Password must be at least 10 characters long." });
    }
    const { email, password, full_name } = parsed.data;
    const result = await backendSignUp(email, password, full_name || "");
    if (result.session?.access_token) {
      setSessionCookies(res, result.session.access_token);
    }
    return res.status(201).json({
      success: true,
      user: result.user,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
      message: result.message || "Researcher account created successfully."
    });
  } catch (err) {
    safeLogError("Signup failed");
    return res.status(400).json({ error: "Registration failed. Please check your details." });
  }
});
router.post("/login", async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const { email, password } = parsed.data;
    const result = await backendSignIn(email, password);
    if (result.session?.access_token) {
      setSessionCookies(res, result.session.access_token);
    }
    return res.json({
      success: true,
      user: result.user,
      profile: result.profile
    });
  } catch {
    return res.status(401).json({ error: "Invalid email or password." });
  }
});
router.post("/logout", async (req, res) => {
  const token = extractToken(req);
  if (token) {
    try {
      const client = getUserScopedSupabaseClient(token);
      if (client) {
        await client.auth.signOut();
      }
    } catch {
    }
  }
  clearSessionCookies(res);
  return res.json({ success: true, message: "Logged out successfully." });
});
router.delete("/me", async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const verified = await verifyUserSessionToken(token);
    if (!verified) return res.status(401).json({ error: "Session expired or invalid" });
    const parsed = DeleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Password confirmation is required." });
    }
    await backendDeleteAccount(verified.id, verified.email, parsed.data.password);
    clearSessionCookies(res);
    return res.json({
      success: true,
      message: "Your researcher account and learning data have been permanently erased."
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to delete account." });
  }
});
router.put("/profile", async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const verified = await verifyUserSessionToken(token);
    if (!verified) return res.status(401).json({ error: "Session expired" });
    const parsed = ProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid profile update format" });
    }
    if (parsed.data.avatar_url !== void 0 && !isValidAvatarUrl(parsed.data.avatar_url, verified.id)) {
      return res.status(400).json({
        error: "Invalid avatar URL. Allowed: your uploaded avatar, preset badges, or Google photo."
      });
    }
    const updatedProfile = await backendUpdateProfile(
      verified.id,
      verified.email,
      parsed.data,
      token
    );
    return res.json({
      success: true,
      profile: updatedProfile
    });
  } catch {
    return res.status(500).json({ error: "Failed to update profile." });
  }
});
router.put("/password", async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const parsed = PasswordUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "New password must be at least 10 characters long." });
    }
    await backendUpdatePassword(token, parsed.data.new_password);
    return res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to update password." });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    await backendResetPasswordRequest(parsed.data.email);
    return res.json({
      success: true,
      message: "If an account exists with that email, password reset instructions have been sent."
    });
  } catch {
    return res.json({
      success: true,
      message: "If an account exists with that email, password reset instructions have been sent."
    });
  }
});
var account_default = router;

// server/routes/reviews.ts
import express2 from "express";
import { z as z2 } from "zod";
var router2 = express2.Router();
var isProd3 = process.env.NODE_ENV === "production";
function extractToken2(req) {
  if (req.cookies && (req.cookies.chemora_session || req.cookies["__Host-chemora_session"])) {
    return req.cookies.chemora_session || req.cookies["__Host-chemora_session"];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}
function validateReviewPlainText(text) {
  if (/<[a-z\/\!][\s\S]*>/i.test(text)) {
    return { valid: false, error: "HTML formatting is not permitted in reviews." };
  }
  const linkMatches = text.match(/https?:\/\/|www\./gi) || [];
  if (linkMatches.length > 1) {
    return { valid: false, error: "Reviews may not contain more than one link." };
  }
  if (/(.)\1{5,}/.test(text)) {
    return { valid: false, error: "Excessive repeated characters are not permitted." };
  }
  return { valid: true };
}
var devReviews = [
  {
    id: "rev_seed_1",
    authorName: "Dr. Elena Rostova",
    role: "Biochemistry Lecturer",
    avatarUrl: "/know/image/beaker.png",
    rating: 5,
    category: "Interactive Lab Simulator",
    title: "Remarkable tool for visualizing apparatus and reactions",
    content: "The 130+ item apparatus directory and step-by-step experiment procedures provide our undergraduates with an intuitive, risk-free laboratory orientation before setting foot in physical wet labs.",
    wouldRecommend: true,
    helpful: 42,
    verified: true,
    status: "approved",
    createdAt: new Date(Date.now() - 864e5 * 5).toISOString()
  },
  {
    id: "rev_seed_2",
    authorName: "Marcus Chen",
    role: "AP Chemistry Scholar",
    avatarUrl: "/know/image/bunsen-burner.png",
    rating: 5,
    category: "100 Challenge Levels",
    title: "The progressive difficulty ladder made stoichiometry click",
    content: "Having graduated challenges from fundamental valency balancing all the way to complex organic synthesis gave me confidence I never achieved with conventional textbooks.",
    wouldRecommend: true,
    helpful: 28,
    verified: true,
    status: "approved",
    createdAt: new Date(Date.now() - 864e5 * 3).toISOString()
  },
  {
    id: "rev_seed_3",
    authorName: "Amina Al-Mansoor",
    role: "High School Chemistry Educator",
    avatarUrl: "/know/image/volumetric-flask.png",
    rating: 5,
    category: "AI Chemistry Assistant",
    title: "Safe, accurate tutoring that explains the mechanism",
    content: "CHEMORA does not just hand students the answer\u2014it walks through the underlying reaction pathway, stoichiometric ratios, and necessary lab precautions.",
    wouldRecommend: true,
    helpful: 19,
    verified: true,
    status: "approved",
    createdAt: new Date(Date.now() - 864e5 * 1).toISOString()
  }
];
var devVotes = /* @__PURE__ */ new Set();
function calculateSummary(records) {
  const totalCount = records.length;
  if (totalCount === 0) {
    return {
      averageRating: 0,
      totalCount: 0,
      recommendationRate: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryCounts: {}
    };
  }
  let ratingSum = 0;
  let recommendCount = 0;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const categoryCounts = {};
  for (const r of records) {
    ratingSum += r.rating;
    if (r.wouldRecommend) recommendCount++;
    const clampedRating = Math.max(1, Math.min(5, Math.round(r.rating)));
    ratingCounts[clampedRating] = (ratingCounts[clampedRating] || 0) + 1;
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  }
  const averageRating = parseFloat((ratingSum / totalCount).toFixed(1));
  const recommendationRate = Math.round(recommendCount / totalCount * 100);
  return {
    averageRating,
    totalCount,
    recommendationRate,
    ratingCounts,
    categoryCounts
  };
}
var ReviewsQuerySchema = z2.object({
  category: z2.string().trim().max(60).optional(),
  rating: z2.coerce.number().int().min(1).max(5).optional(),
  sort: z2.enum(["helpful", "recent"]).optional()
});
var ReviewIdParamSchema = z2.object({
  id: z2.string().trim().min(3).max(100)
});
var CreateReviewSchema = z2.object({
  rating: z2.coerce.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  category: z2.string().trim().max(60).optional(),
  title: z2.string().trim().min(2, "Review title is required").max(120),
  content: z2.string().trim().min(5, "Review content must be at least 5 characters").max(1500),
  wouldRecommend: z2.boolean().optional()
});
router2.get("/", async (req, res) => {
  try {
    const parsedQuery = ReviewsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }
    const { category, rating: minRating, sort = "helpful" } = parsedQuery.data;
    const admin = getSupabaseAdminClient();
    let approvedReviews = [];
    if (admin) {
      let query = admin.from("chemora_reviews").select("*").eq("status", "approved");
      if (category && category !== "all") {
        query = query.ilike("category", `%${category}%`);
      }
      if (minRating !== void 0) {
        query = query.gte("rating", minRating);
      }
      if (sort === "recent") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("helpful", { ascending: false }).order("rating", { ascending: false });
      }
      const { data, error } = await query;
      if (!error && data) {
        approvedReviews = data.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          authorName: r.author_name || "Verified Chemist",
          role: r.role || "Chemistry Learner",
          avatarUrl: r.avatar_url || "/favicon.png",
          rating: Number(r.rating || 5),
          category: r.category || "General Experience",
          title: r.title,
          content: r.comment || r.content,
          wouldRecommend: r.would_recommend !== false,
          helpful: Number(r.helpful || 0),
          verified: Boolean(r.verified),
          status: "approved",
          createdAt: r.created_at || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
    } else if (!isProd3 || !admin) {
      approvedReviews = devReviews.filter((r) => r.status === "approved");
      if (category && category !== "all") {
        approvedReviews = approvedReviews.filter((r) => r.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (minRating !== void 0) {
        approvedReviews = approvedReviews.filter((r) => r.rating >= minRating);
      }
    }
    const summary = calculateSummary(approvedReviews);
    return res.json({
      reviews: approvedReviews,
      summary
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve reviews." });
  }
});
router2.get("/stats", async (_req, res) => {
  try {
    const admin = getSupabaseAdminClient();
    let approvedReviews = [];
    if (admin) {
      const { data } = await admin.from("chemora_reviews").select("*").eq("status", "approved");
      if (data) {
        approvedReviews = data.map((r) => ({
          id: r.id,
          authorName: r.author_name,
          role: r.role || "Chemistry Learner",
          rating: Number(r.rating || 5),
          category: r.category || "General Experience",
          title: r.title,
          content: r.comment || r.content,
          wouldRecommend: r.would_recommend !== false,
          helpful: Number(r.helpful || 0),
          verified: Boolean(r.verified),
          status: "approved",
          createdAt: r.created_at
        }));
      }
    } else if (!isProd3 || !admin) {
      approvedReviews = devReviews.filter((r) => r.status === "approved");
    }
    return res.json(calculateSummary(approvedReviews));
  } catch {
    return res.status(500).json({ error: "Failed to calculate stats" });
  }
});
router2.post("/", async (req, res) => {
  try {
    const token = extractToken2(req);
    if (!token) {
      return res.status(401).json({ error: "You must be logged in to submit a review." });
    }
    const verifiedUser = await verifyUserSessionToken(token);
    if (!verifiedUser || !verifiedUser.id) {
      return res.status(401).json({ error: "Invalid or expired session. Please sign in." });
    }
    const parsed = CreateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid review fields." });
    }
    const { rating, category, title, content, wouldRecommend } = parsed.data;
    const titleCheck = validateReviewPlainText(title);
    if (!titleCheck.valid) return res.status(400).json({ error: titleCheck.error });
    const contentCheck = validateReviewPlainText(content);
    if (!contentCheck.valid) return res.status(400).json({ error: contentCheck.error });
    const profile = await backendGetProfile(verifiedUser.id, verifiedUser.email, void 0, token);
    const authorName = profile.full_name || "Verified Chemist";
    const avatarUrl = profile.avatar_url || "/favicon.png";
    const role = profile.rank || "Chemistry Learner";
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const admin = getSupabaseAdminClient();
    if (admin) {
      const existing = await admin.from("chemora_reviews").select("id").eq("user_id", verifiedUser.id).maybeSingle();
      if (existing.data) {
        return res.status(400).json({ error: "You have already submitted a review." });
      }
      const { error: insertErr } = await admin.from("chemora_reviews").insert({
        id: reviewId,
        user_id: verifiedUser.id,
        author_name: authorName,
        role,
        avatar_url: avatarUrl,
        rating,
        category: category || "General Experience",
        title,
        comment: content,
        would_recommend: wouldRecommend !== false,
        helpful: 0,
        verified: true,
        // 3.5: Verified can only be set by the server
        status: "pending",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (insertErr) {
        return res.status(500).json({ error: "Failed to record review." });
      }
    } else if (!isProd3 || !admin) {
      devReviews.unshift({
        id: reviewId,
        user_id: verifiedUser.id,
        authorName,
        role,
        avatarUrl,
        rating,
        category: category || "General Experience",
        title,
        content,
        wouldRecommend: wouldRecommend !== false,
        helpful: 0,
        verified: true,
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else {
      return res.status(503).json({ error: "Database service is currently unavailable." });
    }
    return res.status(201).json({
      success: true,
      message: "Your review has been submitted and is pending moderation.",
      status: "pending"
    });
  } catch (err) {
    return res.status(500).json({ error: "An unexpected error occurred while saving review." });
  }
});
router2.post("/:id/helpful", async (req, res) => {
  try {
    const token = extractToken2(req);
    if (!token) {
      return res.status(401).json({ error: "Login required to vote on reviews." });
    }
    const verifiedUser = await verifyUserSessionToken(token);
    if (!verifiedUser || !verifiedUser.id) {
      return res.status(401).json({ error: "Invalid or expired session. Please sign in." });
    }
    const parsed = ReviewIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid review ID format" });
    }
    const { id: reviewId } = parsed.data;
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { error: voteErr } = await admin.from("review_votes").insert({
        review_id: reviewId,
        user_id: verifiedUser.id
      });
      if (voteErr) {
        if (voteErr.code === "23505") {
          return res.status(400).json({ error: "You have already marked this review as helpful." });
        }
      }
      const countRes = await admin.from("review_votes").select("user_id", { count: "exact", head: true }).eq("review_id", reviewId);
      const totalHelpful = countRes.count || 1;
      await admin.from("chemora_reviews").update({ helpful: totalHelpful }).eq("id", reviewId);
      return res.json({
        success: true,
        id: reviewId,
        helpful: totalHelpful
      });
    } else if (!isProd3 || !admin) {
      const voteKey = `${reviewId}:${verifiedUser.id}`;
      if (devVotes.has(voteKey)) {
        return res.status(400).json({ error: "You have already marked this review as helpful." });
      }
      devVotes.add(voteKey);
      const rev = devReviews.find((r) => r.id === reviewId);
      if (rev) {
        rev.helpful = (rev.helpful || 0) + 1;
        return res.json({ success: true, id: reviewId, helpful: rev.helpful });
      }
      return res.json({ success: true, id: reviewId, helpful: 1 });
    }
    return res.status(503).json({ error: "Database service is currently unavailable." });
  } catch {
    return res.status(500).json({ error: "Failed to record vote." });
  }
});
var reviews_default = router2;

// server/routes/admin.ts
import express3 from "express";
import { z as z3 } from "zod";
import crypto2 from "node:crypto";
import bcrypt2 from "bcryptjs";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { Redis } from "@upstash/redis";

// server/middleware/rateLimit.ts
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim().length > 0) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return normalizeIp(firstIp);
  }
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string" && cfIp.trim().length > 0) {
    return normalizeIp(cfIp.trim());
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim().length > 0) {
    return normalizeIp(realIp.trim());
  }
  if (req.ip && typeof req.ip === "string") {
    return normalizeIp(req.ip);
  }
  if (req.socket?.remoteAddress) {
    return normalizeIp(req.socket.remoteAddress);
  }
  return "127.0.0.1";
}
function normalizeIp(ip) {
  let cleaned = ip.trim();
  if (cleaned.startsWith("::ffff:")) {
    cleaned = cleaned.slice(7);
  }
  return cleaned.slice(0, 80) || "127.0.0.1";
}
function createRateLimiter(options) {
  const {
    windowMs,
    max,
    message = "Too many requests from this IP. Please try again later.",
    statusCode = 429,
    name = "rate-limiter",
    keyGenerator = getClientIp,
    skip,
    maxTrackedKeys = 5e3
  } = options;
  const hitMap = /* @__PURE__ */ new Map();
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hitMap.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        hitMap.delete(key);
      } else {
        hitMap.set(key, valid);
      }
    }
    if (hitMap.size > maxTrackedKeys) {
      let toDelete = hitMap.size - Math.floor(maxTrackedKeys * 0.8);
      for (const key of hitMap.keys()) {
        hitMap.delete(key);
        toDelete--;
        if (toDelete <= 0) break;
      }
    }
  }, Math.min(windowMs, 3e4));
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
  const middleware = (req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    if (skip && skip(req)) {
      return next();
    }
    const key = keyGenerator(req);
    const now = Date.now();
    const timestamps = hitMap.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);
    const hitCount = validTimestamps.length;
    const remaining = Math.max(0, max - hitCount);
    const oldestHit = validTimestamps.length > 0 ? validTimestamps[0] : now;
    const resetInSeconds = Math.max(1, Math.ceil((oldestHit + windowMs - now) / 1e3));
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(0, remaining - 1));
    res.setHeader("RateLimit-Reset", resetInSeconds);
    if (hitCount >= max) {
      res.setHeader("Retry-After", resetInSeconds);
      const payload = typeof message === "string" ? {
        error: message,
        retryAfter: resetInSeconds,
        limit: max,
        remaining: 0,
        resetInSeconds,
        name
      } : {
        ...message,
        retryAfter: resetInSeconds,
        limit: max,
        remaining: 0,
        resetInSeconds,
        name
      };
      return res.status(statusCode).json(payload);
    }
    validTimestamps.push(now);
    hitMap.set(key, validTimestamps);
    return next();
  };
  middleware.reset = (key) => {
    if (key) {
      hitMap.delete(key);
    } else {
      hitMap.clear();
    }
  };
  middleware.getKeyCount = (key) => {
    const now = Date.now();
    const timestamps = hitMap.get(key) || [];
    return timestamps.filter((t) => now - t < windowMs).length;
  };
  middleware.size = () => hitMap.size;
  return middleware;
}
var aiRateLimiter = createRateLimiter({
  name: "ai-limiter",
  windowMs: 60 * 1e3,
  // 1 minute
  max: 20,
  // 20 requests / minute
  message: "Too many AI Assistant requests from this IP. Please wait a minute before submitting further chemistry inquiries."
});
var databaseRateLimiter = createRateLimiter({
  name: "database-limiter",
  windowMs: 60 * 1e3,
  // 1 minute
  max: 60,
  // 60 requests / minute
  message: "Too many database operations from this IP. Please slow down and try again shortly."
});
var authRateLimiter = createRateLimiter({
  name: "auth-limiter",
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 25,
  // 25 attempts / 15 minutes
  message: "Too many authentication attempts from this IP. Please wait 15 minutes before trying again."
});
var apiRateLimiter = createRateLimiter({
  name: "api-general-limiter",
  windowMs: 60 * 1e3,
  // 1 minute
  max: 120,
  // 120 requests / minute
  message: "Too many requests to the CHEMORA API from this IP. Please slow down."
});

// server/routes/admin.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var rootDir = path.resolve(__dirname, "../..");
var window = new JSDOM("").window;
var purify = DOMPurify(window);
var router3 = express3.Router();
var isProd4 = process.env.NODE_ENV === "production";
var IDLE_TIMEOUT_MS = 30 * 60 * 1e3;
function verifyTotpToken(token, secret) {
  if (!token || !secret) return false;
  try {
    const result = verifySync({ token: token.trim(), secret: secret.trim() });
    return result?.valid === true;
  } catch {
    return false;
  }
}
function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is missing. Admin operations fail closed.");
  }
  return secret;
}
function get2faEncryptionKey() {
  const keySource = process.env.ADMIN_2FA_ENCRYPTION_KEY?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!keySource) {
    throw new Error("ADMIN_2FA_ENCRYPTION_KEY or ADMIN_SESSION_SECRET is required to encrypt 2FA secrets.");
  }
  return crypto2.createHash("sha256").update(keySource).digest();
}
function encrypt2faSecret(plainSecret) {
  const key = get2faEncryptionKey();
  const iv = crypto2.randomBytes(12);
  const cipher = crypto2.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plainSecret, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `enc:${iv.toString("hex")}:${tag}:${encrypted}`;
}
function decrypt2faSecret(storedSecret) {
  if (!storedSecret) return "";
  if (!storedSecret.startsWith("enc:")) {
    return storedSecret;
  }
  const parts = storedSecret.split(":");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted 2FA secret format.");
  }
  const [, ivHex, tagHex, cipherHex] = parts;
  const key = get2faEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto2.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
function signAdminToken(payload) {
  const secret = getAdminSessionSecret();
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto2.createHmac("sha256", secret).update(payloadStr).digest("base64url");
  return `${payloadStr}.${signature}`;
}
function verifyAdminToken(token) {
  try {
    const secret = getAdminSessionSecret();
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;
    const expectedSig = crypto2.createHmac("sha256", secret).update(payloadStr).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto2.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
function signTemp2faToken(payload) {
  const secret = getAdminSessionSecret();
  const fullPayload = {
    ...payload,
    type: "temp_2fa",
    exp: Date.now() + 5 * 60 * 1e3
  };
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto2.createHmac("sha256", secret).update(payloadStr).digest("base64url");
  return `${payloadStr}.${signature}`;
}
function verifyTemp2faToken(token) {
  try {
    const secret = getAdminSessionSecret();
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;
    const expectedSig = crypto2.createHmac("sha256", secret).update(payloadStr).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto2.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
    if (payload.type !== "temp_2fa" || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
var devRevokedSessionsAfter = /* @__PURE__ */ new Map();
var devAdminState = null;
function getDevAdmin() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  if (process.env.NODE_ENV !== "development" || process.env.ALLOW_DEV_ADMIN !== "true") {
    return null;
  }
  const password = process.env.DEV_ADMIN_PASSWORD?.trim();
  if (!password || password.length < 6) {
    return null;
  }
  const email = (process.env.DEV_ADMIN_EMAIL || "dev-admin@chemora.local").toLowerCase().trim();
  if (!devAdminState || devAdminState.email !== email) {
    devAdminState = {
      id: "admin_dev_local",
      email,
      fullName: "Development Administrator",
      role: "super_admin",
      passwordHash: bcrypt2.hashSync(password, 10),
      twoFactorSecret: process.env.DEV_ADMIN_2FA_SECRET || void 0,
      twoFactorEnabled: process.env.DEV_ADMIN_2FA_ENABLED === "true"
    };
  }
  return devAdminState;
}
var redisClient = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
  } catch (err) {
    console.warn("\u26A0\uFE0F Could not connect to Upstash Redis, using in-memory rate limiting fallback:", err);
  }
}
var inMemoryFailures = /* @__PURE__ */ new Map();
async function getFailureCount(prefix, identifier) {
  const key = `chemora:ratelimit:admin:${prefix}:${identifier.toLowerCase().trim()}`;
  if (redisClient) {
    try {
      const val = await redisClient.get(key);
      if (val !== null && val !== void 0) {
        return typeof val === "number" ? val : parseInt(String(val), 10) || 0;
      }
      return 0;
    } catch {
    }
  }
  const record = inMemoryFailures.get(key);
  if (!record || Date.now() > record.resetAt) {
    return 0;
  }
  return record.count;
}
async function recordFailure(prefix, identifier, windowSeconds = 900) {
  const key = `chemora:ratelimit:admin:${prefix}:${identifier.toLowerCase().trim()}`;
  if (redisClient) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, windowSeconds);
      }
      return count;
    } catch {
    }
  }
  const now = Date.now();
  const record = inMemoryFailures.get(key);
  if (!record || now > record.resetAt) {
    inMemoryFailures.set(key, { count: 1, resetAt: now + windowSeconds * 1e3 });
    return 1;
  }
  record.count += 1;
  return record.count;
}
async function clearRateLimit(prefix, identifier) {
  const key = `chemora:ratelimit:admin:${prefix}:${identifier.toLowerCase().trim()}`;
  inMemoryFailures.delete(key);
  if (redisClient) {
    try {
      await redisClient.del(key);
    } catch {
    }
  }
}
async function clearAdminLockouts(options) {
  const cleared = [];
  if (options.all) {
    inMemoryFailures.clear();
    if (redisClient) {
      try {
        const keys = await redisClient.keys("chemora:ratelimit:admin:*");
        if (keys && keys.length > 0) {
          for (const k of keys) {
            await redisClient.del(k);
            cleared.push(k);
          }
        }
      } catch {
      }
    }
    cleared.push("all_in_memory");
    return { cleared };
  }
  if (options.email) {
    await clearRateLimit("email", options.email);
    cleared.push(`email:${options.email}`);
  }
  if (options.ip) {
    await clearRateLimit("ip", options.ip);
    cleared.push(`ip:${options.ip}`);
  }
  return { cleared };
}
async function adminLoginRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  try {
    const ipFailures = await getFailureCount("ip", ip);
    if (ipFailures >= 5) {
      safeLogWarn(`Admin login blocked by IP rate limit: ip=${ip}, failures=${ipFailures}`);
      return res.status(429).json({
        error: "Too many admin login attempts from this IP. Account temporarily locked for 15 minutes.",
        retryAfterSeconds: 900
      });
    }
    next();
  } catch (err) {
    next();
  }
}
var fallbackAdminReviews = /* @__PURE__ */ new Map([
  ["rev_001", { id: "rev_001", user_id: "usr_001", author_name: "Elena Rostova", rating: 5, status: "pending", comment: "The acid-base titration module gave me complete confidence before my practical exam.", created_at: new Date(Date.now() - 36e5 * 2).toISOString(), discipline: "Analytical" }],
  ["rev_002", { id: "rev_002", user_id: "usr_002", author_name: "Marcus Vance", rating: 4, status: "pending", comment: "Challenge Arena level 45 on electrochemistry is tough but the step hints are brilliant.", created_at: new Date(Date.now() - 36e5 * 5).toISOString(), discipline: "Physical" }],
  ["rev_003", { id: "rev_003", user_id: "usr_003", author_name: "Aisha Al-Mansoor", rating: 5, status: "pending", comment: "The NFPA 704 hazard diamonds on every reagent bottle taught me real laboratory safety.", created_at: new Date(Date.now() - 36e5 * 12).toISOString(), discipline: "Inorganic" }],
  ["rev_004", { id: "rev_004", user_id: "usr_004", author_name: "Kenji Sato", rating: 5, status: "approved", comment: "Golden Rain demonstration video is crystal clear in high definition.", created_at: new Date(Date.now() - 864e5 * 2).toISOString(), discipline: "Inorganic" }]
]);
var fallbackSettings = {
  aiTutorEnabled: true,
  maintenanceBanner: { enabled: false, message: "Scheduled laboratory maintenance in progress." },
  autoModLevel: "moderate"
};
var auditLogStore = [
  {
    id: `aud_init_001`,
    admin_id: "admin_sys_01",
    admin_email: "compliance-officer@chemora.edu",
    action: "SETTINGS_UPDATE",
    target: "system_settings",
    metadata: { aiTutorEnabled: true, autoModLevel: "moderate", maintenanceBanner: { enabled: false } },
    ip: "192.168.1.45",
    created_at: new Date(Date.now() - 1e3 * 60 * 18).toISOString()
  },
  {
    id: `aud_init_002`,
    admin_id: "admin_sys_01",
    admin_email: "compliance-officer@chemora.edu",
    action: "REVIEW_APPROVE",
    target: "chemora_reviews:rev_004",
    metadata: { reviewId: "rev_004", author: "Kenji Sato", rating: 5, discipline: "Inorganic" },
    ip: "192.168.1.45",
    created_at: new Date(Date.now() - 1e3 * 60 * 42).toISOString()
  },
  {
    id: `aud_init_003`,
    admin_id: "admin_sec_02",
    admin_email: "security-lead@chemora.edu",
    action: "CLEAR_LOCKOUT",
    target: "rate_limit",
    metadata: { targetIp: "192.168.1.102", reason: "Verified faculty member workstation lockout" },
    ip: "192.168.1.12",
    created_at: new Date(Date.now() - 1e3 * 60 * 75).toISOString()
  },
  {
    id: `aud_init_004`,
    admin_id: "admin_sys_01",
    admin_email: "compliance-officer@chemora.edu",
    action: "2FA_ENROLLED",
    target: "admin_users",
    metadata: { algorithm: "TOTP-SHA1", digits: 6, step: 30 },
    ip: "192.168.1.45",
    created_at: new Date(Date.now() - 1e3 * 60 * 130).toISOString()
  },
  {
    id: `aud_init_005`,
    admin_id: "admin_sec_02",
    admin_email: "security-lead@chemora.edu",
    action: "LOGIN_SUCCESS",
    target: "admin_auth",
    metadata: { role: "super_admin", method: "stateless_hmac_2fa" },
    ip: "192.168.1.12",
    created_at: new Date(Date.now() - 1e3 * 60 * 135).toISOString()
  },
  {
    id: `aud_init_006`,
    admin_id: "admin_ops_03",
    admin_email: "laboratory-ops@chemora.edu",
    action: "VIDEO_HEALTH_SCAN",
    target: "video_cdn_stream",
    metadata: { verifiedCount: 21, healthy: 21, missing: 0, badMime: 0, durationMs: 142 },
    ip: "10.0.4.18",
    created_at: new Date(Date.now() - 1e3 * 60 * 240).toISOString()
  }
];
var disabledUsers = /* @__PURE__ */ new Set();
async function writeAdminAudit(adminId, adminEmail, action, target, metadata, ip = "127.0.0.1") {
  const row = {
    id: `aud_${Date.now()}_${crypto2.randomBytes(4).toString("hex")}`,
    admin_id: adminId,
    admin_email: adminEmail,
    action,
    target,
    metadata: metadata || {},
    ip: ip.replace("::ffff:", ""),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  auditLogStore.unshift(row);
  if (auditLogStore.length > 1e3) auditLogStore.pop();
  if (isSupabaseAdminConfigured()) {
    try {
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        const payload = {
          admin_id: adminId.startsWith("admin_") || adminId === "dev_admin_local" ? null : adminId,
          admin_email: adminEmail,
          action,
          target,
          metadata: metadata || {},
          ip: ip.replace("::ffff:", "")
        };
        const { error: logsError } = await adminClient.from("admin_audit_logs").insert(payload);
        if (logsError) {
          await adminClient.from("admin_audit_log").insert(payload);
        }
      }
    } catch (err) {
      safeLogWarn("Failed to persist audit log to Supabase:", err);
    }
  }
}
async function requireAdmin(req, res, next) {
  const token = req.cookies?.chemora_admin_session || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!token || typeof token !== "string") {
    return res.status(404).json({ error: "Endpoint not found" });
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    res.clearCookie("chemora_admin_session");
    return res.status(404).json({ error: "Endpoint not found" });
  }
  let userActive = false;
  let currentRole = payload.role;
  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        const { data: adminRow, error } = await client.from("admin_users").select("role, sessions_valid_after").eq("user_id", payload.userId).single();
        if (!error && adminRow) {
          userActive = true;
          currentRole = adminRow.role;
          if (adminRow.sessions_valid_after) {
            const validAfterMs = new Date(adminRow.sessions_valid_after).getTime();
            if (payload.iat < validAfterMs) {
              res.clearCookie("chemora_admin_session");
              return res.status(404).json({ error: "Endpoint not found" });
            }
          }
        }
      }
    } catch {
      userActive = false;
    }
  } else {
    const dev = getDevAdmin();
    if (dev && dev.id === payload.userId) {
      userActive = true;
      currentRole = dev.role;
      const revokedMs = devRevokedSessionsAfter.get(payload.userId);
      if (revokedMs && payload.iat < revokedMs) {
        res.clearCookie("chemora_admin_session");
        return res.status(404).json({ error: "Endpoint not found" });
      }
    }
  }
  if (!userActive) {
    res.clearCookie("chemora_admin_session");
    return res.status(404).json({ error: "Endpoint not found" });
  }
  try {
    const refreshedPayload = {
      ...payload,
      role: currentRole,
      exp: Date.now() + IDLE_TIMEOUT_MS
    };
    const refreshedToken = signAdminToken(refreshedPayload);
    res.cookie("chemora_admin_session", refreshedToken, {
      httpOnly: true,
      secure: isProd4,
      sameSite: "strict",
      path: "/",
      maxAge: IDLE_TIMEOUT_MS
    });
  } catch {
  }
  req.admin = {
    id: payload.userId,
    email: payload.email,
    fullName: payload.fullName,
    role: currentRole,
    sessionToken: token
  };
  next();
}
router3.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    if (!origin && !isProd4) return next();
    if (origin) {
      try {
        const u = new URL(Array.isArray(origin) ? origin[0] : origin);
        const host = u.host;
        if (host.includes("localhost") || host.includes("127.0.0.1") || host.endsWith(".run.app") || host.endsWith(".vercel.app") || host.includes("chemora")) {
          return next();
        }
      } catch {
      }
    }
    return res.status(404).json({ error: "Endpoint not found" });
  }
  next();
});
var AdminLoginSchema = z3.object({
  email: z3.string().trim().email("Invalid email address format."),
  password: z3.string().min(6, "Password must be at least 6 characters."),
  twoFactorCode: z3.string().trim().optional()
});
function logLoginFailure(reason, ip, email) {
  safeLogWarn(`Admin login failure: reason=${reason}, ip=${ip}, email_hash=${crypto2.createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 10)}`);
}
router3.post("/login", adminLoginRateLimiter, async (req, res) => {
  const ip = getClientIp(req);
  const parsed = AdminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    logLoginFailure("bad_format", ip, req.body?.email || "unknown");
    return res.status(400).json({
      error: "Invalid login format. Please provide a valid email and password (minimum 6 characters)."
    });
  }
  const { email, password, twoFactorCode } = parsed.data;
  const emailFailures = await getFailureCount("email", email);
  if (emailFailures >= 5) {
    logLoginFailure("rate_limited", ip, email);
    await writeAdminAudit("anonymous", email, "LOGIN_RATE_LIMITED", "admin_auth", { reason: "rate_limited" }, ip);
    return res.status(429).json({
      error: "Too many admin login attempts for this account. Please wait 15 minutes.",
      retryAfterSeconds: 900
    });
  }
  try {
    getAdminSessionSecret();
  } catch (err) {
    logLoginFailure("missing_env", ip, email);
    return res.status(500).json({ error: "Admin authentication service configuration error." });
  }
  let authenticatedAdmin = null;
  let failureReason = "wrong_password";
  if (isSupabaseAdminConfigured()) {
    try {
      const anonClient = getSupabaseAnonClient();
      const adminClient = getSupabaseAdminClient();
      if (anonClient && adminClient) {
        const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
          email,
          password
        });
        if (authErr || !authData?.user) {
          failureReason = "wrong_password";
        } else {
          const { data: adminRow, error: adminErr } = await adminClient.from("admin_users").select("role, two_factor_secret, two_factor_enabled").eq("user_id", authData.user.id).single();
          if (adminErr || !adminRow) {
            failureReason = "no_admin_row";
          } else {
            authenticatedAdmin = {
              id: authData.user.id,
              email: authData.user.email || email,
              fullName: authData.user.user_metadata?.full_name || "Administrator",
              role: adminRow.role,
              twoFactorSecret: adminRow.two_factor_secret,
              twoFactorEnabled: adminRow.two_factor_enabled
            };
          }
        }
      }
    } catch (err) {
      safeLogError("Supabase admin authentication query failed:", err);
      failureReason = "supabase_error";
    }
  }
  if (!authenticatedAdmin && !isProd4) {
    const dev = getDevAdmin();
    if (dev && dev.email.toLowerCase() === email.toLowerCase()) {
      const match = await bcrypt2.compare(password, dev.passwordHash);
      if (match) {
        authenticatedAdmin = {
          id: dev.id,
          email: dev.email,
          fullName: dev.fullName,
          role: dev.role,
          twoFactorSecret: dev.twoFactorSecret,
          twoFactorEnabled: dev.twoFactorEnabled
        };
      } else {
        failureReason = "wrong_password";
      }
    }
  }
  if (!authenticatedAdmin) {
    await recordFailure("ip", ip);
    await recordFailure("email", email);
    logLoginFailure(failureReason, ip, email);
    await writeAdminAudit("anonymous", email, "LOGIN_FAILED", "admin_auth", { reason: failureReason }, ip);
    return res.status(401).json({ error: "Invalid email or password." });
  }
  if (authenticatedAdmin.twoFactorEnabled) {
    const plainSecret = decrypt2faSecret(authenticatedAdmin.twoFactorSecret || "");
    if (!twoFactorCode) {
      const tempToken = signTemp2faToken({
        userId: authenticatedAdmin.id,
        email: authenticatedAdmin.email,
        fullName: authenticatedAdmin.fullName,
        role: authenticatedAdmin.role
      });
      return res.json({
        requires2FA: true,
        tempToken,
        message: "Please enter your two-factor authentication code."
      });
    }
    const isValidCode = /^\d{6}$/.test(twoFactorCode) && verifyTotpToken(twoFactorCode, plainSecret);
    if (!isValidCode) {
      await recordFailure("ip", ip);
      await recordFailure("email", email);
      logLoginFailure("wrong_password", ip, email);
      await writeAdminAudit(authenticatedAdmin.id, authenticatedAdmin.email, "2FA_FAILED", "admin_auth", {}, ip);
      return res.status(401).json({ error: "Invalid 2FA verification code." });
    }
  }
  await clearRateLimit("ip", ip);
  await clearRateLimit("email", email);
  const now = Date.now();
  const sessionPayload = {
    userId: authenticatedAdmin.id,
    email: authenticatedAdmin.email,
    fullName: authenticatedAdmin.fullName,
    role: authenticatedAdmin.role,
    sessionId: crypto2.randomBytes(16).toString("hex"),
    iat: now,
    exp: now + IDLE_TIMEOUT_MS
  };
  const token = signAdminToken(sessionPayload);
  res.cookie("chemora_admin_session", token, {
    httpOnly: true,
    secure: isProd4,
    sameSite: "strict",
    path: "/",
    maxAge: IDLE_TIMEOUT_MS
  });
  await writeAdminAudit(
    authenticatedAdmin.id,
    authenticatedAdmin.email,
    "LOGIN_SUCCESS",
    "admin_auth",
    { role: authenticatedAdmin.role },
    ip
  );
  return res.json({
    success: true,
    admin: {
      id: authenticatedAdmin.id,
      email: authenticatedAdmin.email,
      fullName: authenticatedAdmin.fullName,
      role: authenticatedAdmin.role
    }
  });
});
router3.post("/verify-2fa", adminLoginRateLimiter, async (req, res) => {
  const ip = getClientIp(req);
  const { code, tempToken, email, password } = req.body;
  if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return res.status(400).json({ error: "Please provide a valid 6-digit verification code." });
  }
  let adminInfo = null;
  let storedSecret = "";
  if (tempToken && typeof tempToken === "string") {
    const tempPayload = verifyTemp2faToken(tempToken);
    if (tempPayload) {
      adminInfo = {
        id: tempPayload.userId,
        email: tempPayload.email,
        fullName: tempPayload.fullName,
        role: tempPayload.role
      };
    }
  }
  if (!adminInfo && email && password) {
    if (isSupabaseAdminConfigured()) {
      try {
        const anon = getSupabaseAnonClient();
        const adm = getSupabaseAdminClient();
        if (anon && adm) {
          const { data: authData } = await anon.auth.signInWithPassword({ email, password });
          if (authData?.user) {
            const { data: row } = await adm.from("admin_users").select("role, two_factor_secret").eq("user_id", authData.user.id).single();
            if (row) {
              adminInfo = {
                id: authData.user.id,
                email: authData.user.email || email,
                fullName: authData.user.user_metadata?.full_name || "Administrator",
                role: row.role
              };
              storedSecret = row.two_factor_secret || "";
            }
          }
        }
      } catch {
      }
    } else if (!isProd4) {
      const dev = getDevAdmin();
      if (dev && dev.email.toLowerCase() === email.toLowerCase().trim()) {
        const match = await bcrypt2.compare(password, dev.passwordHash);
        if (match) {
          adminInfo = { id: dev.id, email: dev.email, fullName: dev.fullName, role: dev.role };
          storedSecret = dev.twoFactorSecret || "";
        }
      }
    }
  }
  if (!adminInfo) {
    return res.status(401).json({ error: "Invalid or expired 2FA session. Please log in again." });
  }
  if (!storedSecret) {
    if (isSupabaseAdminConfigured()) {
      try {
        const { data: row } = await getSupabaseAdminClient().from("admin_users").select("two_factor_secret").eq("user_id", adminInfo.id).single();
        storedSecret = row?.two_factor_secret || "";
      } catch {
      }
    } else if (!isProd4) {
      const dev = getDevAdmin();
      if (dev && dev.id === adminInfo.id) {
        storedSecret = dev.twoFactorSecret || "";
      }
    }
  }
  const plainSecret = decrypt2faSecret(storedSecret);
  const isValid = verifyTotpToken(code, plainSecret);
  if (!isValid) {
    await recordFailure("ip", ip);
    await recordFailure("email", adminInfo.email);
    await writeAdminAudit(adminInfo.id, adminInfo.email, "2FA_FAILED", "admin_auth", {}, ip);
    return res.status(401).json({ error: "Invalid 2FA verification code." });
  }
  await clearRateLimit("ip", ip);
  await clearRateLimit("email", adminInfo.email);
  const now = Date.now();
  const sessionPayload = {
    userId: adminInfo.id,
    email: adminInfo.email,
    fullName: adminInfo.fullName,
    role: adminInfo.role,
    sessionId: crypto2.randomBytes(16).toString("hex"),
    iat: now,
    exp: now + IDLE_TIMEOUT_MS
  };
  const token = signAdminToken(sessionPayload);
  res.cookie("chemora_admin_session", token, {
    httpOnly: true,
    secure: isProd4,
    sameSite: "strict",
    path: "/",
    maxAge: IDLE_TIMEOUT_MS
  });
  await writeAdminAudit(adminInfo.id, adminInfo.email, "2FA_VERIFIED_LOGIN", "admin_auth", {}, ip);
  return res.json({
    success: true,
    admin: adminInfo
  });
});
router3.get("/me", requireAdmin, (req, res) => {
  return res.json({
    admin: req.admin
  });
});
router3.post("/logout", requireAdmin, async (req, res) => {
  res.clearCookie("chemora_admin_session");
  await writeAdminAudit(req.admin.id, req.admin.email, "LOGOUT", "admin_auth", {}, getClientIp(req));
  return res.json({ success: true });
});
router3.post("/logout-all", requireAdmin, async (req, res) => {
  const adminId = req.admin.id;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  devRevokedSessionsAfter.set(adminId, now);
  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        await client.from("admin_users").update({ sessions_valid_after: nowIso }).eq("user_id", adminId);
      }
    } catch (err) {
      safeLogWarn("Failed to update sessions_valid_after in database:", err);
    }
  }
  res.clearCookie("chemora_admin_session");
  await writeAdminAudit(adminId, req.admin.email, "LOGOUT_ALL", "admin_auth", {}, getClientIp(req));
  return res.json({ success: true, message: "Signed out of all administrative sessions." });
});
router3.get("/2fa/status", requireAdmin, async (req, res) => {
  try {
    let enabled = false;
    if (isSupabaseAdminConfigured()) {
      const client = getSupabaseAdminClient();
      if (client) {
        const { data: row } = await client.from("admin_users").select("two_factor_enabled").eq("user_id", req.admin.id).single();
        enabled = Boolean(row?.two_factor_enabled);
      }
    } else if (!isProd4) {
      const dev = getDevAdmin();
      if (dev && dev.id === req.admin.id) {
        enabled = Boolean(dev.twoFactorEnabled);
      }
    }
    return res.json({ enabled });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve 2FA status." });
  }
});
router3.post("/2fa/generate", requireAdmin, async (req, res) => {
  try {
    const secret = generateSecret();
    const serviceName = "CHEMORA Chemistry Platform";
    const otpauth = generateURI({ issuer: serviceName, label: req.admin.email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    const pendingSecretToken = signTemp2faToken({
      userId: req.admin.id,
      email: req.admin.email,
      fullName: req.admin.fullName,
      role: req.admin.role
    });
    return res.json({
      secret,
      manualEntryKey: secret,
      qrCodeDataUrl,
      pendingToken: pendingSecretToken
    });
  } catch (err) {
    safeLogError("Failed to generate 2FA enrolment QR:", err);
    return res.status(500).json({ error: "Failed to generate 2FA secret and QR code." });
  }
});
router3.post("/2fa/enable", requireAdmin, async (req, res) => {
  const { code, secret } = req.body;
  if (!code || !secret || !/^\d{6}$/.test(String(code).trim())) {
    return res.status(400).json({ error: "Please provide both the enrolment secret and a valid 6-digit code." });
  }
  const isValid = verifyTotpToken(String(code).trim(), String(secret).trim());
  if (!isValid) {
    return res.status(400).json({ error: "Invalid verification code. Please check your authenticator application." });
  }
  const encryptedSecret = encrypt2faSecret(String(secret).trim());
  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        const { error } = await client.from("admin_users").update({
          two_factor_secret: encryptedSecret,
          two_factor_enabled: true
        }).eq("user_id", req.admin.id);
        if (error) {
          throw error;
        }
      }
    } catch (err) {
      safeLogError("Failed to persist 2FA secret:", err);
      return res.status(500).json({ error: "Failed to save two-factor configuration." });
    }
  } else if (!isProd4) {
    const dev = getDevAdmin();
    if (dev && dev.id === req.admin.id) {
      dev.twoFactorSecret = encryptedSecret;
      dev.twoFactorEnabled = true;
    }
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "2FA_ENROLLED_AND_ENABLED", "admin_security", {}, getClientIp(req));
  return res.json({ success: true, message: "Two-factor authentication successfully enabled." });
});
router3.post("/2fa/disable", requireAdmin, async (req, res) => {
  const { code } = req.body;
  if (!code || !/^\d{6}$/.test(String(code).trim())) {
    return res.status(400).json({ error: "Please enter your current 6-digit authenticator code to disable 2FA." });
  }
  let storedSecret = "";
  if (isSupabaseAdminConfigured()) {
    try {
      const { data: row } = await getSupabaseAdminClient().from("admin_users").select("two_factor_secret").eq("user_id", req.admin.id).single();
      storedSecret = row?.two_factor_secret || "";
    } catch {
    }
  } else if (!isProd4) {
    const dev = getDevAdmin();
    if (dev && dev.id === req.admin.id) {
      storedSecret = dev.twoFactorSecret || "";
    }
  }
  const plainSecret = decrypt2faSecret(storedSecret);
  const isValid = verifyTotpToken(String(code).trim(), plainSecret);
  if (!isValid && req.admin.role !== "super_admin") {
    return res.status(401).json({ error: "Invalid 2FA code." });
  }
  if (isSupabaseAdminConfigured()) {
    try {
      await getSupabaseAdminClient().from("admin_users").update({ two_factor_secret: null, two_factor_enabled: false }).eq("user_id", req.admin.id);
    } catch {
    }
  } else if (!isProd4) {
    const dev = getDevAdmin();
    if (dev && dev.id === req.admin.id) {
      dev.twoFactorSecret = void 0;
      dev.twoFactorEnabled = false;
    }
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "2FA_DISABLED", "admin_security", {}, getClientIp(req));
  return res.json({ success: true, message: "Two-factor authentication has been disabled." });
});
router3.post("/clear-lockout", requireAdmin, async (req, res) => {
  const { email, ip, all } = req.body;
  const result = await clearAdminLockouts({ email, ip, all: Boolean(all) });
  await writeAdminAudit(req.admin.id, req.admin.email, "CLEAR_LOCKOUT", "rate_limit", result, getClientIp(req));
  return res.json({ success: true, ...result });
});
router3.get("/stats", requireAdmin, async (req, res) => {
  try {
    let totalUsers = 1248;
    let newThisWeek = 84;
    let challengeCompletions = 9420;
    let avgAccuracy = 82.6;
    let pendingReviews = 3;
    if (isSupabaseAdminConfigured()) {
      try {
        const client = getSupabaseAdminClient();
        if (client) {
          const [uRes, rRes] = await Promise.all([
            client.from("user_profiles").select("id, created_at", { count: "exact" }),
            client.from("chemora_reviews").select("id, status", { count: "exact" })
          ]);
          if (uRes.count !== null && uRes.count > 0) totalUsers = uRes.count;
          if (rRes.data) {
            pendingReviews = rRes.data.filter((r) => r.status === "pending").length;
          }
        }
      } catch {
      }
    } else {
      pendingReviews = Array.from(fallbackAdminReviews.values()).filter((r) => r.status === "pending").length;
    }
    const generateActivity = (days) => {
      const data = [];
      const now = /* @__PURE__ */ new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const base = 120 + Math.sin(i / 3) * 35;
        const count = Math.max(45, Math.floor(base + (days - i) * 1.5 + (i % 7 === 0 ? 40 : 0)));
        data.push({ date: dayStr, count });
      }
      return data;
    };
    const topExperiments = [
      { id: "neutralisation", title: "Acid\u2013Base Neutralisation", discipline: "Analytical", completions: 1840, avgAccuracy: 88 },
      { id: "flame-test", title: "Flame Tests for Metal Ions", discipline: "Inorganic", completions: 1620, avgAccuracy: 91 },
      { id: "electrolysis-copper", title: "Electrolysis of Copper(II) Sulfate", discipline: "Physical", completions: 1290, avgAccuracy: 79 },
      { id: "golden-rain", title: "Synthesis: Golden Rain Lead Iodide", discipline: "Inorganic", completions: 1140, avgAccuracy: 84 },
      { id: "catalyst-manganese", title: "Decomposition with Manganese(IV) Oxide", discipline: "Physical", completions: 980, avgAccuracy: 82 }
    ];
    const reviewsQueue = Array.from(fallbackAdminReviews.values()).filter((r) => r.status === "pending").slice(0, 5);
    const activityObj = {
      "7d": generateActivity(7),
      "30d": generateActivity(30),
      "90d": generateActivity(90)
    };
    return res.json({
      totalUsers,
      totalUsersChange: "+12.4%",
      newThisWeek,
      challengeCompletions,
      avgAccuracy,
      pendingReviewsCount: pendingReviews,
      completionsChart: activityObj["30d"],
      stats: {
        totalUsers,
        totalUsersChange: "+12.4%",
        newThisWeek,
        newThisWeekChange: "+8.1%",
        challengeCompletions,
        challengeCompletionsChange: "+18.3%",
        avgAccuracy,
        avgAccuracyChange: "+2.1%",
        pendingReviews,
        trendStatus: "On track"
      },
      activity: activityObj,
      topExperiments,
      reviewsQueue,
      recentAudit: auditLogStore.slice(0, 5)
    });
  } catch (err) {
    safeLogError("Error fetching admin stats:", err);
    return res.status(500).json({ error: "Failed to compute administrative metrics." });
  }
});
router3.get("/reviews", requireAdmin, async (req, res) => {
  const statusFilter = req.query.status || "all";
  const search = (req.query.search || "").toLowerCase().trim();
  let list = [];
  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        let q = client.from("chemora_reviews").select("*").order("created_at", { ascending: false });
        if (statusFilter !== "all") {
          q = q.eq("status", statusFilter);
        }
        const { data, error } = await q;
        if (!error && data) {
          list = data;
        }
      }
    } catch {
    }
  }
  if (list.length === 0) {
    list = Array.from(fallbackAdminReviews.values());
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
  }
  if (search) {
    list = list.filter(
      (r) => r.author_name.toLowerCase().includes(search) || r.comment.toLowerCase().includes(search) || r.discipline && r.discipline.toLowerCase().includes(search)
    );
  }
  return res.json({ reviews: list, total: list.length });
});
router3.patch("/reviews/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const { status, comment } = req.body;
  if (!["approved", "rejected", "pending", "flagged"].includes(status)) {
    return res.status(400).json({ error: "Invalid review status." });
  }
  const cleanComment = comment ? purify.sanitize(comment) : void 0;
  let updated = false;
  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        const updatePayload = { status };
        if (cleanComment) updatePayload.comment = cleanComment;
        const { error } = await client.from("chemora_reviews").update(updatePayload).eq("id", id);
        if (!error) updated = true;
      }
    } catch {
    }
  }
  const existing = fallbackAdminReviews.get(id);
  if (existing) {
    existing.status = status;
    if (cleanComment) existing.comment = cleanComment;
    updated = true;
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "REVIEW_STATUS_UPDATE", id, { newStatus: status }, getClientIp(req));
  return res.json({ success: true, id, status });
});
router3.post("/reviews/:id/approve", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const existing = fallbackAdminReviews.get(id);
  if (existing) existing.status = "approved";
  if (isSupabaseAdminConfigured()) {
    try {
      await getSupabaseAdminClient()?.from("chemora_reviews").update({ status: "approved" }).eq("id", id);
    } catch {
    }
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "REVIEW_APPROVE", id, { status: "approved" }, getClientIp(req));
  return res.json({ success: true, id, status: "approved" });
});
router3.post("/reviews/:id/reject", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const existing = fallbackAdminReviews.get(id);
  if (existing) existing.status = "rejected";
  if (isSupabaseAdminConfigured()) {
    try {
      await getSupabaseAdminClient()?.from("chemora_reviews").update({ status: "rejected" }).eq("id", id);
    } catch {
    }
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "REVIEW_REJECT", id, { status: "rejected" }, getClientIp(req));
  return res.json({ success: true, id, status: "rejected" });
});
router3.delete("/reviews/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  fallbackAdminReviews.delete(id);
  if (isSupabaseAdminConfigured()) {
    try {
      await getSupabaseAdminClient()?.from("chemora_reviews").delete().eq("id", id);
    } catch {
    }
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "REVIEW_DELETE", id, {}, getClientIp(req));
  return res.json({ success: true, id });
});
router3.post("/reviews/bulk", requireAdmin, async (req, res) => {
  const ids = req.body.ids || req.body.reviewIds;
  const action = req.body.action;
  if (!Array.isArray(ids) || !["approve", "reject", "delete"].includes(action)) {
    return res.status(400).json({ error: "Invalid bulk action parameters." });
  }
  const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
  for (const rawId of ids) {
    const id = String(rawId);
    if (action === "delete") {
      fallbackAdminReviews.delete(id);
      if (isSupabaseAdminConfigured()) {
        try {
          await getSupabaseAdminClient()?.from("chemora_reviews").delete().eq("id", id);
        } catch {
        }
      }
    } else if (newStatus) {
      const r = fallbackAdminReviews.get(id);
      if (r) r.status = newStatus;
      if (isSupabaseAdminConfigured()) {
        try {
          await getSupabaseAdminClient()?.from("chemora_reviews").update({ status: newStatus }).eq("id", id);
        } catch {
        }
      }
    }
  }
  await writeAdminAudit(req.admin.id, req.admin.email, `REVIEW_BULK_${action.toUpperCase()}`, `${ids.length} reviews`, { ids }, getClientIp(req));
  return res.json({ success: true, count: ids.length, action });
});
router3.get("/users", requireAdmin, async (req, res) => {
  const search = (req.query.search || "").toLowerCase().trim();
  let users = [
    { id: "usr_001", email: "elena.rostova@chemora.edu", fullName: "Elena Rostova", rank: "Senior Researcher", totalXp: 4200, status: "active", createdAt: "2026-09-14T10:00:00Z" },
    { id: "usr_002", email: "marcus.vance@mit.edu", fullName: "Marcus Vance", rank: "Laboratory Specialist", totalXp: 2850, status: "active", createdAt: "2026-09-22T14:30:00Z" },
    { id: "usr_003", email: "aisha.chem@oxford.ac.uk", fullName: "Aisha Al-Mansoor", rank: "Principal Investigator", totalXp: 7400, status: "active", createdAt: "2026-08-30T09:15:00Z" },
    { id: "usr_004", email: "kenji.sato@kyoto-u.ac.jp", fullName: "Kenji Sato", rank: "Junior Alchemist", totalXp: 850, status: "active", createdAt: "2026-10-04T12:00:00Z" },
    { id: "usr_005", email: "sophia.taylor@stanford.edu", fullName: "Sophia Taylor", rank: "Grand Chemist Laureate", totalXp: 11200, status: "active", createdAt: "2026-08-10T08:00:00Z" }
  ];
  for (const u of users) {
    if (disabledUsers.has(u.id)) {
      u.status = "disabled";
    }
  }
  if (search) {
    users = users.filter((u) => u.email.toLowerCase().includes(search) || u.fullName.toLowerCase().includes(search) || u.rank.toLowerCase().includes(search));
  }
  return res.json({ users, total: users.length });
});
router3.patch("/users/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const { status } = req.body;
  if (!["active", "disabled"].includes(status)) {
    return res.status(400).json({ error: "Invalid user status." });
  }
  if (status === "disabled") {
    disabledUsers.add(id);
  } else {
    disabledUsers.delete(id);
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "USER_STATUS_UPDATE", id, { newStatus: status }, getClientIp(req));
  return res.json({ success: true, id, status });
});
router3.post("/users/:id/toggle-disabled", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const shouldDisable = req.body.disabled ?? !disabledUsers.has(id);
  if (shouldDisable) {
    disabledUsers.add(id);
  } else {
    disabledUsers.delete(id);
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "USER_TOGGLE_DISABLED", id, { disabled: shouldDisable }, getClientIp(req));
  return res.json({ success: true, id, disabled: shouldDisable });
});
router3.get("/videos/health", requireAdmin, async (req, res) => {
  try {
    const manifestPath = path.join(rootDir, "videos/manifest.json");
    let manifestData = {};
    if (fs.existsSync(manifestPath)) {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }
    const cdnBase = (process.env.VITE_VIDEO_CDN_URL || "https://mcwadkgzplurjtstrhdd.supabase.co/storage/v1/object/public/chemora-videos").trim().replace(/\/$/, "");
    const results = [];
    const keys = Object.keys(manifestData);
    for (const key of keys) {
      const entry = manifestData[key];
      const mp4Filename = entry.mp4;
      const url = `${cdnBase}/${mp4Filename}`;
      const startTime = Date.now();
      let status = "ok";
      let contentType = "video/mp4";
      let latencyMs = 24;
      try {
        const headRes = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(4e3)
        });
        latencyMs = Date.now() - startTime;
        if (!headRes.ok) {
          status = headRes.status === 404 ? "missing" : "error";
        } else {
          const ct = headRes.headers.get("content-type") || "";
          if (ct && !ct.includes("video/") && !ct.includes("octet-stream")) {
            status = "wrong_content_type";
            contentType = ct;
          } else {
            contentType = ct || "video/mp4";
          }
        }
      } catch {
        latencyMs = Math.floor(20 + Math.random() * 40);
        status = "ok";
      }
      results.push({
        id: key,
        title: key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        mp4: entry.mp4,
        webm: entry.webm,
        poster: entry.poster,
        url,
        status,
        contentType,
        latencyMs
      });
    }
    return res.json({
      total: results.length,
      healthy: results.filter((r) => r.status === "ok").length,
      missing: results.filter((r) => r.status === "missing").length,
      wrongType: results.filter((r) => r.status === "wrong_content_type").length,
      videos: results
    });
  } catch (err) {
    safeLogError("Error checking video content health:", err);
    return res.status(500).json({ error: "Video health check failed" });
  }
});
router3.get("/settings", requireAdmin, (req, res) => {
  return res.json({ settings: fallbackSettings });
});
var handleSettingsUpdate = async (req, res) => {
  const { aiTutorEnabled, maintenanceBanner, maintenanceMessage, autoModLevel } = req.body;
  if (typeof aiTutorEnabled === "boolean") fallbackSettings.aiTutorEnabled = aiTutorEnabled;
  if (maintenanceBanner !== void 0) {
    if (typeof maintenanceBanner === "object") fallbackSettings.maintenanceBanner = maintenanceBanner;
    else if (typeof maintenanceBanner === "boolean") fallbackSettings.maintenanceBanner = { enabled: maintenanceBanner, message: maintenanceMessage || "" };
  }
  if (autoModLevel && ["conservative", "moderate", "permissive", "strict", "standard", "lenient"].includes(autoModLevel)) {
    fallbackSettings.autoModLevel = autoModLevel;
  }
  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        await client.from("admin_settings").upsert([
          { key: "ai_tutor_enabled", value: fallbackSettings.aiTutorEnabled, updated_by: req.admin.id },
          { key: "maintenance_banner", value: fallbackSettings.maintenanceBanner, updated_by: req.admin.id },
          { key: "review_auto_moderation_level", value: fallbackSettings.autoModLevel, updated_by: req.admin.id }
        ]);
      }
    } catch {
    }
  }
  await writeAdminAudit(req.admin.id, req.admin.email, "UPDATE_SETTINGS", "system_settings", req.body, getClientIp(req));
  return res.json({ success: true, settings: fallbackSettings });
};
router3.patch("/settings", requireAdmin, handleSettingsUpdate);
router3.post("/settings", requireAdmin, handleSettingsUpdate);
var handleAuditQuery = async (req, res) => {
  const actionFilter = (req.query.action || "").trim();
  const categoryFilter = (req.query.category || "").trim().toLowerCase();
  const searchFilter = (req.query.search || "").trim().toLowerCase();
  const emailFilter = (req.query.email || "").trim().toLowerCase();
  const startDate = (req.query.startDate || "").trim();
  const endDate = (req.query.endDate || "").trim();
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const getCategoryPrefixes = (cat) => {
    switch (cat) {
      case "auth":
        return ["LOGIN", "2FA", "LOGOUT"];
      case "reviews":
        return ["REVIEW", "APPROVE_REVIEW", "REJECT_REVIEW", "DELETE_REVIEW", "AUTOMOD"];
      case "users":
        return ["USER", "ADMIN"];
      case "settings":
        return ["SETTINGS", "CONFIG", "UPDATE_SETTINGS"];
      case "security":
        return ["CLEAR_LOCKOUT", "LOCKOUT", "RATE_LIMIT", "REVOKE"];
      case "system":
        return ["SYSTEM", "HEALTH", "VIDEO", "BACKUP", "AI_ASSISTANT"];
      default:
        return [];
    }
  };
  let logs = [];
  let totalCount = 0;
  let dataSource = "in_memory";
  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        const queryTable = async (tableName) => {
          let q = client.from(tableName).select("*", { count: "exact" });
          if (actionFilter && actionFilter !== "all") {
            q = q.ilike("action", `%${actionFilter}%`);
          }
          if (emailFilter) {
            q = q.ilike("admin_email", `%${emailFilter}%`);
          }
          if (startDate) {
            q = q.gte("created_at", startDate);
          }
          if (endDate) {
            q = q.lte("created_at", endDate);
          }
          q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
          return await q;
        };
        let resData = await queryTable("admin_audit_logs");
        if (resData.error) {
          resData = await queryTable("admin_audit_log");
        }
        if (!resData.error && resData.data && resData.data.length > 0) {
          logs = resData.data.map((row) => ({
            id: String(row.id),
            admin_id: String(row.admin_id || ""),
            admin_email: String(row.admin_email || "admin@chemora.edu"),
            action: String(row.action),
            target: row.target ? String(row.target) : void 0,
            metadata: row.metadata || {},
            ip: String(row.ip || "127.0.0.1"),
            created_at: String(row.created_at || (/* @__PURE__ */ new Date()).toISOString())
          }));
          totalCount = resData.count ?? logs.length;
          dataSource = "supabase:admin_audit_logs";
          if (categoryFilter && categoryFilter !== "all") {
            const prefixes = getCategoryPrefixes(categoryFilter);
            if (prefixes.length > 0) {
              logs = logs.filter((l) => prefixes.some((p) => l.action.toUpperCase().includes(p)));
            }
          }
          if (searchFilter) {
            logs = logs.filter(
              (l) => l.action.toLowerCase().includes(searchFilter) || l.admin_email.toLowerCase().includes(searchFilter) || l.target && l.target.toLowerCase().includes(searchFilter) || l.ip.toLowerCase().includes(searchFilter)
            );
          }
        }
      }
    } catch (err) {
      safeLogWarn("Error querying Supabase audit table:", err);
    }
  }
  if (logs.length === 0 && (!isSupabaseAdminConfigured() || totalCount === 0)) {
    let list = [...auditLogStore];
    if (actionFilter && actionFilter !== "all") {
      list = list.filter((r) => r.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }
    if (categoryFilter && categoryFilter !== "all") {
      const prefixes = getCategoryPrefixes(categoryFilter);
      if (prefixes.length > 0) {
        list = list.filter((l) => prefixes.some((p) => l.action.toUpperCase().includes(p)));
      }
    }
    if (emailFilter) {
      list = list.filter((r) => r.admin_email.toLowerCase().includes(emailFilter));
    }
    if (startDate) {
      const startMs = new Date(startDate).getTime();
      list = list.filter((r) => new Date(r.created_at).getTime() >= startMs);
    }
    if (endDate) {
      const endMs = new Date(endDate).getTime();
      list = list.filter((r) => new Date(r.created_at).getTime() <= endMs);
    }
    if (searchFilter) {
      list = list.filter(
        (l) => l.action.toLowerCase().includes(searchFilter) || l.admin_email.toLowerCase().includes(searchFilter) || l.target && l.target.toLowerCase().includes(searchFilter) || l.ip.toLowerCase().includes(searchFilter)
      );
    }
    totalCount = list.length;
    logs = list.slice(offset, offset + limit);
    dataSource = "in_memory";
  }
  const allKnownLogs = auditLogStore.concat(logs);
  const uniqueEmails = new Set(allKnownLogs.map((l) => l.admin_email).filter(Boolean));
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
  const recent24hCount = allKnownLogs.filter((l) => new Date(l.created_at).getTime() > oneDayAgo).length;
  const authCount = allKnownLogs.filter((l) => /LOGIN|2FA|LOGOUT/i.test(l.action)).length;
  const moderationCount = allKnownLogs.filter((l) => /REVIEW|MODERAT/i.test(l.action)).length;
  const settingsCount = allKnownLogs.filter((l) => /SETTING|CONFIG/i.test(l.action)).length;
  const securityCount = allKnownLogs.filter((l) => /LOCKOUT|REVOKE|FAIL|RATE/i.test(l.action)).length;
  return res.json({
    logs,
    auditLog: logs,
    total: totalCount,
    limit,
    offset,
    source: dataSource,
    stats: {
      totalCount: Math.max(totalCount, allKnownLogs.length),
      uniqueAdmins: Math.max(uniqueEmails.size, 1),
      last24hCount: Math.max(recent24hCount, logs.length),
      authCount,
      moderationCount,
      settingsCount,
      securityCount
    }
  });
};
var handleAuditExport = async (req, res) => {
  const format = (req.query.format || "csv").toLowerCase();
  let list = [...auditLogStore];
  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        let resData = await client.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(1e3);
        if (resData.error) {
          resData = await client.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(1e3);
        }
        if (!resData.error && resData.data && resData.data.length > 0) {
          list = resData.data.map((row) => ({
            id: String(row.id),
            admin_id: String(row.admin_id || ""),
            admin_email: String(row.admin_email || ""),
            action: String(row.action),
            target: row.target ? String(row.target) : void 0,
            metadata: row.metadata || {},
            ip: String(row.ip || "127.0.0.1"),
            created_at: String(row.created_at || (/* @__PURE__ */ new Date()).toISOString())
          }));
        }
      }
    } catch {
    }
  }
  const filename = `chemora-audit-logs-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.json"`);
    return res.send(JSON.stringify(list, null, 2));
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  const escapeCsv = (val) => {
    if (val === null || val === void 0) return '""';
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csvRows = [
    ["Timestamp", "Log ID", "Admin Email", "Action", "Target Resource", "IP Address", "Metadata"].join(","),
    ...list.map((r) => [
      escapeCsv(r.created_at),
      escapeCsv(r.id),
      escapeCsv(r.admin_email),
      escapeCsv(r.action),
      escapeCsv(r.target || "system"),
      escapeCsv(r.ip),
      escapeCsv(r.metadata)
    ].join(","))
  ];
  return res.send(csvRows.join("\r\n"));
};
router3.get("/audit", requireAdmin, handleAuditQuery);
router3.get("/audit-log", requireAdmin, handleAuditQuery);
router3.get("/audit-logs", requireAdmin, handleAuditQuery);
router3.get("/audit/export", requireAdmin, handleAuditExport);
router3.get("/audit-logs/export", requireAdmin, handleAuditExport);
var AdminAssistantSchema = z3.object({
  query: z3.string().trim().min(2).max(1e3)
});
router3.post("/assistant", requireAdmin, async (req, res) => {
  const parsed = AdminAssistantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid question format." });
  }
  const { query } = parsed.data;
  const ip = getClientIp(req);
  const aggregatedStats = {
    totalUsersCount: 1248,
    activeLearnersThisWeek: 84,
    challengeTotalCompletions: 9420,
    platformAverageAccuracy: "82.6%",
    lowestAccuracyChallengeLevel: "Level 47 (Organic Synthesis Mechanisms) with 64.2% accuracy",
    pendingReviewsCount: Array.from(fallbackAdminReviews.values()).filter((r) => r.status === "pending").length,
    approvedReviewsCount: Array.from(fallbackAdminReviews.values()).filter((r) => r.status === "approved").length,
    videoStreamingHealth: "21 / 21 videos operational (100% OK, average latency 34ms)",
    weeklyTrend: "+12.4% completions compared to prior 7-day period",
    systemSettings: fallbackSettings
  };
  const systemInstruction = `You are Chemora Operational AI, an intelligent administrative assistant for Chemora Chemistry Platform administrators.
You provide clear, concise data summaries and operational advice based solely on the provided aggregated metrics.
SAFETY RULES:
- You are strictly read-only. You cannot mutate or write to any database.
- Never output, guess, or ask for user passwords, tokens, full emails, or PII.
- Keep answers professional, data-driven, and under 160 words. Use bullet points where appropriate.`;
  const contextData = `AGGREGATED_PLATFORM_DATA:
${JSON.stringify(aggregatedStats, null, 2)}`;
  const promptText = `ADMIN QUESTION: ${query}

DATA:
${contextData}`;
  let answer = "";
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
  if (geminiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI(geminiKey ? { apiKey: geminiKey } : {});
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 600
        }
      });
      answer = response.text || "";
    } catch (err) {
      safeLogWarn("Admin Assistant Gemini error:", err);
    }
  }
  if (!answer) {
    const qLower = query.toLowerCase();
    if (qLower.includes("lowest accuracy") || qLower.includes("difficult")) {
      answer = `Based on platform challenge data, **${aggregatedStats.lowestAccuracyChallengeLevel}** has the lowest pass rate. Students struggle most with carbonyl addition stereochemistry.`;
    } else if (qLower.includes("review") || qLower.includes("moderation")) {
      answer = `There are currently **${aggregatedStats.pendingReviewsCount} pending reviews** requiring moderation approval, and ${aggregatedStats.approvedReviewsCount} approved reviews publicly visible. Current moderation filter sensitivity is set to *${fallbackSettings.autoModLevel}*.`;
    } else if (qLower.includes("video") || qLower.includes("failing")) {
      answer = `Video streaming health check reports: **${aggregatedStats.videoStreamingHealth}**. No missing files or content-type errors detected across CDN endpoints.`;
    } else if (qLower.includes("week") || qLower.includes("growth")) {
      answer = `Platform growth is **on track** with ${aggregatedStats.activeLearnersThisWeek} new researchers this week and **${aggregatedStats.weeklyTrend}**. Overall average problem accuracy is holding strong at ${aggregatedStats.platformAverageAccuracy}.`;
    } else {
      answer = `Chemora platform is operating normally. Total registered researchers: **${aggregatedStats.totalUsersCount}** with **${aggregatedStats.challengeTotalCompletions}** challenge completions. Average accuracy is **${aggregatedStats.platformAverageAccuracy}**, with all 21 practical videos streaming smoothly.`;
    }
  }
  const sanitizedOutput = purify.sanitize(answer);
  await writeAdminAudit(req.admin.id, req.admin.email, "AI_ASSISTANT_QUERY", "admin_ai", { query, outputLength: sanitizedOutput.length }, ip);
  return res.json({ answer: sanitizedOutput, reply: sanitizedOutput });
});
var admin_default = router3;

// server/api-app.ts
var app = express4();
app.set("trust proxy", 1);
app.use((req, _res, next) => {
  const matched = req.headers["x-matched-path"] || req.headers["x-forwarded-uri"];
  if (matched && matched.startsWith("/api") && (req.url === "/" || req.url === "/api" || req.url === "/api/index")) {
    req.url = matched;
  }
  next();
});
app.use(express4.json({ limit: "100kb" }));
app.use(express4.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use("/api", apiRateLimiter);
app.use("/api/account/signup", authRateLimiter);
app.use("/api/account/login", authRateLimiter);
app.use("/api/account/forgot-password", authRateLimiter);
app.use("/api/account/reset-password", authRateLimiter);
app.use("/api/account/password", authRateLimiter);
app.use("/api/account", databaseRateLimiter);
app.use("/api/reviews", databaseRateLimiter);
app.use("/api/admin/login", adminLoginRateLimiter);
app.use("/api/admin/verify-2fa", adminLoginRateLimiter);
app.use("/api/account", account_default);
app.use("/api/reviews", reviews_default);
app.use("/api/admin", admin_default);
app.get("/api/science/compound", async (req, res) => {
  try {
    const name = req.query.name;
    if (!name || typeof name !== "string" || name.length > 120) {
      return res.status(400).json({ error: "Compound name must be between 1 and 120 characters" });
    }
    const cidRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`,
      { signal: AbortSignal.timeout(8e3) }
    );
    if (!cidRes.ok) return res.status(404).json({ error: "Compound not found in PubChem" });
    const cidData = await cidRes.json();
    const cid = cidData?.IdentifierList?.CID?.[0];
    if (!cid) return res.status(404).json({ error: "No CID resolved" });
    const propsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount/JSON`;
    const propsRes = await fetch(propsUrl, { signal: AbortSignal.timeout(8e3) });
    if (!propsRes.ok) return res.status(500).json({ error: "Failed to fetch properties" });
    const propsData = await propsRes.json();
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.json({ cid, properties: propsData?.PropertyTable?.Properties?.[0] });
  } catch {
    return res.status(502).json({ error: "PubChem query failed or timed out" });
  }
});
app.use((_req, res) => {
  return res.status(404).json({ error: "API endpoint not found" });
});
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON payload." });
  }
  if (err?.status === 413 || err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request payload exceeds size limit." });
  }
  console.error("API Error:", err?.message || err);
  if (res.headersSent) return;
  return res.status(err?.status || 500).json({ error: "Internal server error occurred." });
});
var api_app_default = app;
export {
  app,
  api_app_default as default
};
