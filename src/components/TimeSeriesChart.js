import React, { createRef, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { SmoothieChart, TimeSeries } from "smoothie";

const defaultChannelStyle = {
  position: "relative",
  width: "1700px",
  height: "60px"
};

const defaultColors = [
  "rgba(112,185,252,1)",
  "rgba(116,150,161,1)",
  "rgba(144,132,246,1)",
  "rgba(162,86,178,1)",
  "rgba(207,181,59, 1)",
  "rgba(138,219,229,1)",
  "rgba(148,159,177,1)",
  "rgba(77,83,96,1)"
];

const graphConfig = {
  responsive: true,
  millisPerPixel: 5,
  maxValue: 60,
  minValue: -60,
  grid: {
    lineWidth: 4,
    fillStyle: "transparent",
    strokeStyle: "transparent",
    sharpLines: true,
    verticalSections: 0,
    borderVisible: false
  },
  labels: {
    disabled: true
  }
};

export function TimeSeriesChart({
  autoScale = true,
  isPlotting = true,
  timesyncOffset = 0,
  channelNames,
  channelAmount,
  channelStyle = defaultChannelStyle,
  channelColors = defaultColors,
  plotDelay = 0,
  epoch
}) {
  const channels = useMemo(
    () =>
      numberToArrayOf(channelAmount, (channelIndex) => ({
        ref: createRef(channelIndex),
        canvas: new SmoothieChart(graphConfig),
        line: new TimeSeries()
      })),
    []
  );

  useEffect(() => {
    channels.forEach((channel) => {
      if (autoScale) {
        Reflect.deleteProperty(channel.canvas.options, "maxValue");
        Reflect.deleteProperty(channel.canvas.options, "minValue");
      } else {
        channel.canvas.options.maxValue = graphConfig.maxValue;
        channel.canvas.options.minValue = graphConfig.minValue;
      }
    });
  }, [autoScale]);

  function plot(channels, epoch) {
    const { data, info } = epoch;
    const { startTime, samplingRate } = info;
    channels.forEach((channel, channelIndex) => {
      data[channelIndex].forEach((amplitude, sampleIndex) => {
        const sampleDelay = 1000 / samplingRate;
        const sampleAdjust = sampleIndex * sampleDelay;
        channel.line.append(
          startTime + sampleAdjust + timesyncOffset,
          amplitude
        );
      });
    });
  }

  useEffect(() => {
    if (epoch) {
      plot(channels, epoch);
    }
  }, [epoch]);

  // create first flatline
  useEffect(() => {
    Array.from({ length: 10 }, (_, i) => i)
      .reverse()
      .forEach((i) => {
        const startTime = new Date(Date.now() - i * 1000).getTime();
        plot(channels, createEpoch({ startTime }));
      });
  }, []);

  // Keeps flatline alive
  useEffect(() => {
    let interval;
    if (!isPlotting) {
      plot(channels, createEpoch());
      interval = setInterval(() => {
        plot(channels, createEpoch());
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlotting]);

  useEffect(() => {
    channels.forEach((channel, channelIndex) => {
      channel.canvas.addTimeSeries(channel.line, {
        lineWidth: 2,
        strokeStyle: channelColors[channelIndex]
      });
      channel.canvas.streamTo(channel.ref.current, plotDelay);
    });
  }, []);

  // update channelColors
  useEffect(() => {
    channels.forEach((channel, index) => {
      channel.canvas.seriesSet[0].options.strokeStyle =
        channelColors[index];
    });
  }, [channelColors]);

  return (
    <main>
      {channels.map((channel, channelIndex) => (
        <div key={channelIndex} style={channelStyle}>
          {channelIndex in channelNames ? (
            <aside
              style={getChannelNameStyles(channelColors[channelIndex])}
            >
              {channelNames[channelIndex]}
            </aside>
          ) : null}
          <canvas ref={channel.ref} style={channelStyle} />
        </div>
      ))}
    </main>
  );
}

function numberToArrayOf(length, mapper) {
  return Array.from({ length }, (_, i) => mapper(i));
}

function createEpoch({
  startTime = Date.now(),
  channelAmount = 8,
  samplingRate = 250,
  amplitude = 0,
  bufferSize = 1
} = {}) {
  return {
    data: numberToArrayOf(channelAmount, () =>
      numberToArrayOf(bufferSize, () => amplitude)
    ),
    info: {
      startTime,
      samplingRate,
      channelNames: numberToArrayOf(channelAmount, (i) => `C${i}`)
    }
  };
}

function getChannelNameStyles(color) {
  return {
    color,
    fontWeight: 500,
    position: "absolute",
    zIndex: 1,
    width: "70px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "black",
    left: 0,
    top: 0
  };
}

TimeSeriesChart.propTypes = {
  isPlotting: PropTypes.bool,
  plotDelay: PropTypes.number,
  channelStyle: PropTypes.object,
  channelColors: PropTypes.arrayOf(PropTypes.string),
  channelNames: PropTypes.arrayOf(PropTypes.string),
  channelAmount: PropTypes.number.isRequired,
  epoch: PropTypes.shape({
    data: PropTypes.array.isRequired,
    info: PropTypes.shape({
      startTime: PropTypes.number.isRequired,
      channelNames: PropTypes.arrayOf(PropTypes.string).isRequired,
      samplingRate: PropTypes.number.isRequired
    }).isRequired
  })
};