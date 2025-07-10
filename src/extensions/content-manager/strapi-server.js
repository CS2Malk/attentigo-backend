"use strict";

module.exports = (plugin) => {
  // Grab the Content Manager controllers
  const cm = plugin.controllers["content-manager"];

  // 1) Override the listing (GET /content-manager/collection-types/:uid)
  const originalFind = cm.find;
  cm.find = async (ctx) => {
    const { uid } = ctx.params;
    // only apply to the attendance collection
    if (uid === "api::attendance.attendance") {
      const userId = ctx.state.user.id;
      // merge whatever filters the dashboard already sent
      const existing = ctx.query.filters || {};
      ctx.query.filters = {
        ...existing,
        // keep only attendance whose student.createdBy = this admin
        student: {
          createdBy: {
            id: { $eq: userId },
          },
        },
      };
      // ensure the relation is populated so the dashboard can render links, etc.
      ctx.query.populate = { student: { populate: ["createdBy"] } };
    }
    return await originalFind(ctx);
  };

  // 2) Override the single-entry fetch (GET /content-manager/collection-types/:uid/:id)
  const originalFindOne = cm.findOne;
  cm.findOne = async (ctx) => {
    const { uid, id } = ctx.params;
    if (uid === "api::attendance.attendance") {
      // check ownership before returning anything
      const attendance = await strapi.entityService.findOne(
        "api::attendance.attendance",
        id,
        { populate: { student: { populate: ["createdBy"] } } }
      );
      if (attendance.student.createdBy.id !== ctx.state.user.id) {
        return ctx.unauthorized(
          "You can only view your own students’ attendance"
        );
      }
    }
    return await originalFindOne(ctx);
  };

  return plugin;
};
