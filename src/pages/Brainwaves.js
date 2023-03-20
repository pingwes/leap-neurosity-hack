import React from "react";

import { Raw } from "../components/notion/Brainwaves/Raw";

export function Brainwaves() {
  return (
    <div className="content">
      <div className="container-fluid">
        <div className="col-md-12">
          <h2>Brainwaves</h2>
          <Raw />
        </div>
      </div>
    </div>
  );
}