import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PROJECT_ROOT = process.cwd();
const ENTIRE_DIR = join(PROJECT_ROOT, ".entire");
const LOGS_DIR = join(ENTIRE_DIR, "logs");
const METADATA_DIR = join(ENTIRE_DIR, "metadata");
const SETTINGS_FILE = join(ENTIRE_DIR, "settings.json");
const LOG_FILE = join(LOGS_DIR, "entire.log");

describe("Entire CLI - Conversation Storage", () => {
  it("should have the .entire directory in the project root", () => {
    assert.ok(
      existsSync(ENTIRE_DIR),
      ".entire/ directory does not exist — Entire CLI may not be initialized"
    );
  });

  it("should have a valid settings.json", () => {
    assert.ok(
      existsSync(SETTINGS_FILE),
      ".entire/settings.json is missing"
    );

    const settings = JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"));
    assert.ok(
      typeof settings.enabled === "boolean",
      "settings.json should have an 'enabled' field"
    );
    assert.ok(
      typeof settings.strategy === "string",
      "settings.json should have a 'strategy' field"
    );
  });

  it("should have a logs directory", () => {
    assert.ok(
      existsSync(LOGS_DIR),
      ".entire/logs/ directory does not exist"
    );
  });

  it("should have a log file with session entries", () => {
    assert.ok(
      existsSync(LOG_FILE),
      ".entire/logs/entire.log does not exist — no sessions recorded"
    );

    const content = readFileSync(LOG_FILE, "utf-8").trim();
    assert.ok(
      content.length > 0,
      "Log file is empty — no conversations have been stored"
    );
  });

  it("should contain session-start events in the log", () => {
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n");

    const sessionStartEvents = lines.filter((line) => {
      try {
        const entry = JSON.parse(line);
        return entry.msg === "session-start";
      } catch {
        return false;
      }
    });

    assert.ok(
      sessionStartEvents.length > 0,
      "No session-start events found — conversations are not being stored"
    );
  });

  it("should have valid JSON entries in the log file", () => {
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    for (const line of lines) {
      assert.doesNotThrow(
        () => JSON.parse(line),
        `Invalid JSON in log entry: ${line.substring(0, 80)}...`
      );
    }
  });

  it("each session entry should have required fields", () => {
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    for (const line of lines) {
      const entry = JSON.parse(line);
      assert.ok(entry.time, "Log entry missing 'time' field");
      assert.ok(entry.level, "Log entry missing 'level' field");
      assert.ok(entry.msg, "Log entry missing 'msg' field");
      assert.ok(entry.component, "Log entry missing 'component' field");
    }
  });

  it("should have a metadata directory for session data", () => {
    assert.ok(
      existsSync(METADATA_DIR),
      ".entire/metadata/ directory does not exist — session metadata is not stored"
    );
  });

  it("should record conversation lifecycle events (start → prompts → stop)", () => {
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const messages = lines.map((line) => JSON.parse(line).msg);

    assert.ok(
      messages.includes("session-start"),
      "Missing 'session-start' event"
    );
    assert.ok(
      messages.includes("user-prompt-submit"),
      "Missing 'user-prompt-submit' event"
    );
    assert.ok(
      messages.includes("stop"),
      "Missing 'stop' event"
    );
  });

  it("session entries should reference a transcript path", () => {
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    const entriesWithTranscript = lines.filter((line) => {
      const entry = JSON.parse(line);
      return typeof entry.transcript_path === "string";
    });

    assert.ok(
      entriesWithTranscript.length > 0,
      "No log entries reference a transcript_path — conversations may not be fully stored"
    );
  });
});
