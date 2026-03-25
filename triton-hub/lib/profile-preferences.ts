import {
  getLocalAvatarUrl,
  getLocalDisplayName,
  setLocalAvatarUrl,
  setLocalDisplayName,
} from "./user-preferences";

export type StoredProfilePreferences = {
  displayName: string;
  avatarUrl: string;
};

const PROFILE_EVENT = "triton-profile-updated";

export function getStoredProfilePreferences(): StoredProfilePreferences {
  return {
    displayName: getLocalDisplayName(),
    avatarUrl: getLocalAvatarUrl(),
  };
}

export function setStoredProfilePreferences(next: StoredProfilePreferences): void {
  setLocalDisplayName(next.displayName);
  setLocalAvatarUrl(next.avatarUrl);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: next }));
  }
}

export function clearStoredProfilePreferences(): void {
  setStoredProfilePreferences({ displayName: "", avatarUrl: "" });
}

export function subscribeToStoredProfilePreferences(
  callback: (value: StoredProfilePreferences) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const onProfileEvent = (event: Event) => {
    const customEvent = event as CustomEvent<StoredProfilePreferences>;
    callback(customEvent.detail || getStoredProfilePreferences());
  };

  const onStorage = () => {
    callback(getStoredProfilePreferences());
  };

  window.addEventListener(PROFILE_EVENT, onProfileEvent as EventListener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(PROFILE_EVENT, onProfileEvent as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}
