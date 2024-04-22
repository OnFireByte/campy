import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "../../db/db";
import { campgrounds } from "../../db/schema";
import { authPlugin } from "../auth/plugin";

export const campgroundsRouter = new Elysia({
    prefix: "/campgrounds",
})
    .use(authPlugin)
    .get(
        "/",
        async ({ error }) => {
            try {
                return {
                    campgrounds: await db.query.campgrounds.findMany(),
                };
            } catch (err) {
                return error(500, {
                    message: "Internal server error",
                });
            }
        },
        {
            tags: ["Campground"],
            response: {
                200: t.Object({
                    campgrounds: t.Array(
                        t.Object({
                            id: t.Number(),
                            name: t.String(),
                            address: t.String(),
                            telephoneNumber: t.String(),
                        })
                    ),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    )
    .get(
        "/:id",
        async ({ params, error }) => {
            try {
                const campground = await db.query.campgrounds.findFirst({
                    where: eq(campgrounds.id, params.id),
                });

                if (!campground) {
                    return error(404, {
                        message: "Campground not found",
                    });
                }

                return campground;
            } catch (err) {
                return error(500, {
                    message: "Internal server error",
                });
            }
        },
        {
            params: t.Object({
                id: t.Numeric(),
            }),
            tags: ["Campground"],
            response: {
                200: t.Object({
                    id: t.Number(),
                    name: t.String(),
                    address: t.String(),
                    telephoneNumber: t.String(),
                }),
                404: t.Object({
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
        async ({ body, error, set }) => {
            try {
                const value = {
                    name: body.name,
                    address: body.address,
                    telephoneNumber: body.telephoneNumber.replace(/[^0-9]/g, ""),
                };

                const res = await db.insert(campgrounds).values(value);
                if (!res) {
                    return error(500, {
                        message: "Internal server error",
                    });
                }

                const data = await db.query.campgrounds.findFirst({
                    where: eq(campgrounds.id, res[0]!.insertId),
                });
                if (!data) {
                    return error(500, {
                        message: "Internal server error",
                    });
                }

                set.status = 201;
                return {
                    message: "Campground created",
                    data: data,
                };
            } catch (err) {
                return error(500, {
                    message: "Internal server error",
                });
            }
        },
        {
            body: t.Object({
                name: t.String({ minLength: 1 }),
                address: t.String({ minLength: 1 }),
                telephoneNumber: t.String({ minLength: 1 }),
            }),
            auth: ["admin"],
            tags: ["Campground"],
            headers: t.Object({
                authorization: t.String({
                    description: "Bearer token",
                }),
            }),
            response: {
                200: t.Object({
                    message: t.String({ minLength: 1 }),
                    data: t.Object({
                        id: t.Number(),
                        name: t.String(),
                        address: t.String(),
                        telephoneNumber: t.String(),
                    }),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    )
    .put(
        "/:id",
        async ({ params: { id }, body, error }) => {
            const campground = await db.query.campgrounds.findFirst({
                where: eq(campgrounds.id, id),
            });

            if (!campground) {
                return error(404, {
                    message: "Campground not found",
                });
            }

            try {
                await db
                    .update(campgrounds)
                    .set({
                        name: body.name,
                        address: body.address,
                        telephoneNumber: body.telephoneNumber?.replace(/[^0-9]/g, ""),
                    })
                    .where(eq(campgrounds.id, id));
            } catch (err) {
                return error(500, {
                    message: "Internal server error",
                });
            }

            return {
                message: "Campground updated",
            };
        },
        {
            params: t.Object({
                id: t.Numeric({
                    description: "Campground ID",
                }),
            }),
            body: t.Object({
                name: t.Optional(t.String({ minLength: 1 })),
                address: t.Optional(t.String({ minLength: 1 })),
                telephoneNumber: t.Optional(t.String({ minLength: 1 })),
            }),
            auth: ["admin"],
            tags: ["Campground"],
            headers: t.Object({
                authorization: t.String({
                    description: "Bearer token",
                }),
            }),
            response: {
                200: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                404: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, error }) => {
            const campground = await db.query.campgrounds.findFirst({
                where: eq(campgrounds.id, id),
            });

            if (!campground) {
                return error(404, {
                    message: "Campground not found",
                });
            }

            try {
                await db.delete(campgrounds).where(eq(campgrounds.id, id));
            } catch (err) {
                return error(500, {
                    message: "Internal server error",
                });
            }

            return {
                message: "Campground deleted",
            };
        },
        {
            params: t.Object({
                id: t.Numeric({
                    description: "Campground ID",
                }),
            }),
            auth: ["admin"],
            tags: ["Campground"],
            headers: t.Object({
                authorization: t.String({
                    description: "Bearer token",
                }),
            }),
            response: {
                200: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                404: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    );
