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
        async ({ body, error }) => {
            try {
                const value = {
                    name: body.name,
                    address: body.address,
                    telephoneNumber: body.telephoneNumber.replace(/[^0-9]/g, ""),
                };

                await db.insert(campgrounds).values(value);
                return {
                    message: "Campground created",
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
            tags: ["Campground"],
            response: {
                200: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    );
