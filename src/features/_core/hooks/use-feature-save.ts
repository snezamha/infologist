"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { getErrorMessage } from "@/features/_core/module-errors";
import {
  type ProjectFeatureKey,
  type ProjectFeatures,
  type ProjectFeatureState,
} from "@/features/_core/registry";
import { toastManager } from "@/lib/toast-manager";
import { publishProjectNavigationChange } from "@/hooks/use-live-project-navigation";

type UseFeatureSaveReturn = {
  features: ProjectFeatures;
  setFeatureEnabled: (key: ProjectFeatureKey, enabled: boolean) => void;
  setFeatureSetting: (
    key: ProjectFeatureKey,
    setting: string,
    value: unknown,
  ) => void;
  confirmFeature: {
    key: ProjectFeatureKey;
    state: ProjectFeatureState;
  } | null;
  onConfirmDisable: () => void;
  onCancelConfirm: () => void;
};

export function useFeatureSave(
  initialFeatures: ProjectFeatures,
  onSave?: (features: Partial<ProjectFeatures>) => Promise<ProjectFeatures>,
  editable: boolean = true,
  liveNavigationKey?: string,
): UseFeatureSaveReturn {
  const t = useTranslations("settings");
  const featuresRef = useRef(initialFeatures);
  const confirmedFeaturesRef = useRef(initialFeatures);
  const featureSaveQueuesRef = useRef(
    new Map<ProjectFeatureKey, Promise<void>>(),
  );
  const featureSaveVersionsRef = useRef(new Map<ProjectFeatureKey, number>());
  const featureSaveTimersRef = useRef(
    new Map<ProjectFeatureKey, ReturnType<typeof setTimeout>>(),
  );
  const [features, setFeatures] = useState(initialFeatures);
  const [, startTransition] = useTransition();
  const [confirmFeature, setConfirmFeature] = useState<{
    key: ProjectFeatureKey;
    state: ProjectFeatureState;
  } | null>(null);

  useEffect(() => {
    const timers = featureSaveTimersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  function publishNavigationChange() {
    if (liveNavigationKey) {
      publishProjectNavigationChange(liveNavigationKey);
    }
  }

  function setLocalFeature(
    key: ProjectFeatureKey,
    update: (state: ProjectFeatureState) => ProjectFeatureState,
  ) {
    const state = update(featuresRef.current[key]);
    const next = { ...featuresRef.current, [key]: state };
    featuresRef.current = next;
    setFeatures(next);
    return state;
  }

  function persistFeature(
    key: ProjectFeatureKey,
    state: ProjectFeatureState,
    successTitle: string,
    publishNavigation = false,
  ) {
    if (!onSave || !editable) return;

    const version = (featureSaveVersionsRef.current.get(key) ?? 0) + 1;
    featureSaveVersionsRef.current.set(key, version);
    const previous = featureSaveQueuesRef.current.get(key) ?? Promise.resolve();
    const request = previous
      .catch(() => undefined)
      .then(async () => {
        const saved = await onSave({ [key]: state });
        confirmedFeaturesRef.current = {
          ...confirmedFeaturesRef.current,
          [key]: saved[key],
        };

        if (featureSaveVersionsRef.current.get(key) === version) {
          const next = { ...featuresRef.current, [key]: saved[key] };
          featuresRef.current = next;
          setFeatures(next);
          if (publishNavigation) publishNavigationChange();
          toastManager.add({
            title: successTitle,
            type: "success",
            timeout: 3000,
          });
        }
      })
      .catch((error) => {
        if (featureSaveVersionsRef.current.get(key) === version) {
          const confirmed = confirmedFeaturesRef.current[key];
          const next = { ...featuresRef.current, [key]: confirmed };
          featuresRef.current = next;
          setFeatures(next);
          toastManager.add({
            title: getErrorMessage(error, t("error")),
            type: "error",
            timeout: 5000,
          });
        }
      })
      .finally(() => {
        if (featureSaveQueuesRef.current.get(key) === request) {
          featureSaveQueuesRef.current.delete(key);
        }
      });

    featureSaveQueuesRef.current.set(key, request);
    startTransition(async () => {
      await request;
    });
  }

  function scheduleFeatureSave(
    key: ProjectFeatureKey,
    state: ProjectFeatureState,
    successTitle: string,
  ) {
    const currentTimer = featureSaveTimersRef.current.get(key);
    if (currentTimer) clearTimeout(currentTimer);

    const timer = setTimeout(() => {
      featureSaveTimersRef.current.delete(key);
      persistFeature(key, state, successTitle);
    }, 400);
    featureSaveTimersRef.current.set(key, timer);
  }

  function flushScheduledFeatureSave(key: ProjectFeatureKey) {
    const timer = featureSaveTimersRef.current.get(key);
    if (!timer) return;
    clearTimeout(timer);
    featureSaveTimersRef.current.delete(key);
  }

  function setFeatureEnabled(key: ProjectFeatureKey, enabled: boolean) {
    const state = { ...featuresRef.current[key], enabled };

    if (!enabled && featuresRef.current[key].enabled) {
      setConfirmFeature({ key, state });
      return;
    }

    flushScheduledFeatureSave(key);
    setLocalFeature(key, () => state);
    const featureName = t(`features.items.${key}.title`);
    const status = enabled ? t("active") : t("inactive");
    persistFeature(key, state, `${featureName} ${status}`, true);
  }

  function setFeatureSetting(
    key: ProjectFeatureKey,
    setting: string,
    value: unknown,
  ) {
    const state = setLocalFeature(
      key,
      (current) =>
        ({
          ...current,
          settings: { ...current.settings, [setting]: value },
        }) as ProjectFeatureState,
    );
    scheduleFeatureSave(key, state, t("saved"));
  }

  function handleConfirmDisable() {
    if (!confirmFeature || !onSave || !editable) return;

    const { key, state } = confirmFeature;
    setConfirmFeature(null);
    flushScheduledFeatureSave(key);
    setLocalFeature(key, () => state);
    const featureName = t(`features.items.${key}.title`);
    persistFeature(key, state, `${featureName} ${t("inactive")}`, true);
  }

  return {
    features,
    setFeatureEnabled,
    setFeatureSetting,
    confirmFeature,
    onConfirmDisable: handleConfirmDisable,
    onCancelConfirm: () => setConfirmFeature(null),
  };
}
