import { useState, useMemo, useEffect } from "react";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import ColorHash from "color-hash";

export const colorHash = new ColorHash({ lightness: 0.7 });

export const getLabelColor = (label) => colorHash.hex(label);

export function usePausableObservable({
  observableGetter,
  status,
  dependencies,
  complete = () => {},
  error = () => {},
  next = () => {}
}) {
  const shouldStop = useMemo(() => new Subject(), []);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (status === "started") {
      observableGetter(shouldStop)
        .pipe(takeUntil(shouldStop))
        .subscribe({
          next: (...data) => {
            setData(...data);
            next(...data);
          },
          complete,
          error
        });
    }

    if (status === "ready") {
      shouldStop.next(true);
    }

    return () => shouldStop.next(true);
  }, [status, ...(dependencies || [])]);

  return [data, setData];
}

export const getTooltip = (tooltip, data, key) => {
  const dataset = data.datasets[tooltip.datasetIndex];
  const tootltipData = dataset.data[tooltip.index].tooltip;
  return tootltipData && key && tootltipData[key]
    ? tootltipData[key]
    : false;
};

export const chartOptions = {
  plugins: {
    streaming: false
  },
  legend: {
    display: true,
    position: "bottom"
  },
  showLines: true,
  tooltips: {
    callbacks: {
      label: (tooltip, data) => getTooltip(tooltip, data, "label"),
      beforeFooter: ([tooltip], data) =>
        getTooltip(tooltip, data, "beforeFooter"),
      footer: ([tooltip], data) => getTooltip(tooltip, data, "footer"),
      afterFooter: ([tooltip], data) =>
        getTooltip(tooltip, data, "afterFooter")
    }
  },
  scales: {
    yAxes: [
      {
        ticks: {
          min: 0,
          max: 1,
          beginAtZero: false
        }
      }
    ],
    xAxes: [
      {
        barPercentage: 1,
        categoryPercentage: 1,
        type: "time",
        time: {
          unit: "millisecond"
        },
        ticks: {
          source: "labels"
        }
      }
    ]
  }
};
