import { create } from "zustand";
import type { Environment } from "@/types";

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;

  createEnvironment: (name: string) => Environment;
  updateEnvironment: (id: string, updates: Partial<Pick<Environment, "name" | "variables">>) => void;
  deleteEnvironment: (id: string) => void;
  setActiveEnvironment: (id: string | null) => void;
  getActiveEnvironment: () => Environment | undefined;
  duplicateEnvironment: (id: string) => Environment | undefined;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [],
  activeEnvironmentId: null,

  createEnvironment: (name: string) => {
    const now = new Date().toISOString();
    const env: Environment = {
      id: generateId(),
      name,
      variables: {},
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ environments: [...state.environments, env] }));
    return env;
  },

  updateEnvironment: (id, updates) =>
    set((state) => ({
      environments: state.environments.map((env) =>
        env.id === id
          ? { ...env, ...updates, updatedAt: new Date().toISOString() }
          : env,
      ),
    })),

  deleteEnvironment: (id) =>
    set((state) => ({
      environments: state.environments.filter((env) => env.id !== id),
      activeEnvironmentId:
        state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
    })),

  setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

  getActiveEnvironment: () => {
    const { environments, activeEnvironmentId } = get();
    return environments.find((env) => env.id === activeEnvironmentId);
  },

  duplicateEnvironment: (id) => {
    const source = get().environments.find((env) => env.id === id);
    if (!source) return undefined;

    const now = new Date().toISOString();
    const duplicate: Environment = {
      id: generateId(),
      name: `${source.name} (copy)`,
      variables: { ...source.variables },
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ environments: [...state.environments, duplicate] }));
    return duplicate;
  },
}));
