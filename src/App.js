import React, { useEffect } from "react";
import { Router, navigate } from "@reach/router";

import { ProvideNotion } from "./services/notion";
import { Devices } from "./pages/Devices";
import { Loading } from "./components/Loading";
import { Login } from "./pages/Login";
import { Logout } from "./pages/Logout";
import { Focus } from "./pages/Focus";
import { Brainwaves } from "./pages/Brainwaves";


import { useNotion } from "./services/notion";

export function App() {
  return (
    <ProvideNotion>
      <Routes />
    </ProvideNotion>
  );
}

function Routes() {
  const { user, loadingUser } = useNotion();

  useEffect(() => {
    if (!loadingUser && !user) {
      navigate("/login");
    }
  }, [user, loadingUser]);

  if (loadingUser) {
    return <Loading />;
  }

  return (
    <Router>
      <Focus path="/" />
      <Brainwaves path="/brainwaves" />
      <Devices path="/devices" />
      <Login path="/login" />
      <Logout path="/logout" />
    </Router>
  );
}
