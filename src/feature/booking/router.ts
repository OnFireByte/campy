import Elysia, { t } from "elysia";
import { authPlugin } from "../auth/plugin";
import { db } from "../../db/db";
import { bookings } from "../../db/schema";
import { eq } from "drizzle-orm";

export const bookingRouter = new Elysia({
  prefix: "/booking",
})
  .use(authPlugin)
  .get(
    "/",
    async ({ user, error }) => {
      try {
        if (user!.role !== "admin") {
          const allBooking = await db.query.bookings.findMany();
          return {
            bookings: allBooking,
          };
        } else {
          const userBooking = await db.query.bookings.findMany({
            where: (booking, { eq }) => eq(booking.userID, user!.id),
          });
          return {
            bookings: userBooking,
          };
        }
      } catch (err) {
        return error(500, {
          message: "Internal server error",
        });
      }
    },
    {
      auth: ["admin", "user"],
      tags: ["Booking"],
      response: {
        200: t.Object({
          bookings: t.Array(
            t.Object({
              id: t.Number(),
              userID: t.Number(),
              date: t.Date(),
              campgroundID: t.Number(),
            }),
          ),
        }),
        401: t.Object({
          message: t.String({ minLength: 1 }),
        }),
        403: t.Object({
          message: t.String({ minLength: 1 }),
        }),
        500: t.Object({
          message: t.String({ minLength: 1 }),
        }),
      },
    },
  )
  .post(
    "/",
    async ({ user, error, body }) => {
      const { campgroundID, date } = body;
      try {
        const booking = await db.insert(bookings).values({
          userID: user!.id,
          campgroundID,
          date,
        });

        return (await db.query.bookings.findFirst({
          where: (bk, { eq }) => eq(bk.id, booking[0].insertId),
        }))!;
      } catch (err) {
        return error(500, {
          message: "Internal server error",
        });
      }
    },
    {
      auth: ["user"],
      tags: ["Booking"],
      body: t.Object({
        campgroundID: t.Number(),
        date: t.Date(),
      }),
      response: {
        200: t.Object({
          id: t.Number(),
          userID: t.Number(),
          date: t.Date(),
          campgroundID: t.Number(),
        }),
        500: t.Object({
          message: t.String({ minLength: 1 }),
        }),
      },
    },
  )
  .get(
    "/:id",
    async ({ params, user, error }) => {
      try {
        const parsedID = parseInt(params.id);

        const booking = await db.query.bookings.findFirst({
          where: (booking, { eq }) => eq(booking.id, parsedID),
        });

        if (!booking) {
          return error(404, {
            message: "Booking not found",
          });
        }

        if (user!.role !== "admin" && booking.userID !== user!.id) {
          return error(404, {
            message: "Booking not found",
          });
        }

        return booking;
      } catch (err) {
        return error(500, {
          message: "Internal server error",
        });
      }
    },
    {
      auth: ["admin", "user"],
      tags: ["Booking"],
      response: {
        200: t.Object({
          id: t.Number(),
          userID: t.Number(),
          date: t.Date(),
          campgroundID: t.Number(),
        }),
        500: t.Object({
          message: t.String({ minLength: 1 }),
        }),
        404: t.Object({
          message: t.String({ minLength: 1 }),
        }),
      },
    },
  )
  .patch(
    "/:id",
    async ({ user, params, error, body }) => {
      try {
        const parsedID = parseInt(params.id);

        const booking = await db.query.bookings.findFirst({
          where: (booking, { eq }) => eq(booking.id, parsedID),
        });

        if (!booking) {
          return error(404, {
            message: "Booking not found",
          });
        }

        if (user!.role !== "admin" && booking.userID !== user!.id) {
          return error(404, {
            message: "Booking not found",
          });
        }

        await db.update(bookings).set({
          date: body.date ?? undefined,
        });

        const updatedBooking = await db.query.bookings.findFirst({
          where: (booking, { eq }) => eq(booking.id, parsedID),
        });

        if (!updatedBooking) {
          return error(404, {
            message: "Booking not found",
          });
        }

        return updatedBooking;
      } catch (err) {
        return error(500, {
          message: "Internal server error",
        });
      }
    },
    {
      auth: ["admin", "user"],
      tags: ["Booking"],
      body: t.Object({
        date: t.Optional(t.Date()),
      }),
      response: {
        200: t.Object({
          id: t.Number(),
          userID: t.Number(),
          date: t.Date(),
          campgroundID: t.Number(),
        }),
        500: t.Object({
          message: t.String({ minLength: 1 }),
        }),
        404: t.Object({
          message: t.String({ minLength: 1 }),
        }),
      },
    },
  )
  .delete(
    "/:id",
    async ({ user, error, params }) => {
      try {
        const parsedID = parseInt(params.id);

        const booking = await db.query.bookings.findFirst({
          where: (booking, { eq }) => eq(booking.id, parsedID),
        });

        if (!booking) {
          return error(404, {
            message: "Booking not found",
          });
        }

        if (user!.role !== "admin" && booking.userID !== user!.id) {
          return error(404, {
            message: "Booking not found",
          });
        }

        await db.delete(bookings).where(eq(bookings.id, parsedID));
        return {
          message: "Booking deleted",
        };
      } catch (err) {
        return error(500, {
          message: "Internal server error",
        });
      }
    },
    {
      auth: ["admin", "user"],
      tags: ["Booking"],
      response: {
        200: t.Object({
          message: t.String({ minLength: 1 }),
        }),
        500: t.Object({
          message: t.String({ minLength: 1 }),
        }),
        404: t.Object({
          message: t.String({ minLength: 1 }),
        }),
      },
    },
  );
