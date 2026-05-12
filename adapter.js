/* adapter.js */
let lastIncidentSysId = null;

function log(msg, type = "info") {
  const box = document.getElementById("log");
  const prefix = type === "ok" ? "[OK] " : type === "err" ? "[ERR] " : "[INFO] ";
  box.value += `${prefix}${msg}\n`;
  box.scrollTop = box.scrollHeight;
}

function getBase() {
  const base = document.getElementById("snBase").value.trim().replace(/\/$/, "");
  return base;
}

function basicAuthHeader(user, pass) {
  return "Basic " + btoa(`${user}:${pass}`);
}

function safeParseJson(text) {
  try { return JSON.parse(text); } catch (e) { return null; }
}

/**
 * 1) Initialize OpenFrame
 * ServiceNow: init() must be the first method called. [1](https://developer.cisco.com/docs/finesse/getting-started/)
 */
function initOpenFrame() {
  if (!window.openFrameAPI) {
    log("openFrameAPI is not loaded yet. Check the script src in index.html.", "err");
    return;
  }

  const config = { width: 420, height: 720, title: "Mock Cisco Adapter", subTitle: "No Cisco account test" };
  openFrameAPI.init(
    config,
    function initSuccess(snConfig) {
      log("OpenFrame init succeeded. Configuration received from instance.", "ok");
      // You can subscribe to OpenFrame events if needed (optional). [1](https://developer.cisco.com/docs/finesse/getting-started/)
      openFrameAPI.subscribe(openFrameAPI.EVENTS.COMMUNICATION_EVENT, (ctx) => {
        log("Received openframe communication event: " + JSON.stringify(ctx));
      });
    },
    function initFailure(error) {
      log("OpenFrame init failed: " + JSON.stringify(error), "err");
    }
  );
}

/**
 * Screen pop an incident record using documented openServiceNowForm(). [1](https://developer.cisco.com/docs/finesse/getting-started/)[2](https://community.cisco.com/t5/contact-center/workflow-for-uccx-finesse-api/td-p/4540835)
 */
function screenPopIncident(sysId) {
  if (!window.openFrameAPI) {
    log("openFrameAPI not loaded.", "err");
    return;
  }
  if (!sysId) {
    log("No sys_id available to screen pop.", "err");
    return;
  }

  openFrameAPI.openServiceNowForm({
    entity: "incident",
    query: "sys_id=" + sysId
  });

  log("Requested screen pop for incident sys_id=" + sysId, "ok");
}

/**
 * 2) Create Incident via Table API and then screen pop it.
 * ServiceNow documents the incident create endpoint for Table API v1 as:
 * POST /api/now/v1/table/incident [4](https://www.servicenow.com/docs/r/customer-service-management/t_CreateAnOpenFrameConfiguration.html?contentId=H3mcEQnL9UwoKyCTFamIFQ)
 *
 * NOTE: Because this page is external, you must allow it via CORS rule for Table API. [3](https://www.flamingo.run/openframe)
 */
async function createIncidentAndPop() {
  const base = getBase();
  const user = document.getElementById("snUser").value.trim();
  const pass = document.getElementById("snPass").value;

  if (!base) return log("Enter ServiceNow base URL.", "err");
  if (!user || !pass) return log("Enter integration username/password for Basic Auth test.", "err");

  const payloadText = document.getElementById("payload").value;
  const payload = safeParseJson(payloadText);
  if (!payload) return log("Incident payload is not valid JSON.", "err");

  const url = `${base}/api/now/v1/table/incident`; // Table API v1 incident create [4](https://www.servicenow.com/docs/r/customer-service-management/t_CreateAnOpenFrameConfiguration.html?contentId=H3mcEQnL9UwoKyCTFamIFQ)

  try {
    log("Sending POST to: " + url);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": basicAuthHeader(user, pass)
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}

    if (!res.ok) {
      log(`POST failed. HTTP ${res.status}. Body: ${text}`, "err");
      return;
    }

    // Table API response usually returns result with sys_id (depends on instance settings),
    // and ServiceNow’s REST API Explorer tutorial notes a Location header is returned. [4](https://www.servicenow.com/docs/r/customer-service-management/t_CreateAnOpenFrameConfiguration.html?contentId=H3mcEQnL9UwoKyCTFamIFQ)
    const sysId = data?.result?.sys_id;
    if (!sysId) {
      log("Incident created, but sys_id not found in response body. Check response: " + text, "err");
      return;
    }

    lastIncidentSysId = sysId;
    log("Incident created successfully. sys_id=" + sysId, "ok");
    screenPopIncident(sysId);

  } catch (e) {
    log("Error calling Table API: " + e.message, "err");
  }
}

/**
 * 4) Resize OpenFrame (documented setSize). [1](https://developer.cisco.com/docs/finesse/getting-started/)
 */
function resizeFrame() {
  if (!window.openFrameAPI) return log("openFrameAPI not loaded.", "err");
  openFrameAPI.setSize(420, 720);
  log("Requested OpenFrame resize to 420x720", "ok");
}

document.getElementById("btnInit").addEventListener("click", initOpenFrame);
document.getElementById("btnCreate").addEventListener("click", createIncidentAndPop);
document.getElementById("btnPop").addEventListener("click", () => screenPopIncident(lastIncidentSysId));
document.getElementById("btnResize").addEventListener("click", resizeFrame);