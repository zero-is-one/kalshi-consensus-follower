export const getPrettyTimestamp = () => {
  const now = new Date();
  return now.toLocaleString("en-US", {
    timeZone: "America/New_York",
  });
};
