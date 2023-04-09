import { fromEvent, partition, pipe } from "rxjs";
import { shareReplay, takeUntil, repeatWhen } from "rxjs/operators";

export function whilePageIsVisible() {
  const visibilityChange$ = fromEvent(
    document,
    "visibilitychange"
  ).pipe(shareReplay({ refCount: true, bufferSize: 1 }));

  const [pageVisible$, pageHidden$] = partition(
    visibilityChange$,
    () => document.visibilityState === "visible"
  );

  return pipe(
    takeUntil(pageHidden$),
    repeatWhen(() => pageVisible$)
  );
}
