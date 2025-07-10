// src/api/attendance/content-types/attendance/lifecycles.js
"use strict";

module.exports = {
  async beforeFind(event) {
    const { params, context } = event;
    const { state } = context;
    const user = state.user;

    if (user) {
      params.filters = {
        ...(params.filters || {}),
        student: {
          createdBy: { id: { $eq: user.id } },
        },
      };
      params.populate = {
        ...(params.populate || {}),
        student: { populate: ["createdBy"] },
      };
    }
  },

  async beforeFindOne(event) {
    const { params, context } = event;
    const { state } = context;
    const user = state.user;
    const id = params.where?.id;

    if (user && id) {
      // Use the new db.query API here
      const record = await strapi.db
        .query("api::attendance.attendance")
        .findOne({
          where: { id },
          populate: { student: { populate: ["createdBy"] } },
        });

      if (
        !record ||
        record.student.createdBy.id.toString() !== user.id.toString()
      ) {
        throw strapi.errors.unauthorized(
          "You can only view attendance for students you created"
        );
      }
    }
  },
};
