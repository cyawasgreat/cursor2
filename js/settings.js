const save = () => saveSettings();

function syncUI() {
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
        save();
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
      if (el) el.onchange = e => { settings[item.key] = e.target.value; save(); syncUI(); };
    } else if (item.type === "input") {
      const el = document.getElementById(item.id);
      if (el) el.oninput = e => { settings[item.key] = e.target.value; save(); syncUI(); };
    } else if (item.type === "radio") {
      item.ids.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.onclick = () => { settings[item.key] = item.values[idx]; save(); syncUI(); };
      });
    }
  });
  const presetSel = document.getElementById("panicKeyPreset");
  if (presetSel) {
    presetSel.onchange = e => { settings.panicKey = e.target.value; save(); syncUI(); };
  }
  const cloakerSel = document.getElementById("cloakerPreset");
  if (cloakerSel) {
    cloakerSel.onchange = e => { settings.cloakerPreset = e.target.value; save(); syncUI(); };
  }
}

syncUI();
attachListeners();

window.addEventListener("keydown", (e) => {
  if (settings.antiTeacher && e.key.toUpperCase() === settings.panicKey.toUpperCase()) {
    settings.hideElements = !settings.hideElements;
    save();
    syncUI();
  }
});
