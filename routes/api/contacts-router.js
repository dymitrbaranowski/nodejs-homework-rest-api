import express from "express";

// import contactService from "../../models/contacts/index.js";

import contactsController from "../../controllers/contacts-controller.js";
import {
  authenticate,
  isEmptyBody,
  isValidId,
  upload,
} from "../../middlewares/index.js";

import { validateBody } from "../../decorators/index.js";

import {
  contactAddSchema,
  contactUpdateSchema,
  contactFavoriteSchema,
} from "../../models/Contacts.js";
const contactsRouter = express.Router();

contactsRouter.use(authenticate);

contactsRouter.get("/", contactsController.getAll);

contactsRouter.get("/:id", isValidId, contactsController.getById);

// upload.filds([{name: "poster",maxCount:1}])
//  upload.arrey("poster",8)
contactsRouter.post(
  "/",
  upload.single("avatar"),
  isEmptyBody,
  validateBody(contactAddSchema),
  contactsController.add
);

contactsRouter.put(
  "/:id",
  isEmptyBody,
  validateBody(contactUpdateSchema),
  contactsController.updateById
);

contactsRouter.patch(
  "/:id/favorite",
  isValidId,
  isEmptyBody,
  validateBody(contactFavoriteSchema),
  contactsController.updateById
);

contactsRouter.delete("/:id", isValidId, contactsController.deleteById);

export default contactsRouter;
