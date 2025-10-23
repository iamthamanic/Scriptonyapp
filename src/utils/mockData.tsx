// Fallback mock data when API is not available

export const mockProjects = [
  {
    id: "mock-1",
    title: "The Last Frontier",
    logline: "A sci-fi thriller about humanity's final journey to the stars",
    type: "Movie",
    genre: "Sci-fi",
    duration: "90 min",
    createdAt: new Date("2024-01-15").toISOString(),
    lastEdited: new Date("2025-09-28T14:30:00").toISOString(),
    linkedWorldId: "mock-world-1",
  },
  {
    id: "mock-2",
    title: "Midnight in Paris",
    logline: "A romantic comedy set in the streets of Paris",
    type: "Movie",
    genre: "Comedy",
    duration: "105 min",
    createdAt: new Date("2024-02-20").toISOString(),
    lastEdited: new Date("2025-09-29T09:15:00").toISOString(),
    linkedWorldId: undefined,
  },
];

export const mockWorlds = [
  { 
    id: "mock-world-1", 
    name: "Kontinent Silkat",
    description: "A vast continent with diverse landscapes",
    createdAt: new Date("2024-01-10").toISOString(),
    lastEdited: new Date("2025-09-28T14:30:00").toISOString(),
  },
];

export const mockCategories = [
  {
    id: "mock-cat-1",
    worldId: "mock-world-1",
    name: "Geographie",
    icon: "mountain",
    createdAt: new Date("2024-01-11").toISOString(),
  },
  {
    id: "mock-cat-2",
    worldId: "mock-world-1",
    name: "Politik",
    icon: "landmark",
    createdAt: new Date("2024-01-11").toISOString(),
  },
];

export const mockItems = [
  { 
    id: "mock-item-1", 
    worldId: "mock-world-1",
    categoryId: "mock-cat-1",
    name: "Mount Silkar", 
    category: "Geographie", 
    categoryType: "geography",
    description: "The highest mountain in Silkat",
    createdAt: new Date("2024-01-12").toISOString(),
  },
  { 
    id: "mock-item-2", 
    worldId: "mock-world-1",
    categoryId: "mock-cat-1",
    name: "Delta River", 
    category: "Geographie", 
    categoryType: "geography",
    description: "A winding river through the valley",
    createdAt: new Date("2024-01-12").toISOString(),
  },
  { 
    id: "mock-item-3", 
    worldId: "mock-world-1",
    categoryId: "mock-cat-2",
    name: "The Council of Seven", 
    category: "Politik", 
    categoryType: "politics",
    description: "The ruling body of Silkat",
    createdAt: new Date("2024-01-12").toISOString(),
  },
];

export const mockScenes = [
  {
    id: "mock-scene-1",
    projectId: "mock-1",
    title: "Opening Scene",
    description: "The crew prepares for departure",
    location: "Space Station Alpha",
    timeOfDay: "Morning",
    characters: [],
    order: 0,
    createdAt: new Date("2024-01-16").toISOString(),
  },
];

export const mockCharacters = [
  {
    id: "mock-char-1",
    projectId: "mock-1",
    name: "Captain Sarah Chen",
    role: "Protagonist",
    description: "A seasoned space captain leading humanity's final mission",
    age: "42",
    gender: "Female",
    createdAt: new Date("2024-01-16").toISOString(),
  },
];

// In-memory storage for fallback mode
let localProjects = [...mockProjects];
let localWorlds = [...mockWorlds];
let localCategories = [...mockCategories];
let localItems = [...mockItems];
let localScenes = [...mockScenes];
let localCharacters = [...mockCharacters];

