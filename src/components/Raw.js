import React, { useState, useEffect } from "react";
import { skip } from "rxjs/operators";
import Switch from "react-switch";
import styled from "styled-components";

import { notion } from "../services/notion";
import { useNotion } from "../services/useNotion";
import { usePausableObservable } from "../services/metrics";
import { getChannelColor } from "../services/channels";
import { TimeSeriesChart } from "./TimeSeriesChart";

const Navigation = styled.nav`
  padding: 10px 0;
  display: flex;
  float: right;

  & .react-switch {
    display: flex !important;
    margin-left: 10px;
  }

  & label {
    display: flex;
    margin-left: 20px;
  }
`;

export function Raw() {
  const {
    selectedDevice,
    status: deviceStatus,
    userClaims
  } = useNotion();
  const { sleepMode } = deviceStatus || {};
  const [status, setStatus] = useState("ready");

  // neurosity manufacturers are interested in seeing the signal without scaling
  // so they can better assess any noise while conducting signal quality tests

  const [autoScale, setAutoScale] = useState(
    !userClaims?.neurosityManufacturer
  );
  const [epoch] = usePausableObservable({
    observableGetter: () => notion.brainwaves("raw").pipe(skip(1)),
    status,
    error: (error) => console.error(error)
  });

  const [data, setData] = useState([]);


  useEffect(() => {
    // Fetch the log file and parse the JSON data
    fetch("../../data/1679357234.log")
      .then(response => response.text())
      .then(text => text.trim().split('\n').map(JSON.parse))
      .then(setData)
      .catch(console.error);
  }, []);

  console.log("data: " + JSON.stringify(data))

  console.log("epoch: " + JSON.stringify(epoch))

  useEffect(() => {
    if (sleepMode) {
      stop();
    }
  }, [sleepMode]);

  function start() {
    setStatus("started");
  }

  function stop() {
    setStatus("ready");
  }

  return (
    <div className="card">
      {selectedDevice && (
        <div className="card-content card-content-bleed-vertically">
          <TimeSeriesChart
            channelNames={selectedDevice.channelNames}
            channelColors={selectedDevice.channelNames.map(
              (channelName) => getChannelColor(channelName)
            )}
            channelAmount={8}
            epoch={epoch}
            plotDelay={1000}
            isPlotting={status === "started"}
            autoScale={autoScale}
            // timesyncOffset={notion.getTimesyncOffset()}
          /> 
        </div>
      )}
      <div className="card-footer">
        {status === "started" && (
          <button className="btn btn-default btn-sm" onClick={stop}>
            Stop
          </button>
        )}
        {status === "ready" && (
          <button
            className="btn btn-default btn-sm"
            disabled={sleepMode}
            onClick={start}
          >
            Start
          </button>
        )}
        <Navigation>
          <label htmlFor="autoScale">
            Auto scale
            <Switch
              id="autoScale"
              checked={autoScale}
              onChange={(checked) => setAutoScale(checked)}
              onColor="#86d3ff"
              onHandleColor="#2693e6"
              uncheckedIcon={false}
              checkedIcon={false}
              boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
              activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
              handleDiameter={20}
              height={16}
              width={32}
              className="react-switch"
            />
          </label>
        </Navigation>
      </div>
    </div>
  );
}