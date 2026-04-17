import { create } from "zustand";

const API = "http://localhost:3001/api";

function applyTheme(theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}

export const useStore = create((set, get) => ({
  // settings
  openrouterKeys: ["","","","",""],
  openrouterModels: [],
  groqKeys: ["","","","",""],
  groqModels: [],
  activeProvider: "openrouter",
  activeModel: "",
  theme: "dark",
  settingsLoaded: false,

  // projects
  projects: [],
  activeProjectId: null,
  projectDir: "",

  // chats
  chats: [],
  activeChatId: null,
  isThinking: false,
  lastKeyUsed: null,
  lastProvider: null,

  // files
  fileTree: null,
  selectedFile: null,
  selectedFileContent: "",
  fileModified: false,

  // ui
  activeNav: "chat",
  panelOpen: true,

  // ── nav ──────────────────────────────────────────────────────
  setActiveNav: (nav) => {
    const { activeNav, panelOpen } = get();
    const hasPanel = nav === "chat" || nav === "files" || nav === "search";
    if (!hasPanel) { set({ activeNav: nav, panelOpen: false }); return; }
    if (nav === activeNav) { set({ panelOpen: !panelOpen }); }
    else { set({ activeNav: nav, panelOpen: true }); }
  },

  // ── load all settings ────────────────────────────────────────
  loadSettings: async () => {
    try {
      const res = await fetch(`${API}/settings/raw`);
      const d = await res.json();
      const theme = d.theme || "dark";
      applyTheme(theme);
      set({
        openrouterKeys:   d.openrouterKeys   || ["","","","",""],
        openrouterModels: d.openrouterModels  || [],
        groqKeys:         d.groqKeys         || ["","","","",""],
        groqModels:       d.groqModels       || [],
        activeProvider:   d.activeProvider   || "openrouter",
        activeModel:      d.activeModel      || "",
        theme,
        projects:         d.projects         || [],
        activeProjectId:  d.activeProjectId  || null,
        projectDir:       d.projectDir       || "",
        chats:            d.chats            || [],
        activeChatId:     d.activeChatId     || null,
        settingsLoaded: true,
      });
    } catch(e) { console.error(e); }
  },

  // ── keys ─────────────────────────────────────────────────────
  saveOpenrouterKeys: async (keys) => {
    await fetch(`${API}/settings/openrouter-keys`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({keys})});
    set({ openrouterKeys: keys });
  },
  saveGroqKeys: async (keys) => {
    await fetch(`${API}/settings/groq-keys`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({keys})});
    set({ groqKeys: keys });
  },

  // ── models ───────────────────────────────────────────────────
  saveOpenrouterModels: async (models) => {
    const {activeModel,activeProvider} = get();
    await fetch(`${API}/settings/openrouter-models`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({models,activeModel,activeProvider})});
    set({ openrouterModels: models });
  },
  saveGroqModels: async (models) => {
    const {activeModel,activeProvider} = get();
    await fetch(`${API}/settings/groq-models`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({models,activeModel,activeProvider})});
    set({ groqModels: models });
  },
  setActiveModel: async (provider, model) => {
    await fetch(`${API}/settings/active`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({activeProvider:provider,activeModel:model})});
    set({ activeProvider: provider, activeModel: model });
  },

  // ── theme ────────────────────────────────────────────────────
  setTheme: async (theme) => {
    applyTheme(theme);
    set({ theme });
    await fetch(`${API}/settings/theme`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({theme})});
  },

  testApiKey: async (apiKey, provider) => {
    const res = await fetch(`${API}/settings/test-key`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiKey,provider})});
    return res.json();
  },

  // ── projects ─────────────────────────────────────────────────
  _saveProjects: async (projects, activeProjectId, projectDir) => {
    await fetch(`${API}/settings/projects`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({projects,activeProjectId,projectDir})});
  },
  addProject: async (name, path) => {
    const p = { id: Date.now().toString(), name, path };
    const projects = [...get().projects, p];
    const { activeProjectId, projectDir } = get();
    await get()._saveProjects(projects, activeProjectId, projectDir);
    set({ projects });
  },
  deleteProject: async (id) => {
    const projects = get().projects.filter(p => p.id !== id);
    const wasActive = get().activeProjectId === id;
    const newActive = wasActive ? (projects[0]?.id || null) : get().activeProjectId;
    const newDir = wasActive ? (projects[0]?.path || "") : get().projectDir;
    await get()._saveProjects(projects, newActive, newDir);
    set({ projects, activeProjectId: newActive, projectDir: newDir });
    if (wasActive) get().loadFileTree();
  },
  selectProject: async (id) => {
    const p = get().projects.find(x => x.id === id);
    if (!p) return;
    await get()._saveProjects(get().projects, id, p.path);
    set({ activeProjectId: id, projectDir: p.path });
    get().loadFileTree();
  },

  // ── chats ────────────────────────────────────────────────────
  _saveChats: async (chats, activeChatId) => {
    await fetch(`${API}/settings/chats`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({chats,activeChatId})});
  },
  newChat: () => {
    const chat = { id: Date.now().toString(), title: "New chat", messages: [], createdAt: Date.now() };
    const chats = [chat, ...get().chats];
    set({ chats, activeChatId: chat.id });
    get()._saveChats(chats, chat.id);
    return chat.id;
  },
  selectChat: (id) => set({ activeChatId: id }),
  deleteChat: async (id) => {
    const chats = get().chats.filter(c => c.id !== id);
    const newActive = get().activeChatId === id ? (chats[0]?.id || null) : get().activeChatId;
    set({ chats, activeChatId: newActive });
    get()._saveChats(chats, newActive);
  },
  getActiveMessages: () => {
    const { chats, activeChatId } = get();
    return chats.find(c => c.id === activeChatId)?.messages || [];
  },

  // ── send message ─────────────────────────────────────────────
  sendMessage: async (userMessage) => {
    if (!userMessage.trim() || get().isThinking) return;
    let { activeChatId, chats } = get();

    if (!activeChatId) {
      const chat = { id: Date.now().toString(), title: userMessage.slice(0, 40), messages: [], createdAt: Date.now() };
      chats = [chat, ...chats];
      activeChatId = chat.id;
      set({ chats, activeChatId });
    }

    const userMsg = { role: "user", content: userMessage, id: Date.now().toString() };
    const updatedChats = chats.map(c =>
      c.id === activeChatId
        ? { ...c, title: c.messages.length === 0 ? userMessage.slice(0, 40) : c.title, messages: [...c.messages, userMsg] }
        : c
    );
    set({ chats: updatedChats, isThinking: true });

    try {
      const history = updatedChats.find(c => c.id === activeChatId)?.messages || [];
      const res = await fetch(`${API}/agent/chat`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages:[userMsg], conversationHistory: history.slice(0,-1) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent error");

      const msgActions  = (data.actions||[]).filter(a => a.type==="message");
      const fileActions = (data.actions||[]).filter(a => a.type!=="message");
      const aiMsg = {
        role: "assistant", id: Date.now().toString(),
        content: msgActions.map(a=>a.content).join("\n\n") || data.thought || "Done.",
        actions: fileActions, thought: data.thought,
        model: data.model, usage: data.usage, provider: data.provider,
      };
      const finalChats = get().chats.map(c =>
        c.id === activeChatId ? { ...c, messages: [...c.messages, aiMsg] } : c
      );
      set({ chats: finalChats, isThinking: false, lastKeyUsed: data.keyUsed, lastProvider: data.provider });
      get()._saveChats(finalChats, activeChatId);
      if (fileActions.length > 0) get().loadFileTree();
    } catch(e) {
      const errMsg = { role:"assistant", id:Date.now().toString(), content:`**Error:** ${e.message}`, isError:true };
      const finalChats = get().chats.map(c =>
        c.id === activeChatId ? { ...c, messages: [...c.messages, errMsg] } : c
      );
      set({ chats: finalChats, isThinking: false });
      get()._saveChats(finalChats, activeChatId);
    }
  },

  // ── files ────────────────────────────────────────────────────
  loadFileTree: async () => {
    try {
      const res = await fetch(`${API}/files/tree`);
      const d = await res.json();
      set({ fileTree: d.tree || null });
    } catch {}
  },
  openFile: async (filePath) => {
    try {
      const res = await fetch(`${API}/files/read?filePath=${encodeURIComponent(filePath)}`);
      const d = await res.json();
      set({ selectedFile: filePath, selectedFileContent: d.content || "", fileModified: false });
    } catch {}
  },
  setFileContent: (content) => set({ selectedFileContent: content, fileModified: true }),
  saveFile: async () => {
    const { selectedFile, selectedFileContent } = get();
    if (!selectedFile) return;
    await fetch(`${API}/files/create`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filePath:selectedFile,content:selectedFileContent})});
    set({ fileModified: false });
  },
  createFile: async (filePath, isDir) => {
    const res = await fetch(`${API}/files/create`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filePath,content:"",isDir})});
    const d = await res.json();
    if (d.success) get().loadFileTree();
    return d;
  },
  deleteFile: async (filePath) => {
    const res = await fetch(`${API}/files/delete`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({filePath})});
    const d = await res.json();
    if (d.success) {
      get().loadFileTree();
      if (get().selectedFile === filePath) set({ selectedFile:null, selectedFileContent:"", fileModified:false });
    }
    return d;
  },
}));
