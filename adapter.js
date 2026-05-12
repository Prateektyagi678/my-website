(function () {
  function log(msg) {
    const box = document.getElementById("log");
    box.value += `[${new Date().toISOString()}] ${msg}\n`;
    box.scrollTop = box.scrollHeight;
  }

  function initOpenFrame() {
    const api = window.openFrameAPI;
    if (!api) {
      log("ERROR: openFrameAPI not found. The library may not have loaded.");
      return;
    }

    // init() must be the first method called (ServiceNow documentation). [1](https://developer.cisco.com/docs/finesse/getting-started/)
    const config = { width: 420, height: 720, title: "OF Test", subTitle: "GitHub Adapter" };

    api.init(
      config,
      function initSuccess(snConfig) {
        log("SUCCESS: init completed. Received config from instance.");
        log("Returned config name: " + (snConfig?.name || "(none)"));
      },
      function initFailure(err) {
        log("FAILED: init failed: " + JSON.stringify(err));
      }
    );
  }

  function resizeOpenFrame() {
    const api = window.openFrameAPI;
    if (!api) {
      log("ERROR: openFrameAPI not found.");
      return;
    }
    // setSize is documented. [1](https://developer.cisco.com/docs/finesse/getting-started/)
    api.setSize(420, 720);
    log("Requested size 420x720.");
  }
  async function createIncidentAndPop() {
  const base = "https://dev393388.service-now.com"; // your instance
  const user = document.getElementById("snUser").value.trim();
  const pass = document.getElementById("snPass").value;

  if (!user || !pass) {
    log("ERROR: Provide username/password for test call.");
    return;
  }

  const payload = {
    short_description: "OpenFrame GitHub adapter test",
    description: "Incident created from GitHub Pages adapter via Table API.",
    contact_type: "phone"
  };

  // ServiceNow documented endpoint for creating an incident via Table API v1. [2](https://www.servicenow.com/docs/r/customer-service-management/t_CreateAnOpenFrameConfiguration.html?contentId=H3mcEQnL9UwoKyCTFamIFQ)
  const url = `${base}/api/now/v1/table/incident`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        // If you use Authorization from the browser, the CORS rule must allow it. [3](https://www.flamingo.run/openframe)
        "Authorization": "Basic " + btoa(`${user}:${pass}`)
      },
      body: JSON.stringify(payload)
    });

    const bodyText = await res.text();
    let data = {};
    try { data = JSON.parse(bodyText); } catch {}

    if (!res.ok) {
      log(`ERROR: Incident POST failed HTTP ${res.status}: ${bodyText}`);
      return;
    }

    const sysId = data?.result?.sys_id;
    if (!sysId) {
      log("ERROR: sys_id not found in response: " + bodyText);
      return;
    }

    log("SUCCESS: Incident created sys_id=" + sysId);

    // Screen-pop using documented openServiceNowForm(). [1](https://developer.cisco.com/docs/finesse/getting-started/)[4](https://community.cisco.com/t5/contact-center/workflow-for-uccx-finesse-api/td-p/4540835)
    window.openFrameAPI.openServiceNowForm({
      entity: "incident",
      query: "sys_id=" + sysId
    });

    log("Screen pop requested for sys_id=" + sysId);

  } catch (e) {
    log("ERROR: fetch failed: " + e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnCreateIncident");
  if (btn) btn.addEventListener("click", createIncidentAndPop);
});

  // Attach handlers only after DOM is ready (prevents “button does nothing” issues).
  document.addEventListener("DOMContentLoaded", () => {
    log("Page loaded. openFrameAPI type: " + typeof window.openFrameAPI);

    const btnInit = document.getElementById("btnInit");
    const btnResize = document.getElementById("btnResize");

    btnInit.addEventListener("click", initOpenFrame);
    btnResize.addEventListener("click", resizeOpenFrame);

    log("Handlers attached. Click 'Init OpenFrame'.");
  });
})();
