// ./src/api/attendance/controllers/attendance.ts
import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::attendance.attendance",
  ({ strapi }) => ({
    // GET /attendances
    async find(ctx: any) {
      const user = ctx.state.user;
      if (user) {
        // start from whatever filters exist (or empty object)
        const existingFilters: Record<string, any> = ctx.query.filters || {};

        ctx.query.filters = {
          ...existingFilters,
          student: {
            // if you’ve used Strapi’s built-in creator field:
            createdBy: user.id,
          },
        };

        // ensure we populate student.createdBy so the filter works
        ctx.query.populate = { student: { populate: ["createdBy"] } };
      }

      return await super.find(ctx);
    },

    // GET /attendances/:id
    async findOne(ctx: any) {
      const user = ctx.state.user;

      // load the record with its student.createdBy
      const attendance: any = await strapi.entityService.findOne(
        "api::attendance.attendance",
        ctx.params.id,
        { populate: { student: { populate: ["createdBy"] } } }
      );

      // now we can safely index into .student.createdBy
      if (
        !attendance ||
        attendance.student.createdBy.id.toString() !== user.id.toString()
      ) {
        return ctx.unauthorized(
          "You can only view attendance for students you created"
        );
      }

      return await super.findOne(ctx);
    },
  })
);
