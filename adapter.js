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
