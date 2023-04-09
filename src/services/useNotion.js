import React, { useContext, useEffect } from "react";
import { of, combineLatest, pipe } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";
import { useObservableState } from "observable-hooks";

import { notion, NotionContext } from "./notion";
import { whilePageIsVisible } from "./optimizations";
// import { isOnboardingPending } from "./userData";
import {
  saveLastSelectedDevice,
  getLastSelectedDeviceId,
  useAppPersistedLocalMode
} from "./persistence";

const initialState = {
  loading: true,
  authenticated: false,
  user: null,
  userClaims: null,
  devices: null,
  selectedDevice: null,
  status: null,
  isLocalMode: null,
  onboardingPending: true,
  supportMode: null
};

export const useNotion = () => {
  return useContext(NotionContext);
};

export function ProvideNotion({ children }) {
  const notionProvider = useProvideNotion();

  return (
    <NotionContext.Provider value={notionProvider}>
      {children}
    </NotionContext.Provider>
  );
}

function useProvideNotion() {
  const [persistedLocalMode, setPersistedLocalMode] =
    useAppPersistedLocalMode(false);

  const [state] = useObservableState(
    () =>
      notion
        .onAuthStateChanged()
        .pipe(selectDefaultDevice(), switchMapToLatestDeviceState()),
    initialState
  );

  const { selectedDevice } = state;

  useEffect(() => {
    if (selectedDevice) {
      notion.enableLocalMode(persistedLocalMode).catch(console.error);
    }
  }, [persistedLocalMode, selectedDevice]);

  return {
    ...state,
    setPersistedLocalMode
  };
}

function switchMapToLatestDeviceState() {
  return pipe(
    switchMap((user) => {
      return !user
        ? of({ ...initialState, loading: false })
        : notion.onUserDevicesChange().pipe(
            switchMap((devices) => {
              if (!devices.length) {
                return of({
                  ...initialState,
                  loading: false,
                  user,
                  devices
                });
              }

              return combineAllNotionStates(user);
            }),
            addAuthDerivedState()
          );
    })
  );
}

function combineAllNotionStates(user) {
  return combineLatest([
    notion.onUserDevicesChange(),
    notion
      .onDeviceChange()
      .pipe(
        ensureDeviceIsSelected(),
        saveLastSelectedDevice(user?.uid)
      ),
    notion.status().pipe(whilePageIsVisible()),
    notion.isLocalMode()
  ]).pipe(
    map(([devices, selectedDevice, status, isLocalMode]) => {
      return {
        loading: false,
        user,
        devices,
        selectedDevice,
        status,
        isLocalMode
      };
    })
  );
}

function addAuthDerivedState() {
  return pipe(
    switchMap((state) => {
      return notion.onUserClaimsChange().pipe(
        map((userClaims) => {
          const claimedBy = state.status?.claimedBy;

          // const onboardingPending = isOnboardingPending(
          //   state.devices,
          //   userClaims
          // );

          const supportMode =
            (userClaims?.admin || userClaims?.neurositySupport) &&
            claimedBy &&
            claimedBy !== state.user.uid;

          return {
            ...state,
            userClaims,
            // onboardingPending,
            authenticated: !!state.user,
            supportMode
          };
        })
      );
    })
  );
}

function selectDefaultDevice() {
  return pipe(
    tap((user) => {
      if (user) {
        const lastSelectedDeviceId = getLastSelectedDeviceId(user?.uid);

        notion
          .selectDevice((devices) => {
            const lastSelectedDevice = devices.find(
              (device) => device.deviceId === lastSelectedDeviceId
            );
            const selectedDevice = lastSelectedDevice ?? devices[0];
            return selectedDevice;
          })
          .catch(() => {}); // No device found
      }
    })
  );
}

function ensureDeviceIsSelected() {
  return pipe(
    tap((selectedDevice) => {
      if (!selectedDevice) {
        notion.selectDevice((devices) => devices[0]).catch(() => {}); // No device found
      }
    })
  );
}
