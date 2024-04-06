import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { JWTPlugin, authPlugin } from "./feature/auth/plugin";
import { authRouter } from "./feature/auth/router";
import { bookingRouter } from "./feature/booking/router";
import { campgroundsRouter } from "./feature/campground/router";

export const app = new Elysia()
  .use(
    swagger({
      provider: "swagger-ui",
      documentation: {
        tags: [
          { name: "Campground", description: "Campground's endpoints" },
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Booking", description: "Booking endpoints" },
        ],
      },
    }),
  )
  .use(JWTPlugin)
  .use(authPlugin)
  .use(authRouter)
  .use(campgroundsRouter)
  .use(bookingRouter)
  .get(
    "/",
    ({ user }) => {
      return {
        message: `Hello, ${user?.name}`,
      };
    },
    {
      auth: ["user"],
    },
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type AppType = typeof app;
