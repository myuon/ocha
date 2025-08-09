export const setupGracefulShutdown = (server: {
  close: (callback?: () => void) => void;
}) => {
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => {
      console.log("Process terminated");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};
