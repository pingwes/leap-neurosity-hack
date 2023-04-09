export const channelColorsByName = {
  CP3: "rgba(112,185,252,1)", // blue
  C3: "rgba(116,150,161,1)", // green gray
  F5: "rgba(144,132,246,1)", // purple
  PO3: "rgba(162,86,178,1)", // violet
  PO4: "rgba(207,181,59, 1)", // mustard
  F6: "rgba(138,219,229,1)", // turquoise
  C4: "rgba(148,159,177,1)", // light gray
  CP4: "rgba(77,83,96,1)", // dark gray
  CP6: "rgba(207,181,59, 1)", // mustard
  CP5: "rgba(162,86,178,1)" // violet
};

export function getChannelColor(channelName) {
  return channelColorsByName?.[channelName] ?? "gray";
}
