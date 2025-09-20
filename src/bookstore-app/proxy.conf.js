module.exports = {
  "/api": {
    target: process.env["services__bookstore-api__https__0"] ||
      process.env["services__bookstore-api__http__0"],
    secure: process.env["NODE_ENV"] !== "development",
    changeOrigin: true,
  },
};