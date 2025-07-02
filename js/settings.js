const defaults = {
  openMode: "about:blank",
  alwaysOpenBlank: false,
  alwaysOpenBlob: false,
  panicKeyType: "preset",
  panicKey: "A",
  presetKeys: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
  cloakerType: "preset",
  presetSites: [
    { name: "Google", url: "https://google.com", icon: "https://google.com/favicon.ico" },
    { name: "Canvas", url: "https://canvas.instructure.com", icon: "https://canvas.instructure.com/favicon.ico" },
    { name: "Schoology", url: "https://schoology.com", icon: "https://schoology.com/favicon.ico" },
  ],
  cloakerPreset: JSON.stringify({ name: "Google", url: "https://google.com", icon: "https://google.com/favicon.ico" }),
  cloakerCustomUrl: "",
  cloakerCustomTitle: "",
  cloakerCustomIcon: "",
  antiTeacher: false,
  hideElements: false,
  enableBlur: false,
  enableSoundAlert: false,
  enableAutoHide: false,
};

const getDefaults = () => {
  const settings = localStorage.getItem("carbonSettings");
  if (!settings) return { ...defaults };
  try {
    return { ...defaults, ...JSON.parse(settings) };
  } catch {
    return { ...defaults };
  }
};

const save = (s) => localStorage.setItem("carbonSettings", JSON.stringify(s));
let settings = getDefaults();

const settingsItems = [
  { key: "openMode", type: "radio", ids: ["openModeBlankBtn", "openModeBlobBtn"], values: ["about:blank", "blob"] },
  { key: "alwaysOpenBlank", type: "switch", id: "alwaysOpenBlank", bgId: "alwaysOpenBlankBg", knobId: "alwaysOpenBlankKnob", color: "bg-cyan-500",
    actions: [
      { time: "pageLoad", fn: () => { console.log("alwaysOpenBlank enabled on load"); } },
      { time: "change", fn: () => { console.log("alwaysOpenBlank toggled"); } }
    ]
  },
  { key: "alwaysOpenBlob", type: "switch", id: "alwaysOpenBlob", bgId: "alwaysOpenBlobBg", knobId: "alwaysOpenBlobKnob", color: "bg-cyan-500" },
  { key: "panicKeyType", type: "select", id: "panicKeyType" },
  { key: "panicKey", type: "input", id: "panicKeyCustom" },
  { key: "cloakerType", type: "select", id: "cloakerType" },
  { key: "cloakerCustomUrl", type: "input", id: "cloakerCustomUrl" },
  { key: "cloakerCustomTitle", type: "input", id: "cloakerCustomTitle" },
  { key: "cloakerCustomIcon", type: "input", id: "cloakerCustomIcon" },
  { key: "antiTeacher", type: "switch", id: "antiTeacher", bgId: "antiTeacherBg", knobId: "antiTeacherKnob", color: "bg-orange-500" },
  { key: "enableBlur", type: "switch", id: "enableBlur", bgId: "enableBlurBg", knobId: "enableBlurKnob", color: "bg-green-500" },
  { key: "enableSoundAlert", type: "switch", id: "enableSoundAlert", bgId: "enableSoundAlertBg", knobId: "enableSoundAlertKnob", color: "bg-green-500" },
  { key: "enableAutoHide", type: "switch", id: "enableAutoHide", bgId: "enableAutoHideBg", knobId: "enableAutoHideKnob", color: "bg-green-500" },
];

function runActions(time) {
  settingsItems.forEach(item => {
    if (item.actions && Array.isArray(item.actions)) {
      item.actions.forEach(action => {
        if (action.time === time && settings[item.key]) {
          action.fn();
        }
      });
    }
  });
}

function syncUI() {
  // Panic key preset dropdown
  const presetSel = document.getElementById("panicKeyPreset");
  if (presetSel) {
    presetSel.innerHTML = "";
    settings.presetKeys.forEach(k => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      if (settings.panicKey === k && settings.panicKeyType === "preset") opt.selected = true;
      presetSel.appendChild(opt);
    });
  }
  // Cloaker preset dropdown
  const cloakerSel = document.getElementById("cloakerPreset");
  if (cloakerSel) {
    cloakerSel.innerHTML = "";
    settings.presetSites.forEach(site => {
      const opt = document.createElement("option");
      opt.value = JSON.stringify(site);
      opt.textContent = site.name;
      if (settings.cloakerPreset === JSON.stringify(site)) opt.selected = true;
      cloakerSel.appendChild(opt);
    });
  }
  settingsItems.forEach(item => {
    if (item.type === "switch") {
      const el = document.getElementById(item.id);
      if (el) el.checked = settings[item.key];
      if (item.bgId && item.knobId) {
        const bg = document.getElementById(item.bgId);
        const knob = document.getElementById(item.knobId);
        if (bg) bg.className = `w-12 h-7 rounded-full ${settings[item.key] ? item.color : "bg-white/20"}`;
        if (knob) knob.style.transform = settings[item.key] ? "translateX(20px)" : "";
      }
    } else if (item.type === "select") {
      const el = document.getElementById(item.id);
      if (el) el.value = settings[item.key];
    } else if (item.type === "input") {
      const el = document.getElementById(item.id);
      if (el) el.value = settings[item.key];
    } else if (item.type === "radio") {
      item.ids.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("active", settings[item.key] === item.values[idx]);
      });
    }
  });
}

function attachListeners() {
  settingsItems.forEach(item => {
    if (item.type === "switch") {
      const el = document.getElementById(item.id);
      if (el) el.onchange = e => {
        settings[item.key] = e.target.checked;
        save(settings);
        syncUI();
        if (item.actions && Array.isArray(item.actions)) {
          item.actions.forEach(action => {
            if (action.time === "change" && settings[item.key]) {
              action.fn();
            }
          });
        }
      };
    } else if (item.type === "select") {
      const el = document.getElementById(item.id);
      if (el) el.onchange = e => { settings[item.key] = e.target.value; save(settings); syncUI(); };
    } else if (item.type === "input") {
      const el = document.getElementById(item.id);
      if (el) el.oninput = e => { settings[item.key] = e.target.value; save(settings); syncUI(); };
    } else if (item.type === "radio") {
      item.ids.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.onclick = () => { settings[item.key] = item.values[idx]; save(settings); syncUI(); };
      });
    }
  });
  // Panic key preset change
  const presetSel = document.getElementById("panicKeyPreset");
  if (presetSel) {
    presetSel.onchange = e => { settings.panicKey = e.target.value; save(settings); syncUI(); };
  }
  // Cloaker preset change
  const cloakerSel = document.getElementById("cloakerPreset");
  if (cloakerSel) {
    cloakerSel.onchange = e => { settings.cloakerPreset = e.target.value; save(settings); syncUI(); };
  }
}

syncUI();
attachListeners();
runActions("pageLoad");

window.addEventListener("keydown", (e) => {
  if (settings.antiTeacher && e.key.toUpperCase() === settings.panicKey.toUpperCase()) {
    settings.hideElements = !settings.hideElements;
    save(settings);
    syncUI();
  }
});