export const fallbackStorage = {
  // Projects
  getProjects: () => [...localProjects],
  getProject: (id: string) => localProjects.find(p => p.id === id),
  createProject: (project: any) => {
    const newProject = { 
      ...project, 
      id: `mock-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
    };
    localProjects.push(newProject);
    return newProject;
  },
  updateProject: (id: string, updates: any) => {
    const index = localProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      localProjects[index] = { 
        ...localProjects[index], 
        ...updates,
        lastEdited: new Date().toISOString(),
      };
      return localProjects[index];
    }
    return null;
  },
  deleteProject: (id: string) => {
    localProjects = localProjects.filter(p => p.id !== id);
  },

  // Worlds
  getWorlds: () => [...localWorlds],
  getWorld: (id: string) => localWorlds.find(w => w.id === id),
  createWorld: (world: any) => {
    const newWorld = { 
      ...world, 
      id: `mock-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
    };
    localWorlds.push(newWorld);
    return newWorld;
  },
  updateWorld: (id: string, updates: any) => {
    const index = localWorlds.findIndex(w => w.id === id);
    if (index !== -1) {
      localWorlds[index] = { 
        ...localWorlds[index], 
        ...updates,
        lastEdited: new Date().toISOString(),
      };
      return localWorlds[index];
    }
    return null;
  },
  deleteWorld: (id: string) => {
    localWorlds = localWorlds.filter(w => w.id !== id);
  },

  // Categories
  getCategories: (worldId: string) => localCategories.filter(c => c.worldId === worldId),
  createCategory: (worldId: string, category: any) => {
    const newCategory = { 
      ...category, 
      id: `mock-${Date.now()}`,
      worldId,
      createdAt: new Date().toISOString(),
    };
    localCategories.push(newCategory);
    return newCategory;
  },
  updateCategory: (worldId: string, id: string, updates: any) => {
    const index = localCategories.findIndex(c => c.id === id && c.worldId === worldId);
    if (index !== -1) {
      localCategories[index] = { ...localCategories[index], ...updates };
      return localCategories[index];
    }
    return null;
  },
  deleteCategory: (worldId: string, id: string) => {
    localCategories = localCategories.filter(c => !(c.id === id && c.worldId === worldId));
  },

  // Items
  getItems: (worldId: string, categoryId: string) => 
    localItems.filter(i => i.worldId === worldId && i.categoryId === categoryId),
  getAllItems: (worldId: string) => localItems.filter(i => i.worldId === worldId),
  createItem: (worldId: string, categoryId: string, item: any) => {
    const newItem = { 
      ...item, 
      id: `mock-${Date.now()}`,
      worldId,
      categoryId,
      createdAt: new Date().toISOString(),
    };
    localItems.push(newItem);
    return newItem;
  },
  updateItem: (worldId: string, categoryId: string, id: string, updates: any) => {
    const index = localItems.findIndex(i => 
      i.id === id && i.worldId === worldId && i.categoryId === categoryId
    );
    if (index !== -1) {
      localItems[index] = { ...localItems[index], ...updates };
      return localItems[index];
    }
    return null;
  },
  deleteItem: (worldId: string, categoryId: string, id: string) => {
    localItems = localItems.filter(i => 
      !(i.id === id && i.worldId === worldId && i.categoryId === categoryId)
    );
  },

  // Scenes
  getScenes: (projectId: string) => localScenes.filter(s => s.projectId === projectId),
  createScene: (projectId: string, scene: any) => {
    const newScene = { 
      ...scene, 
      id: `mock-${Date.now()}`,
      projectId,
      createdAt: new Date().toISOString(),
    };
    localScenes.push(newScene);
    return newScene;
  },
  updateScene: (projectId: string, id: string, updates: any) => {
    const index = localScenes.findIndex(s => s.id === id && s.projectId === projectId);
    if (index !== -1) {
      localScenes[index] = { ...localScenes[index], ...updates };
      return localScenes[index];
    }
    return null;
  },
  deleteScene: (projectId: string, id: string) => {
    localScenes = localScenes.filter(s => !(s.id === id && s.projectId === projectId));
  },

  // Characters
  getCharacters: (projectId: string) => localCharacters.filter(c => c.projectId === projectId),
  createCharacter: (projectId: string, character: any) => {
    const newCharacter = { 
      ...character, 
      id: `mock-${Date.now()}`,
      projectId,
      createdAt: new Date().toISOString(),
    };
    localCharacters.push(newCharacter);
    return newCharacter;
  },
  updateCharacter: (projectId: string, id: string, updates: any) => {
    const index = localCharacters.findIndex(c => c.id === id && c.projectId === projectId);
    if (index !== -1) {
      localCharacters[index] = { ...localCharacters[index], ...updates };
      return localCharacters[index];
    }
    return null;
  },
  deleteCharacter: (projectId: string, id: string) => {
    localCharacters = localCharacters.filter(c => !(c.id === id && c.projectId === projectId));
  },
};