const dftS = {
  openMode: "about:blank",
  alwaysOpenBlank: false,
  alwaysOpenBlob: false,
  panicKeyType: "preset",
  panicKey: "A",
  presetKeys: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
  cloakerType: "preset",
  presetSites: [
    {
      name: "Google",
      url: "https://google.com",
      icon: "https://google.com/favicon.ico",
    },
    {
      name: "Canvas",
      url: "https://canvas.instructure.com",
      icon: "https://canvas.instructure.com/favicon.ico",
    },
    {
      name: "Schoology",
      url: "https://schoology.com",
      icon: "https://schoology.com/favicon.ico",
    },
  ],
  cloakerPreset: JSON.stringify({
    name: "Google",
    url: "https://google.com",
    icon: "https://google.com/favicon.ico",
  }),
  cloakerCustomUrl: "",
  cloakerCustomTitle: "",
  cloakerCustomIcon: "",
  antiTeacher: false,
  hideElements: false,
  enableBlur: false,
  enableSoundAlert: false,
  enableAutoHide: false,
};

const ldS = () => {
  const s = localStorage.getItem("carbonSettings");
  if (!s) return { ...defaultSettings };
  try {
    return { ...defaultSettings, ...JSON.parse(s) };
  } catch {
    return { ...defaultSettings };
  }
};

const saveSettings = (s) =>
  localStorage.setItem("carbonSettings", JSON.stringify(s));

let s = ldS();

const syncUI = () => {
  const setBtnState = (id, active) => {
    const btn = document.getElementById(id);
    btn.classList.toggle("bg-gradient-to-r", active);
    btn.classList.toggle("from-cyan-500", active);
    btn.classList.toggle("to-indigo-500", active);
    btn.classList.toggle("text-white", active);
    btn.classList.toggle("shadow-lg", active);
    btn.classList.toggle("glow-effect", active);
  };
  setBtnState("openModeBlankBtn", settings.openMode === "about:blank");
  setBtnState("openModeBlobBtn", settings.openMode === "blob");

  const setSwitch = (id, bgId, knobId, val, color) => {
    document.getElementById(id).checked = val;
    document.getElementById(bgId).className =
      `w-12 h-7 rounded-full ${val ? color : "bg-white/20"}`;
    document.getElementById(knobId).style.transform = val
      ? "translateX(20px)"
      : "";
  };
  setSwitch(
    "alwaysOpenBlank",
    "alwaysOpenBlankBg",
    "alwaysOpenBlankKnob",
    settings.alwaysOpenBlank,
    "bg-cyan-500",
  );
  setSwitch(
    "alwaysOpenBlob",
    "alwaysOpenBlobBg",
    "alwaysOpenBlobKnob",
    settings.alwaysOpenBlob,
    "bg-cyan-500",
  );

  document.getElementById("panicKeyType").value = settings.panicKeyType;
  document.getElementById("panicKeyPreset").style.display =
    settings.panicKeyType === "preset" ? "" : "none";
  document.getElementById("panicKeyCustom").style.display =
    settings.panicKeyType === "custom" ? "" : "none";
  const presetSel = document.getElementById("panicKeyPreset");
  presetSel.innerHTML = "";
  for (const k of settings.presetKeys) {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    if (settings.panicKey === k && settings.panicKeyType === "preset")
      opt.selected = true;
    presetSel.appendChild(opt);
  }
  if (settings.panicKeyType === "custom")
    document.getElementById("panicKeyCustom").value = settings.panicKey;
  document.getElementById("panicKeyDisplay").textContent = settings.panicKey;
  document.getElementById("panicKeyDisplay2").textContent = settings.panicKey;

  document.getElementById("cloakerType").value = settings.cloakerType;
  document.getElementById("cloakerPreset").style.display =
    settings.cloakerType === "preset" ? "" : "none";
  document.getElementById("cloakerCustomFields").style.display =
    settings.cloakerType === "custom" ? "" : "none";
  const cloakerSel = document.getElementById("cloakerPreset");
  cloakerSel.innerHTML = "";
  for (const site of settings.presetSites) {
    const opt = document.createElement("option");
    opt.value = JSON.stringify(site);
    opt.textContent = site.name;
    if (settings.cloakerPreset === JSON.stringify(site)) opt.selected = true;
    cloakerSel.appendChild(opt);
  }
  document.getElementById("cloakerCustomUrl").value = settings.cloakerCustomUrl;
  document.getElementById("cloakerCustomTitle").value =
    settings.cloakerCustomTitle;
  document.getElementById("cloakerCustomIcon").value =
    settings.cloakerCustomIcon;

  setSwitch(
    "antiTeacher",
    "antiTeacherBg",
    "antiTeacherKnob",
    settings.antiTeacher,
    "bg-orange-500",
  );
  document.getElementById("antiTeacherActive").style.display =
    settings.antiTeacher ? "" : "none";

  setSwitch(
    "enableBlur",
    "enableBlurBg",
    "enableBlurKnob",
    settings.enableBlur,
    "bg-green-500",
  );
  setSwitch(
    "enableSoundAlert",
    "enableSoundAlertBg",
    "enableSoundAlertKnob",
    settings.enableSoundAlert,
    "bg-green-500",
  );
  setSwitch(
    "enableAutoHide",
    "enableAutoHideBg",
    "enableAutoHideKnob",
    settings.enableAutoHide,
    "bg-green-500",
  );

  document.getElementById("statusOpenMode").textContent = settings.openMode;
  document.getElementById("statusPanicKey").textContent = settings.panicKey;
  document.getElementById("statusCloaker").textContent =
    settings.cloakerType === "preset"
      ? JSON.parse(settings.cloakerPreset).name
      : "Custom";
  document.getElementById("statusAntiTeacher").textContent =
    settings.antiTeacher ? "Enabled" : "Disabled";
  document.getElementById("statusAntiTeacher").className =
    `font-bold ${settings.antiTeacher ? "text-green-400" : "text-red-400"}`;

  document.getElementById("hideElementsOverlay").style.display =
    settings.hideElements ? "" : "none";
  document.getElementById("settingsBody").style.cursor = settings.hideElements
    ? "none"
    : "";
};

