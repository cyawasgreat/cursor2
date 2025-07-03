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

let settings = getDefaults();

const settingsItems = [
  { key: "openMode", type: "radio", ids: ["openModeBlankBtn", "openModeBlobBtn"], values: ["about:blank", "blob"] },
  { key: "alwaysOpenBlank", type: "switch", id: "alwaysOpenBlank", bgId: "alwaysOpenBlankBg", knobId: "alwaysOpenBlankKnob", color: "bg-cyan-500",
    actions: [
      { time: "pageLoad", pages: ["settings.html"], fn: () => { console.log("alwaysOpenBlank enabled on settings page load"); } },
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

function runActions(time, page) {
  const currentPage = page || window.location.pathname.split("/").pop();
  settingsItems.forEach(item => {
    if (item.actions && Array.isArray(item.actions)) {
      item.actions.forEach(action => {
        if (action.time === time && settings[item.key]) {
          if (!action.pages || action.pages.includes(currentPage)) {
            action.fn();
          }
        }
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  runActions("pageLoad");

  const alwaysOpenBlankSwitch = document.getElementById("alwaysOpenBlank");
  if (alwaysOpenBlankSwitch) {
    alwaysOpenBlankSwitch.addEventListener("change", () => {
      settings.alwaysOpenBlank = alwaysOpenBlankSwitch.checked;
      runActions("change");
    });
  }
});
