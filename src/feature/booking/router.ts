import { and, eq, gt } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "../../db/db";
import { bookings } from "../../db/schema";
import { authPlugin } from "../auth/plugin";

export const bookingRouter = new Elysia({
    prefix: "/bookings",
})
    .use(authPlugin)
    .get(
        "/",
        async ({ user, error }) => {
            try {
                if (user!.role === "admin") {
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
                        })
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
        }
    )
    .post(
        "/",
        async ({ user, error, body, set }) => {
            const { campgroundID, date } = body;
            try {
                const booked = await db.query.bookings.findMany({
                    where: and(eq(bookings.userID, user!.id), gt(bookings.date, new Date())),
                });

                if (booked && booked.length >= 3) {
                    return error(403, {
                        message: "You can only book 3 campgrounds",
                    });
                }

                const booking = await db.insert(bookings).values({
                    userID: user!.id,
                    campgroundID,
                    date,
                });

                set.status = 201;
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
                403: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    )
    .get(
        "/:id",
        async ({ params, user, error }) => {
            try {
                console.log(params.id, user!.id);
                const booking = await db.query.bookings.findFirst({
                    where: (booking, { eq }) => eq(booking.id, params.id),
                });

                if (!booking) {
                    return error(404, {
                        message: "Booking not found",
                    });
                }

                if (user!.role !== "admin" && booking.userID !== user!.id) {
                    return error(403, {
                        message: "You don't have permission to access this resource",
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
            params: t.Object({
                id: t.Numeric(),
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
                403: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    )
    .put(
        "/:id",
        async ({ user, params, error, body }) => {
            try {
                const booking = await db.query.bookings.findFirst({
                    where: (booking, { eq }) => eq(booking.id, params.id),
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
                    where: (booking, { eq }) => eq(booking.id, params.id),
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
            params: t.Object({
                id: t.Numeric(),
            }),
            body: t.Object({
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
                404: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
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
        }
    );
