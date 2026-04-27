const path = require("path");

require("dotenv").config({
  path: path.join(process.cwd(), ".env"),
});
console.log("ENV CHECK:", process.env.SUPABASE_URL);

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});