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

function loadSettings() {
  let s = {};

  for (const key in defaults) {
    const item = localStorage.getItem(`carbon.${key}`);
    if (item === null) {
      s[key] = defaults[key];
    } else {
      try {
        s[key] = JSON.parse(item);
      } catch {
        s[key] = item;
      }
    }
  }
  return s;
}

let settings = loadSettings();

function saveSettings() {
  for (const key in settings) {
    if (key in defaults) {
      localStorage.setItem(`carbon.${key}`, JSON.stringify(settings[key]));
    }
  }
}

const settingsItems = [
  { key: "openMode", type: "radio", ids: ["openModeBlankBtn", "openModeBlobBtn"], values: ["about:blank", "blob"] },
  { key: "alwaysOpenBlank", type: "switch", id: "alwaysOpenBlank", bgId: "alwaysOpenBlankBg", knobId: "alwaysOpenBlankKnob", color: "bg-cyan-500",
    actions: [
      { time: "pageLoad", fn: () => {
let inFrame;

try {
  inFrame = window !== top;
} catch (e) {
  inFrame = true;
}
if (!localStorage.getItem("ab")) localStorage.setItem("ab", true);
if (
  !inFrame &&
  !navigator.userAgent.includes("Firefox") &&
  localStorage.getItem("ab") === "true"
) {
  const popup = open("about:blank", "_blank");
  if (!popup || popup.closed) {
    alert(
      "Please allow popups for this site. Doing so will allow us to open the site in a about:blank tab and preventing this site from showing up in your history. You can turn this off in the site settings.",
    );
  } else {
    const doc = popup.document;
    const iframe = doc.createElement("iframe");
    const style = iframe.style;
    const link = doc.createElement("link");

    const name = localStorage.getItem("name") || "My Drive - Google Drive";
    const icon =
      localStorage.getItem("icon") ||
      "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png";

    doc.title = name;
    link.rel = "icon";
    link.href = icon;

    iframe.src = location.href;
    style.position = "fixed";
    style.top = style.bottom = style.left = style.right = 0;
    style.border = style.outline = "none";
    style.width = style.height = "100%";

    doc.head.appendChild(link);
    doc.body.appendChild(iframe);

    location.replace(localStorage.getItem("carbon.ab-link") || "https://classroom.google.com/h");

    const script = doc.createElement("script");
    script.textContent = `
      window.onbeforeunload = function (event) {
        const confirmationMessage = 'Leave Site?';
        (event || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
      };
    `;
    doc.head.appendChild(script);
  }
}
        } 
      },
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