const asu = () => {
  syncUi();
  saveSettings(settings);
};

const aeh = () => {
  document.getElementById("openModeBlankBtn").onclick = () => {
    settings.openMode = "about:blank";
    autoSaveAndSync();
  };
  document.getElementById("openModeBlobBtn").onclick = () => {
    settings.openMode = "blob";
    autoSaveAndSync();
  };
  document.getElementById("alwaysOpenBlank").onchange = (e) => {
    settings.alwaysOpenBlank = e.target.checked;
    autoSaveAndSync();
  };
  document.getElementById("alwaysOpenBlob").onchange = (e) => {
    settings.alwaysOpenBlob = e.target.checked;
    autoSaveAndSync();
  };
  document.getElementById("testOpenModeBtn").onclick = () => {
    alert(`Testing open mode: ${settings.openMode}`);
  };
  document.getElementById("panicKeyType").onchange = (e) => {
    settings.panicKeyType = e.target.value;
    if (settings.panicKeyType === "preset") settings.panicKey = "A";
    autoSaveAndSync();
  };
  document.getElementById("panicKeyPreset").onchange = (e) => {
    settings.panicKey = e.target.value;
    autoSaveAndSync();
  };
  document.getElementById("panicKeyCustom").oninput = (e) => {
    settings.panicKey = e.target.value.toUpperCase().slice(0, 1);
    autoSaveAndSync();
  };
  document.getElementById("testPanicKeyBtn").onclick = () => {
    alert(`Panic key is set to: ${settings.panicKey}`);
  };
  document.getElementById("cloakerType").onchange = (e) => {
    settings.cloakerType = e.target.value;
    autoSaveAndSync();
  };
  document.getElementById("cloakerPreset").onchange = (e) => {
    settings.cloakerPreset = e.target.value;
    autoSaveAndSync();
  };
  document.getElementById("cloakerCustomUrl").oninput = (e) => {
    settings.cloakerCustomUrl = e.target.value;
    autoSaveAndSync();
  };
  document.getElementById("cloakerCustomTitle").oninput = (e) => {
    settings.cloakerCustomTitle = e.target.value;
    autoSaveAndSync();
  };
  document.getElementById("cloakerCustomIcon").oninput = (e) => {
    settings.cloakerCustomIcon = e.target.value;
    autoSaveAndSync();
  };
  document.getElementById("applyCloakerBtn").onclick = () => {
    alert("Applying tab cloaker...");
  };
  document.getElementById("removeCloakerBtn").onclick = () => {
    alert("Removing tab cloaker...");
  };
  document.getElementById("antiTeacher").onchange = (e) => {
    settings.antiTeacher = e.target.checked;
    autoSaveAndSync();
  };
  document.getElementById("enableBlur").onchange = (e) => {
    settings.enableBlur = e.target.checked;
    autoSaveAndSync();
  };
  document.getElementById("enableSoundAlert").onchange = (e) => {
    settings.enableSoundAlert = e.target.checked;
    autoSaveAndSync();
  };
  document.getElementById("enableAutoHide").onchange = (e) => {
    settings.enableAutoHide = e.target.checked;
    autoSaveAndSync();
  };
  document.getElementById("saveSettingsBtn").onclick = () => {
    saveSettings(settings);
    document.getElementById("saveStatus").style.display = "";
    document.getElementById("saveStatusText").textContent =
      "Settings saved successfully!";
    setTimeout(() => {
      document.getElementById("saveStatus").style.display = "none";
      document.getElementById("saveStatusText").textContent = "";
    }, 3000);
  };
  window.addEventListener("keydown", (e) => {
    if (
      settings.antiTeacher &&
      e.key.toUpperCase() === settings.panicKey.toUpperCase()
    ) {
      settings.hideElements = !settings.hideElements;
      autoSaveAndSync();
    }
  });
};

syncUi();
attachEventHandlers();
