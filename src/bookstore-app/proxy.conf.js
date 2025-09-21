module.exports = {
  "/api": {
    target: process.env["services__bookstoreapi__https__0"] ||
      process.env["services__bookstoreapi__http__0"],
    secure: process.env["NODE_ENV"] !== "development",
    changeOrigin: true,
  },
};