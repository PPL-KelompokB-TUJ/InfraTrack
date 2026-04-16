require("dotenv").config();

const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`InfraTrack backend berjalan di port ${PORT}`);
});
