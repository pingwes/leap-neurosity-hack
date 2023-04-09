import { useCallback } from "react";
import { pipe } from "rxjs";
import { tap } from "rxjs/operators";
import createPersistedState from "use-persisted-state";

import { useNotion } from "./useNotion";

export const DEVICE_ID_BY_USER_KEY = "deviceIdByUser";
export const NAV_OPEN_BY_USER_KEY = "navOpenByUser";
export const APP_LOCAL_MODE_KEY = "appPersistedLocalMode";
export const APP_SHOW_SNAPSHOTS_KEY = "appPersistedShowSnapshots";

export const userNavOpenByUser = createPersistedState(
  NAV_OPEN_BY_USER_KEY
);

export const useAppPersistedShowSnapshots = createPersistedState(
  APP_SHOW_SNAPSHOTS_KEY
);

export const useAppPersistedLocalMode = createPersistedState(
  APP_LOCAL_MODE_KEY
);

export const usePersistentAppData = () => {
  const [navOpenByUser, setNavOpenByUser] = userNavOpenByUser({});
  const { user } = useNotion();
  const userId = user?.uid;

  const userPersistedNavOpen = navOpenByUser?.[userId] ?? false;

  const setUserPersistedNavOpen = useCallback(
    (open) => {
      setNavOpenByUser((state) => {
        state = state || {};
        const value =
          typeof open === "function" ? open(state[userId]) : open;

        return {
          ...navOpenByUser,
          [userId]: value
        };
      });
    },
    [userId]
  );

  return {
    userPersistedNavOpen,
    setUserPersistedNavOpen
  };
};

export function getLastSelectedDeviceId(userId) {
  const deviceIdByUser =
    JSON.parse(window.localStorage.getItem(DEVICE_ID_BY_USER_KEY)) ||
    {};

  return deviceIdByUser?.[userId];
}

export function saveLastSelectedDevice(userId) {
  return pipe(
    tap((selectedDevice) => {
      const deviceIdByUser =
        JSON.parse(
          window.localStorage.getItem(DEVICE_ID_BY_USER_KEY)
        ) || {};

      deviceIdByUser[userId] = selectedDevice?.deviceId;

      window.localStorage.setItem(
        DEVICE_ID_BY_USER_KEY,
        JSON.stringify(deviceIdByUser)
      );
    })
  );
}
